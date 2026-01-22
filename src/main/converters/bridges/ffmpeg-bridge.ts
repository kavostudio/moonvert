import { app } from 'electron';
import { logDebug } from 'main/utils/debug-logger';
import { getAbortErrorMessage } from 'main/utils/abort-utils';
import { execSync, spawn, type ChildProcess } from 'node:child_process';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { VideoFileFormat } from 'shared/types/conversion.types';
import type { BridgeConversionFunction, BridgeConversionOptions, BridgeConversionResult } from './bridge.types';

type ConversionOptions = BridgeConversionOptions<VideoFileFormat, VideoFileFormat>;

type ConversionResult = BridgeConversionResult<{}, {}>;

class FfmpegBridge {
    private readonly ffmpegPath: string;
    private readonly ffprobePath: string;
    private readonly isDev: boolean;

    constructor() {
        this.isDev = process.env.NODE_ENV === 'development';
        this.ffmpegPath = this.findBinary('ffmpeg');
        this.ffprobePath = this.findBinary('ffprobe');

        void logDebug('FFmpeg bridge initialized', {
            ffmpegPath: this.ffmpegPath || undefined,
            ffprobePath: this.ffprobePath || undefined,
            isDev: this.isDev,
        });
    }

    private findBinary(binaryName: 'ffmpeg' | 'ffprobe'): string {
        if (this.isDev) {
            const localPath = join(app.getAppPath(), 'dist', 'ffmpeg', 'darwin-arm64', binaryName);
            if (existsSync(localPath)) {
                return localPath;
            }

            try {
                const result = execSync(`which ${binaryName}`, {
                    encoding: 'utf-8',
                    env: {
                        ...process.env,
                        PATH: ['/opt/homebrew/bin', '/usr/local/bin', process.env.PATH || ''].join(':'),
                    },
                });
                return result.trim();
            } catch {
                const paths = [`/opt/homebrew/bin/${binaryName}`, `/usr/local/bin/${binaryName}`];
                return paths.find((path) => existsSync(path)) || binaryName;
            }
        }

        const resourcesPath = process.resourcesPath;
        return join(resourcesPath, 'ffmpeg', binaryName);
    }

    private async getDurationMs(sourcePath: string): Promise<number> {
        return new Promise((resolve) => {
            const args = ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', sourcePath];
            const probe = spawn(this.ffprobePath, args);
            let output = '';

            probe.stdout?.on('data', (chunk) => {
                output += chunk.toString();
            });

            probe.on('close', () => {
                const seconds = Number.parseFloat(output.trim());
                if (!Number.isFinite(seconds) || seconds <= 0) {
                    resolve(0);
                    return;
                }
                resolve(Math.round(seconds * 1000));
            });

            probe.on('error', () => resolve(0));
        });
    }

    private buildArgs(sourcePath: string, targetPath: string, targetFormat: VideoFileFormat): string[] {
        const args = ['-y', '-i', sourcePath];

        switch (targetFormat) {
            case 'mp4':
                args.push('-map', '0', '-c:v', 'libx264', '-preset', 'medium', '-crf', '23', '-c:a', 'aac', '-movflags', '+faststart');
                break;
            case 'm4v':
                args.push('-map', '0', '-c:v', 'libx264', '-preset', 'medium', '-crf', '23', '-c:a', 'aac', '-movflags', '+faststart');
                break;
            case 'mov':
                args.push('-map', '0', '-c:v', 'libx264', '-preset', 'medium', '-crf', '23', '-c:a', 'aac');
                break;
            case 'webm':
                args.push('-map', '0', '-c:v', 'libvpx-vp9', '-crf', '32', '-b:v', '0', '-c:a', 'libopus');
                break;
            case 'mkv':
                args.push('-map', '0', '-c:v', 'libx264', '-preset', 'medium', '-crf', '23', '-c:a', 'aac');
                break;
            case 'avi':
                args.push('-map', '0', '-c:v', 'libx264', '-preset', 'medium', '-crf', '23', '-c:a', 'aac');
                break;
            case '3gp':
                args.push('-map', '0', '-c:v', 'libx264', '-preset', 'medium', '-crf', '26', '-c:a', 'aac', '-f', '3gp');
                break;
            case 'flv':
                args.push('-map', '0', '-c:v', 'libx264', '-preset', 'medium', '-crf', '23', '-c:a', 'aac', '-f', 'flv');
                break;
            case 'ts':
            case 'mts':
            case 'm2ts':
                args.push('-map', '0', '-c:v', 'libx264', '-preset', 'medium', '-crf', '23', '-c:a', 'aac', '-f', 'mpegts');
                break;
            case 'wmv':
                args.push('-map', '0', '-c:v', 'libx264', '-preset', 'medium', '-crf', '23', '-c:a', 'aac', '-f', 'asf');
                break;
            case 'ogv':
                args.push('-map', '0', '-c:v', 'theora', '-c:a', 'vorbis', '-f', 'ogg');
                break;
            case 'mpg':
            case 'mpeg':
                args.push('-map', '0', '-c:v', 'mpeg2video', '-q:v', '3', '-c:a', 'mp2', '-f', 'mpeg');
                break;
            case 'mxf':
                args.push('-map', '0', '-c:v', 'mpeg2video', '-q:v', '3', '-c:a', 'mp2', '-f', 'mxf');
                break;
            case 'vob':
                args.push('-map', '0', '-c:v', 'mpeg2video', '-q:v', '3', '-c:a', 'mp2', '-f', 'vob');
                break;
            case 'gif':
                args.push('-map', '0:v:0', '-an', '-vf', 'fps=15,scale=iw:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse', '-loop', '0');
                break;
            default:
                break;
        }

        args.push('-progress', 'pipe:1', '-nostats', targetPath);

        return args;
    }

    async convert(options: ConversionOptions): Promise<ConversionResult> {
        const { sourcePath, targetPath, targetFormat, onProgress, fileId, abortSignal } = options;

        if (abortSignal.aborted) {
            const errorMessage = getAbortErrorMessage(abortSignal);
            onProgress({
                fileId,
                status: 'failed',
                progress: 100,
                error: errorMessage,
            });
            return { success: false, error: errorMessage };
        }

        const durationMs = await this.getDurationMs(sourcePath);

        return new Promise((resolve) => {
            let ffmpegProcess: ChildProcess;
            let errorOutput = '';
            let settled = false;
            const initialProgress = 5;
            let lastProgress = initialProgress;

            const finalize = async (result: ConversionResult) => {
                if (settled) return;
                settled = true;
                abortSignal.removeEventListener('abort', onAbort);
                resolve(result);
            };

            const onAbort = () => {
                const errorMessage = getAbortErrorMessage(abortSignal);
                if (ffmpegProcess && !ffmpegProcess.killed) {
                    ffmpegProcess.kill('SIGTERM');
                }
                onProgress({
                    fileId,
                    status: 'failed',
                    progress: 100,
                    error: errorMessage,
                });
                finalize({ success: false, error: errorMessage });
            };

            const args = this.buildArgs(sourcePath, targetPath, targetFormat);

            void logDebug('FFmpeg conversion starting', {
                fileId,
                sourcePath,
                targetPath,
                targetFormat,
                durationMs,
                args,
            });

            onProgress({
                fileId,
                status: 'processing',
                progress: initialProgress,
                message: 'Starting FFmpeg conversion...',
            });

            ffmpegProcess = spawn(this.ffmpegPath, args);

            abortSignal.addEventListener('abort', onAbort, { once: true });

            ffmpegProcess.stdout?.on('data', (chunk) => {
                const lines = chunk
                    .toString()
                    .split('\n')
                    .map((line: string) => line.trim())
                    .filter(Boolean);

                for (const line of lines) {
                    if (line.startsWith('out_time_ms=')) {
                        const outTimeMs = Number.parseInt(line.replace('out_time_ms=', ''), 10);
                        if (!Number.isFinite(outTimeMs) || durationMs <= 0) {
                            continue;
                        }
                        const percent = Math.min(99, Math.max(0, Math.floor((outTimeMs / (durationMs * 1000)) * 100)));
                        if (percent > lastProgress) {
                            lastProgress = percent;
                            onProgress({
                                fileId,
                                status: 'processing',
                                progress: percent,
                                message: 'Converting video...',
                            });
                        }
                    }
                }
            });

            ffmpegProcess.stderr?.on('data', (chunk) => {
                const message = chunk.toString();
                errorOutput += message;
            });

            ffmpegProcess.on('close', async (code) => {
                if (code === 0) {
                    try {
                        const data = await readFile(targetPath);
                        const fileSize = data.length;
                        finalize({
                            success: true,
                            outputPath: targetPath,
                            data,
                            fileSize,
                        });
                    } catch (error) {
                        const message = error instanceof Error ? error.message : 'Unknown error';
                        const errorMsg = `Failed to read output file: ${message}`;
                        onProgress({
                            fileId,
                            status: 'failed',
                            progress: 100,
                            error: errorMsg,
                        });
                        finalize({ success: false, error: errorMsg });
                    }
                } else {
                    const errorMessage = errorOutput.trim() || `FFmpeg exited with code ${code}`;
                    void logDebug('FFmpeg conversion failed', {
                        fileId,
                        code,
                        error: errorMessage,
                    });
                    onProgress({
                        fileId,
                        status: 'failed',
                        progress: 100,
                        error: errorMessage,
                    });
                    finalize({ success: false, error: errorMessage });
                }
            });

            ffmpegProcess.on('error', (error) => {
                const errorMsg = error.message.includes('ENOENT')
                    ? 'FFmpeg binary not found. Please re-install the application or run the ffmpeg download script.'
                    : `FFmpeg process error: ${error.message}`;

                void logDebug('FFmpeg process error', {
                    fileId,
                    error: errorMsg,
                });

                onProgress({
                    fileId,
                    status: 'failed',
                    progress: 100,
                    error: errorMsg,
                });

                finalize({ success: false, error: errorMsg });
            });
        });
    }
}

let ffmpegBridge: FfmpegBridge;

function getFfmpegBridge(): FfmpegBridge {
    if (!ffmpegBridge) {
        ffmpegBridge = new FfmpegBridge();
    }
    return ffmpegBridge;
}

const convert: BridgeConversionFunction<ConversionOptions, ConversionResult> = async (options) => {
    const bridge = getFfmpegBridge();
    return bridge.convert(options);
};

export const $$ffmpegBridge = {
    convert,
};
