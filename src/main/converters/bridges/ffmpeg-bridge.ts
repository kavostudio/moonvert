import { app } from 'electron';
import { logDebug } from 'main/utils/debug-logger';
import { getAbortErrorMessage } from 'main/utils/abort-utils';
import { execSync, spawn, type ChildProcess } from 'node:child_process';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { AudioFileFormat, VideoFileFormat, AudioConversionOptions as AudioOptions } from 'shared/types/conversion.types';
import type { BridgeConversionFunction, BridgeConversionOptions, BridgeConversionResult } from './bridge.types';

type ConversionOptions = BridgeConversionOptions<VideoFileFormat, VideoFileFormat>;

type ConversionResult = BridgeConversionResult<{}, {}>;

type AudioConversionOptions = BridgeConversionOptions<AudioFileFormat, AudioFileFormat, { audioOptions?: Partial<AudioOptions> }>;

type AudioConversionResult = BridgeConversionResult<{}, {}>;

class FfmpegBridge {
    private readonly ffmpegPath: string;
    private readonly isDev: boolean;

    constructor() {
        this.isDev = process.env.NODE_ENV === 'development';
        this.ffmpegPath = this.findFfmpegBinary();

        void logDebug('FFmpeg bridge initialized', {
            ffmpegPath: this.ffmpegPath || undefined,
            isDev: this.isDev,
        });
    }

    private findFfmpegBinary(): string {
        if (this.isDev) {
            const localPath = join(app.getAppPath(), 'dist', 'ffmpeg', 'darwin-arm64', 'ffmpeg');
            if (existsSync(localPath)) {
                return localPath;
            }

            try {
                const result = execSync('which ffmpeg', {
                    encoding: 'utf-8',
                    env: {
                        ...process.env,
                        PATH: ['/opt/homebrew/bin', '/usr/local/bin', process.env.PATH || ''].join(':'),
                    },
                });
                return result.trim();
            } catch {
                const paths = ['/opt/homebrew/bin/ffmpeg', '/usr/local/bin/ffmpeg'];
                return paths.find((path) => existsSync(path)) || 'ffmpeg';
            }
        }

        const resourcesPath = process.resourcesPath;
        return join(resourcesPath, 'ffmpeg', 'ffmpeg');
    }

    private async getDurationMs(sourcePath: string): Promise<number> {
        return new Promise((resolve) => {
            const args = ['-i', sourcePath, '-f', 'null', '-'];
            const ffmpeg = spawn(this.ffmpegPath, args);
            let stderrOutput = '';

            ffmpeg.stderr?.on('data', (chunk) => {
                stderrOutput += chunk.toString();
            });

            ffmpeg.on('close', () => {
                // Parse duration from stderr output: "Duration: 00:01:23.45"
                const durationMatch = stderrOutput.match(/Duration:\s*(\d{2}):(\d{2}):(\d{2})\.(\d{2,3})/);
                if (durationMatch) {
                    const hours = Number.parseInt(durationMatch[1], 10);
                    const minutes = Number.parseInt(durationMatch[2], 10);
                    const seconds = Number.parseInt(durationMatch[3], 10);
                    const centiseconds = Number.parseInt(durationMatch[4].padEnd(3, '0'), 10);
                    const totalMs = hours * 3600000 + minutes * 60000 + seconds * 1000 + centiseconds;
                    resolve(totalMs);
                    return;
                }
                resolve(0);
            });

            ffmpeg.on('error', () => resolve(0));

            // Kill the process quickly - we only need the metadata which appears immediately
            setTimeout(() => {
                if (!ffmpeg.killed) {
                    ffmpeg.kill('SIGTERM');
                }
            }, 2000);
        });
    }

    private readonly VIDEO_PRESETS: Record<
        VideoFileFormat,
        {
            hwAccel?: { videoCodec: string; bitrate: string };
            software: { videoCodec: string; qualityArgs: string[] };
            audioCodec: string;
            extraArgs?: string[];
            format?: string;
        }
    > = {
        // H.264 compatible formats (support hardware acceleration)
        mp4: {
            hwAccel: { videoCodec: 'h264_videotoolbox', bitrate: '8M' },
            software: { videoCodec: 'libx264', qualityArgs: ['-preset', 'fast', '-crf', '23'] },
            audioCodec: 'aac',
            extraArgs: ['-movflags', '+faststart'],
        },
        m4v: {
            hwAccel: { videoCodec: 'h264_videotoolbox', bitrate: '8M' },
            software: { videoCodec: 'libx264', qualityArgs: ['-preset', 'fast', '-crf', '23'] },
            audioCodec: 'aac',
            extraArgs: ['-movflags', '+faststart'],
        },
        mov: {
            hwAccel: { videoCodec: 'h264_videotoolbox', bitrate: '8M' },
            software: { videoCodec: 'libx264', qualityArgs: ['-preset', 'fast', '-crf', '23'] },
            audioCodec: 'aac',
        },
        mkv: {
            hwAccel: { videoCodec: 'h264_videotoolbox', bitrate: '8M' },
            software: { videoCodec: 'libx264', qualityArgs: ['-preset', 'fast', '-crf', '23'] },
            audioCodec: 'aac',
        },
        avi: {
            hwAccel: { videoCodec: 'h264_videotoolbox', bitrate: '8M' },
            software: { videoCodec: 'libx264', qualityArgs: ['-preset', 'fast', '-crf', '23'] },
            audioCodec: 'aac',
        },
        '3gp': {
            hwAccel: { videoCodec: 'h264_videotoolbox', bitrate: '2M' },
            software: { videoCodec: 'libx264', qualityArgs: ['-preset', 'fast', '-crf', '26'] },
            audioCodec: 'aac',
            format: '3gp',
        },
        flv: {
            hwAccel: { videoCodec: 'h264_videotoolbox', bitrate: '8M' },
            software: { videoCodec: 'libx264', qualityArgs: ['-preset', 'fast', '-crf', '23'] },
            audioCodec: 'aac',
            format: 'flv',
        },
        ts: {
            hwAccel: { videoCodec: 'h264_videotoolbox', bitrate: '8M' },
            software: { videoCodec: 'libx264', qualityArgs: ['-preset', 'fast', '-crf', '23'] },
            audioCodec: 'aac',
            format: 'mpegts',
        },
        mts: {
            hwAccel: { videoCodec: 'h264_videotoolbox', bitrate: '8M' },
            software: { videoCodec: 'libx264', qualityArgs: ['-preset', 'fast', '-crf', '23'] },
            audioCodec: 'aac',
            format: 'mpegts',
        },
        m2ts: {
            hwAccel: { videoCodec: 'h264_videotoolbox', bitrate: '8M' },
            software: { videoCodec: 'libx264', qualityArgs: ['-preset', 'fast', '-crf', '23'] },
            audioCodec: 'aac',
            format: 'mpegts',
        },
        // Software-only formats (no hardware encoder available)
        webm: {
            software: { videoCodec: 'libvpx-vp9', qualityArgs: ['-crf', '32', '-b:v', '0'] },
            audioCodec: 'libopus',
        },
        wmv: {
            software: { videoCodec: 'libx264', qualityArgs: ['-preset', 'fast', '-crf', '23'] },
            audioCodec: 'aac',
            format: 'asf',
        },
        ogv: {
            software: { videoCodec: 'libtheora', qualityArgs: ['-q:v', '7'] },
            audioCodec: 'libvorbis',
            format: 'ogg',
        },
        mpg: {
            software: { videoCodec: 'mpeg2video', qualityArgs: ['-q:v', '3'] },
            audioCodec: 'mp2',
            format: 'mpeg',
        },
        mpeg: {
            software: { videoCodec: 'mpeg2video', qualityArgs: ['-q:v', '3'] },
            audioCodec: 'mp2',
            format: 'mpeg',
        },
        mxf: {
            software: { videoCodec: 'mpeg2video', qualityArgs: ['-q:v', '3'] },
            audioCodec: 'pcm_s16le',
            format: 'mxf',
        },
        vob: {
            software: { videoCodec: 'mpeg2video', qualityArgs: ['-q:v', '3'] },
            audioCodec: 'mp2',
            format: 'vob',
        },
        // Gif will use its own configuration
        gif: {
            software: { videoCodec: 'gif', qualityArgs: [] },
            audioCodec: 'none',
        },
    };

    private buildArgs(sourcePath: string, targetPath: string, targetFormat: VideoFileFormat): string[] {
        const args = ['-y', '-i', sourcePath];

        // GIF is special - uses complex filter instead of codecs
        if (targetFormat === 'gif') {
            args.push('-map', '0:v:0', '-an', '-vf', 'fps=15,scale=iw:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse', '-loop', '0');
            args.push('-progress', 'pipe:1', '-nostats', targetPath);
            return args;
        }

        const preset = this.VIDEO_PRESETS[targetFormat];

        const useHardwareAccel = process.platform === 'darwin' && preset.hwAccel;

        args.push('-map', '0');

        if (useHardwareAccel && preset.hwAccel) {
            args.push('-c:v', preset.hwAccel.videoCodec, '-b:v', preset.hwAccel.bitrate);
        } else {
            args.push('-c:v', preset.software.videoCodec, ...preset.software.qualityArgs);
        }

        args.push('-c:a', preset.audioCodec);

        if (preset.extraArgs) {
            args.push(...preset.extraArgs);
        }

        if (preset.format) {
            args.push('-f', preset.format);
        }

        args.push('-progress', 'pipe:1', '-nostats', targetPath);

        return args;
    }

    private readonly AUDIO_PRESETS: Record<
        AudioFileFormat,
        {
            codec: string;
            bitrateFlag?: string;
            defaultBitrate?: number;
            extraArgs?: string[];
            format?: string;
        }
    > = {
        mp3: { codec: 'libmp3lame', bitrateFlag: '-b:a', defaultBitrate: 192 },
        flac: { codec: 'flac', extraArgs: ['-compression_level', '8'] },
        aac: { codec: 'aac', bitrateFlag: '-b:a', defaultBitrate: 192 },
        m4a: { codec: 'aac', bitrateFlag: '-b:a', defaultBitrate: 192, format: 'ipod' },
        ogg: { codec: 'libvorbis', bitrateFlag: '-b:a', defaultBitrate: 192 },
        opus: { codec: 'libopus', bitrateFlag: '-b:a', defaultBitrate: 128 },
        wav: { codec: 'pcm_s16le' },
        aiff: { codec: 'pcm_s16be', format: 'aiff' },
        wma: { codec: 'wmav2', bitrateFlag: '-b:a', defaultBitrate: 192 },
        alac: { codec: 'alac' },
        ape: { codec: 'ape' },
        wv: { codec: 'wavpack' },
    };

    private buildAudioArgs(sourcePath: string, targetPath: string, targetFormat: AudioFileFormat, options?: Partial<AudioOptions>): string[] {
        const args = ['-y', '-i', sourcePath];

        const preset = this.AUDIO_PRESETS[targetFormat];
        if (!preset) {
            args.push('-c:a', 'copy');
            args.push('-progress', 'pipe:1', '-nostats', targetPath);
            return args;
        }

        args.push('-c:a', preset.codec);

        if (preset.bitrateFlag && preset.defaultBitrate) {
            const bitrate = options?.bitrate || preset.defaultBitrate;
            args.push(preset.bitrateFlag, `${bitrate}k`);
        }

        if (preset.extraArgs) {
            args.push(...preset.extraArgs);
        }

        if (options?.sampleRate) {
            args.push('-ar', String(options.sampleRate));
        }
        if (options?.channels) {
            args.push('-ac', String(options.channels));
        }

        if (preset.format) {
            args.push('-f', preset.format);
        }

        args.push('-progress', 'pipe:1', '-nostats', targetPath);
        return args;
    }

    /**
     * Core FFmpeg execution - used by both video and audio conversion
     */
    private async runFfmpeg(
        args: string[],
        options: {
            sourcePath: string;
            targetPath: string;
            fileId: string;
            onProgress: ConversionOptions['onProgress'];
            abortSignal: AbortSignal;
            mediaType: 'video' | 'audio';
        },
    ): Promise<ConversionResult> {
        const { sourcePath, targetPath, fileId, onProgress, abortSignal, mediaType } = options;

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

            void logDebug(`FFmpeg ${mediaType} conversion starting`, {
                fileId,
                sourcePath,
                targetPath,
                durationMs,
                args,
            });

            onProgress({
                fileId,
                status: 'processing',
                progress: initialProgress,
                message: `Starting ${mediaType} conversion...`,
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
                                message: `Converting ${mediaType}...`,
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
                    void logDebug(`FFmpeg ${mediaType} conversion failed`, {
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

    async convert(options: ConversionOptions): Promise<ConversionResult> {
        const { sourcePath, targetPath, targetFormat, onProgress, fileId, abortSignal } = options;
        const args = this.buildArgs(sourcePath, targetPath, targetFormat);
        return this.runFfmpeg(args, { sourcePath, targetPath, fileId, onProgress, abortSignal, mediaType: 'video' });
    }

    async convertAudio(options: AudioConversionOptions): Promise<AudioConversionResult> {
        const { sourcePath, targetPath, targetFormat, onProgress, fileId, abortSignal, audioOptions } = options;
        const args = this.buildAudioArgs(sourcePath, targetPath, targetFormat, audioOptions);
        return this.runFfmpeg(args, { sourcePath, targetPath, fileId, onProgress, abortSignal, mediaType: 'audio' });
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

const convertAudio: BridgeConversionFunction<AudioConversionOptions, AudioConversionResult> = async (options) => {
    const bridge = getFfmpegBridge();
    return bridge.convertAudio(options);
};

export const $$ffmpegBridge = {
    convert,
    convertAudio,
};
