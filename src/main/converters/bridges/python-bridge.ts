import archiver from 'archiver';
import { app } from 'electron';
import { logDebug } from 'main/utils/debug-logger';
import { spawn, type ChildProcess } from 'node:child_process';
import { createWriteStream } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { GeoFileFormat } from 'shared/types/conversion.types';
import { z } from 'zod';
import type { BridgeConversionFunction, BridgeConversionOptions, BridgeConversionResult } from './bridge.types';
import { getAbortErrorMessage } from 'main/utils/abort-utils';
import { createConversionProgress } from '../base/base-converter';

const PythonProgressMessageSchema = z.discriminatedUnion('type', [
    z.object({
        type: z.literal('progress'),
        status: z.enum(['processing', 'completed', 'failed']),
        progress: z.number().min(0).max(100),
        message: z.string(),
    }),
    z.discriminatedUnion('success', [
        z.object({
            type: z.literal('result'),
            success: z.literal(true),
            output_path: z.string(),
            features_count: z.number(),
        }),
        z.object({
            type: z.literal('result'),
            success: z.literal(false),
            error: z.string(),
            traceback: z.string().optional(),
        }),
    ]),
]);

type ConversionOptions = BridgeConversionOptions<
    GeoFileFormat,
    GeoFileFormat,
    {
        initialProgress: number;
        expectedEndProgress: number;
    }
>;

type ConversionResult = BridgeConversionResult<{ featuresCount?: number }, {}>;

/**
 * Create a ZIP archive of a directory
 * Used for shapefile outputs which consist of multiple files
 */
async function zipDirectory(sourceDir: string, outputZipPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const output = createWriteStream(outputZipPath);
        const archive = archiver('zip', { zlib: { level: 9 } });

        output.on('close', () => resolve());
        output.on('error', (err) => reject(err));
        archive.on('error', (err) => reject(err));

        archive.pipe(output);
        archive.directory(sourceDir, false); // false = don't include the source directory itself
        archive.finalize();
    });
}

export class PythonBridge {
    private pythonPath: string;
    private scriptPath: string;
    private readonly isDev: boolean;

    constructor() {
        this.isDev = process.env.NODE_ENV === 'development';

        if (this.isDev) {
            // Development: use system Python
            this.pythonPath = 'python3';
            // In development, __dirname is node_modules/.dev/main
            // Script is at src/python/convert_geo.py
            this.scriptPath = join(app.getAppPath(), 'src', 'python', 'convert_geo.py');
        } else {
            // Production: use bundled PyInstaller executable
            this.pythonPath = this.getBundledPythonPath();
            this.scriptPath = ''; // Not needed for PyInstaller executable
        }
    }

    private getBundledPythonPath(): string {
        const platform = process.platform;
        const resourcesPath = process.resourcesPath;

        switch (platform) {
            case 'darwin':
                return join(resourcesPath, 'python', 'convert_geo');
            default:
                throw new Error(`Unsupported platform: ${platform}`);
        }
    }

    async convert(options: ConversionOptions): Promise<ConversionResult> {
        const { sourcePath, targetPath, sourceFormat, targetFormat, onProgress, fileId, abortSignal } = options;

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

        return new Promise((resolve, reject) => {
            let pythonProcess: ChildProcess;
            let outputPath: string | undefined;
            let featuresCount: number | undefined;
            let errorMessage = '';
            let settled = false;

            const finalize = (result: ConversionResult) => {
                if (settled) return;
                settled = true;
                abortSignal.removeEventListener('abort', onAbort);
                resolve(result);
            };

            const onAbort = () => {
                const abortMessage = getAbortErrorMessage(abortSignal);
                if (pythonProcess && !pythonProcess.killed) {
                    pythonProcess.kill('SIGTERM');
                }
                onProgress({
                    fileId,
                    status: 'failed',
                    progress: 100,
                    error: abortMessage,
                });
                finalize({ success: false, error: abortMessage });
            };

            if (this.isDev) {
                pythonProcess = spawn(this.pythonPath, [this.scriptPath, sourcePath, targetPath, sourceFormat, targetFormat]);
            } else {
                pythonProcess = spawn(this.pythonPath, [sourcePath, targetPath, sourceFormat, targetFormat]);
            }

            abortSignal.addEventListener('abort', onAbort, { once: true });

            void logDebug('Python conversion started', {
                fileId,
                sourcePath,
                targetPath,
                sourceFormat,
                targetFormat,
                isDev: this.isDev,
                pythonPath: this.pythonPath,
                scriptPath: this.scriptPath || undefined,
            });

            pythonProcess.stdout?.on('data', (data) => {
                const lines = data
                    .toString()
                    .split('\n')
                    .filter((l: string) => l.trim());

                for (const line of lines) {
                    try {
                        const parsed = JSON.parse(line);
                        const result = PythonProgressMessageSchema.safeParse(parsed);

                        if (!result.success) {
                            void logDebug('Invalid Python message format', {
                                fileId,
                                error: result.error.format(),
                                raw: line,
                            });
                            continue;
                        }

                        const msg = result.data;

                        if (msg.type === 'progress') {
                            // Scale Python's 0-100 progress to initialProgress-expectedEndProgress range
                            const initialProgress = options.initialProgress ?? 0;
                            const expectedEndProgress = options.expectedEndProgress ?? 100;
                            const scaledProgress = initialProgress + (msg.progress / 100) * (expectedEndProgress - initialProgress);

                            onProgress(
                                createConversionProgress.processing({
                                    fileId: options.fileId,
                                    progress: Math.round(scaledProgress),
                                }),
                            );
                        } else if (msg.type === 'result') {
                            if (msg.success) {
                                outputPath = msg.output_path;
                                featuresCount = msg.features_count;
                            } else {
                                errorMessage = msg.error || 'Unknown error';
                                if (msg.traceback) {
                                    void logDebug('Python traceback', {
                                        fileId,
                                        traceback: msg.traceback,
                                    });
                                }
                            }
                        }
                    } catch (e) {
                        void logDebug('Failed to parse Python output', {
                            fileId,
                            raw: line,
                        });
                    }
                }
            });

            pythonProcess.stderr?.on('data', (data) => {
                const message = data.toString();
                void logDebug('Python stderr', {
                    fileId,
                    message,
                });
                errorMessage += message;
            });

            pythonProcess.on('close', async (code) => {
                if (code === 0 && outputPath) {
                    try {
                        const { readFile, stat } = await import('fs/promises');
                        const stats = await stat(outputPath);

                        let data: Buffer;
                        let fileSize: number;
                        let finalOutputPath = outputPath;

                        // Check if output is a directory (for shapefiles)
                        if (stats.isDirectory()) {
                            const { randomBytes } = await import('crypto');
                            const zipFileName = `${randomBytes(8).toString('hex')}.zip`;
                            const zipPath = join(tmpdir(), zipFileName);

                            await zipDirectory(outputPath, zipPath);

                            data = await readFile(zipPath);
                            const zipStats = await stat(zipPath);
                            fileSize = zipStats.size;
                            finalOutputPath = zipPath;
                        } else {
                            // Single file output
                            data = await readFile(outputPath);
                            fileSize = stats.size;
                        }

                        finalize({
                            success: true,
                            outputPath: finalOutputPath,
                            featuresCount,
                            data,
                            fileSize,
                        });
                    } catch (error) {
                        void logDebug('Failed to read conversion result', {
                            fileId,
                            error: error instanceof Error ? error.message : 'Unknown error',
                        });
                        finalize({
                            success: false,
                            error: `Conversion succeeded but failed to read result: ${error instanceof Error ? error.message : 'Unknown error'}`,
                        });
                    }
                } else {
                    void logDebug('Python conversion failed', {
                        fileId,
                        code,
                        errorMessage: errorMessage || undefined,
                    });
                    finalize({
                        success: false,
                        error: errorMessage || `Python process exited with code ${code}`,
                    });
                }
            });

            pythonProcess.on('error', (error) => {
                void logDebug('Python process failed to start', {
                    fileId,
                    error: error.message,
                });
                abortSignal.removeEventListener('abort', onAbort);
                reject(new Error(`Failed to start Python process: ${error.message}. ` + `Make sure Python is installed and geopandas dependencies are available.`));
            });
        });
    }
}

let pythonBridgeInstance: PythonBridge | null = null;

function getPythonBridge(): PythonBridge {
    if (!pythonBridgeInstance) {
        pythonBridgeInstance = new PythonBridge();
    }
    return pythonBridgeInstance;
}

const convert: BridgeConversionFunction<ConversionOptions, ConversionResult> = async (options) => {
    const bridge = getPythonBridge();
    return bridge.convert(options);
};

export const $$pythonBridge = {
    convert,
};
