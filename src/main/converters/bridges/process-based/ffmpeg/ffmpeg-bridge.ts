import { app } from 'electron';
import { abortable } from 'main/utils/abortable';
import { logDebug } from 'main/utils/debug-logger';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { stat } from 'node:fs/promises';
import { join } from 'node:path';
import type { AudioFileFormat, AudioConversionOptions as AudioOptions, VideoFileFormat } from 'shared/types/conversion.types';
import { createProgressReporter } from '../../../base/base-converter';
import type { BridgeConversionOptions, BridgeConversionResult } from '../../bridge.types';
import { buildAudioArgs, buildVideoArgs } from './ffmpeg-args';

type ConversionOptions = BridgeConversionOptions<VideoFileFormat, VideoFileFormat>;
type ConversionResult = BridgeConversionResult<{}, {}>;

type AudioConversionOptions = BridgeConversionOptions<AudioFileFormat, AudioFileFormat, { audioOptions?: Partial<AudioOptions> }>;
type AudioConversionResult = BridgeConversionResult<{}, {}>;

const isDev = process.env.NODE_ENV === 'development';

function getFfmpegPath(): string {
    if (isDev) {
        const localPath = join(app.getAppPath(), 'dist', 'ffmpeg', 'darwin-arm64', 'ffmpeg');
        if (existsSync(localPath)) {
            return localPath;
        }
        throw new Error('FFmpeg binary not found. Run: ./scripts/download-ffmpeg-darwin.sh');
    }
    return join(process.resourcesPath, 'ffmpeg', 'ffmpeg');
}

function getDurationMs(ffmpegPath: string, sourcePath: string): Promise<number> {
    return new Promise((resolve) => {
        const ffmpeg = spawn(ffmpegPath, ['-i', sourcePath, '-f', 'null', '-']);
        let stderrOutput = '';

        ffmpeg.stderr?.on('data', (chunk) => {
            stderrOutput += chunk.toString();
        });

        ffmpeg.on('close', () => {
            const match = stderrOutput.match(/Duration:\s*(\d{2}):(\d{2}):(\d{2})\.(\d{2,3})/);
            if (match) {
                const hours = Number.parseInt(match[1], 10);
                const minutes = Number.parseInt(match[2], 10);
                const seconds = Number.parseInt(match[3], 10);
                const centiseconds = Number.parseInt(match[4].padEnd(3, '0'), 10);
                resolve(hours * 3600000 + minutes * 60000 + seconds * 1000 + centiseconds);
                return;
            }
            resolve(0);
        });

        ffmpeg.on('error', () => resolve(0));

        // Kill quickly - we only need metadata which appears immediately
        setTimeout(() => {
            if (!ffmpeg.killed) {
                ffmpeg.kill('SIGTERM');
            }
        }, 2000);
    });
}

type RunFfmpegParams = {
    ffmpegPath: string;
    args: string[];
    fileId: string;
    durationMs: number;
    mediaType: 'video' | 'audio';
    onProgress: (progress: number) => void;
};

function runFfmpegProcess(params: RunFfmpegParams): { process: ReturnType<typeof spawn>; promise: Promise<void> } {
    const { ffmpegPath, args, fileId, durationMs, mediaType, onProgress } = params;
    const ffmpegProcess = spawn(ffmpegPath, args);
    let errorOutput = '';
    let lastProgress = 5;

    void logDebug(`FFmpeg ${mediaType} conversion starting`, { fileId, durationMs, args });

    const promise = new Promise<void>((resolve, reject) => {
        ffmpegProcess.stdout?.on('data', (chunk) => {
            const lines = chunk
                .toString()
                .split('\n')
                .map((line: string) => line.trim())
                .filter(Boolean);

            for (const line of lines) {
                if (line.startsWith('out_time_ms=')) {
                    const outTimeMs = Number.parseInt(line.replace('out_time_ms=', ''), 10);
                    if (!Number.isFinite(outTimeMs) || durationMs <= 0) continue;

                    const percent = Math.min(99, Math.max(0, Math.floor((outTimeMs / (durationMs * 1000)) * 100)));
                    if (percent > lastProgress) {
                        lastProgress = percent;
                        onProgress(percent);
                    }
                }
            }
        });

        ffmpegProcess.stderr?.on('data', (chunk) => {
            errorOutput += chunk.toString();
        });

        ffmpegProcess.on('close', (code) => {
            if (code === 0) {
                resolve();
            } else {
                const errorMessage = errorOutput.trim() || `FFmpeg exited with code ${code}`;
                void logDebug(`FFmpeg ${mediaType} conversion failed`, { fileId, code, error: errorMessage });
                reject(new Error(errorMessage));
            }
        });

        ffmpegProcess.on('error', (error) => {
            const errorMsg = error.message.includes('ENOENT')
                ? 'FFmpeg binary not found. Please re-install the application or run the ffmpeg download script.'
                : `FFmpeg process error: ${error.message}`;
            void logDebug('FFmpeg process error', { fileId, error: errorMsg });
            reject(new Error(errorMsg));
        });
    });

    return { process: ffmpegProcess, promise };
}

type RunFfmpegOptions = {
    args: string[];
    sourcePath: string;
    targetPath: string;
    fileId: string;
    onProgress: ConversionOptions['onProgress'];
    abortSignal: AbortSignal;
    mediaType: 'video' | 'audio';
};

async function runFfmpeg(options: RunFfmpegOptions): Promise<ConversionResult> {
    const { args, sourcePath, targetPath, fileId, onProgress, abortSignal, mediaType } = options;
    const progress = createProgressReporter(onProgress, fileId);

    const ffmpegPath = getFfmpegPath();
    const durationMs = await getDurationMs(ffmpegPath, sourcePath);

    progress.processing(5, `Starting ${mediaType} conversion...`);

    const { process: ffmpegProcess, promise } = runFfmpegProcess({
        ffmpegPath,
        args,
        fileId,
        durationMs,
        mediaType,
        onProgress: (percent) => progress.processing(percent, `Converting ${mediaType}...`),
    });

    const outcome = await abortable({
        signal: abortSignal,
        operation: () => promise,
        onAbort: () => {
            if (!ffmpegProcess.killed) {
                ffmpegProcess.kill('SIGTERM');
            }
        },
    });

    if (!outcome.success) {
        const error = outcome.aborted ? outcome.reason : outcome.error.message;
        progress.failed(error);
        return { success: false, error };
    }

    try {
        const stats = await stat(targetPath);
        return { success: true, outputPath: targetPath, fileSize: stats.size };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        const errorMsg = `Failed to read output file: ${message}`;
        progress.failed(errorMsg);
        return { success: false, error: errorMsg };
    }
}

async function convert(options: ConversionOptions): Promise<ConversionResult> {
    const { sourcePath, targetPath, targetFormat, onProgress, fileId, abortSignal } = options;
    const args = buildVideoArgs(sourcePath, targetPath, targetFormat);
    return runFfmpeg({ args, sourcePath, targetPath, fileId, onProgress, abortSignal, mediaType: 'video' });
}

async function convertAudio(options: AudioConversionOptions): Promise<AudioConversionResult> {
    const { sourcePath, targetPath, targetFormat, onProgress, fileId, abortSignal, audioOptions } = options;
    const args = buildAudioArgs(sourcePath, targetPath, targetFormat, audioOptions);
    return runFfmpeg({ args, sourcePath, targetPath, fileId, onProgress, abortSignal, mediaType: 'audio' });
}

export const $$ffmpegBridge = {
    convert,
    convertAudio,
};
