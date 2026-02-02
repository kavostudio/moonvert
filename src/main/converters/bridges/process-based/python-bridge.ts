import archiver from 'archiver';
import { app } from 'electron';
import { abortable } from 'main/utils/abortable';
import { logDebug } from 'main/utils/debug-logger';
import { randomBytes } from 'node:crypto';
import { createWriteStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import type { GeoFileFormat } from 'shared/types/conversion.types';
import { z } from 'zod';
import { createProgressReporter } from '../../base/base-converter';
import type { BridgeConversionOptions, BridgeConversionResult } from '../bridge.types';

type ConversionOptions = BridgeConversionOptions<
    GeoFileFormat,
    GeoFileFormat,
    {
        initialProgress: number;
        expectedEndProgress: number;
    }
>;

type ConversionResult = BridgeConversionResult<{ featuresCount?: number }, {}>;

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

type PythonResultMessage = Extract<z.infer<typeof PythonProgressMessageSchema>, { type: 'result' }>;

const isDev = process.env.NODE_ENV === 'development';

function getPythonPaths(): { pythonPath: string; scriptPath: string | null } {
    if (isDev) {
        return {
            pythonPath: 'python3',
            scriptPath: join(app.getAppPath(), 'src', 'python', 'convert_geo.py'),
        };
    }

    if (process.platform !== 'darwin') {
        throw new Error(`Unsupported platform: ${process.platform}`);
    }

    return {
        pythonPath: join(process.resourcesPath, 'python', 'convert_geo'),
        scriptPath: null, // PyInstaller executable doesn't need script path
    };
}

function zipDirectory(sourceDir: string, outputZipPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const output = createWriteStream(outputZipPath);
        const archive = archiver('zip', { zlib: { level: 9 } });

        output.on('close', () => resolve());
        output.on('error', reject);
        archive.on('error', reject);

        archive.pipe(output);
        archive.directory(sourceDir, false);
        archive.finalize();
    });
}

function scaleProgress(pythonProgress: number, initial: number, end: number): number {
    return Math.round(initial + (pythonProgress / 100) * (end - initial));
}

type RunPythonParams = {
    sourcePath: string;
    targetPath: string;
    sourceFormat: GeoFileFormat;
    targetFormat: GeoFileFormat;
    fileId: string;
    onProgress: (progress: number) => void;
};

type PythonProcessResult = { outputPath: string; featuresCount: number };

function runPythonProcess(params: RunPythonParams): { process: ReturnType<typeof spawn>; promise: Promise<PythonProcessResult> } {
    const { sourcePath, targetPath, sourceFormat, targetFormat, fileId, onProgress } = params;
    const { pythonPath, scriptPath } = getPythonPaths();

    const args = scriptPath ? [scriptPath, sourcePath, targetPath, sourceFormat, targetFormat] : [sourcePath, targetPath, sourceFormat, targetFormat];

    const pythonProcess = spawn(pythonPath, args);
    let errorOutput = '';
    let resultMessage: PythonResultMessage | null = null;

    void logDebug('Python conversion started', { fileId, sourcePath, targetPath, sourceFormat, targetFormat, isDev, pythonPath, scriptPath: scriptPath || undefined });

    const promise = new Promise<PythonProcessResult>((resolve, reject) => {
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
                        void logDebug('Invalid Python message format', { fileId, error: result.error.format(), raw: line });
                        continue;
                    }

                    const msg = result.data;

                    if (msg.type === 'progress') {
                        onProgress(msg.progress);
                    } else if (msg.type === 'result') {
                        resultMessage = msg;
                        if (!msg.success && msg.traceback) {
                            void logDebug('Python traceback', { fileId, traceback: msg.traceback });
                        }
                    }
                } catch {
                    void logDebug('Failed to parse Python output', { fileId, raw: line });
                }
            }
        });

        pythonProcess.stderr?.on('data', (data) => {
            const message = data.toString();
            void logDebug('Python stderr', { fileId, message });
            errorOutput += message;
        });

        pythonProcess.on('close', (code) => {
            if (code === 0 && resultMessage?.success) {
                resolve({ outputPath: resultMessage.output_path, featuresCount: resultMessage.features_count });
            } else if (resultMessage && !resultMessage.success) {
                reject(new Error(resultMessage.error));
            } else {
                void logDebug('Python conversion failed', { fileId, code, errorMessage: errorOutput || undefined });
                reject(new Error(errorOutput || `Python process exited with code ${code}`));
            }
        });

        pythonProcess.on('error', (error) => {
            void logDebug('Python process failed to start', { fileId, error: error.message });
            reject(new Error(`Failed to start Python process: ${error.message}. Make sure Python is installed and geopandas dependencies are available.`));
        });
    });

    return { process: pythonProcess, promise };
}

async function processOutput(outputPath: string, featuresCount: number): Promise<ConversionResult> {
    const stats = await stat(outputPath);

    // Handle directory output (shapefiles) by zipping
    if (stats.isDirectory()) {
        const zipPath = join(tmpdir(), `${randomBytes(8).toString('hex')}.zip`);
        await zipDirectory(outputPath, zipPath);
        const zipStats = await stat(zipPath);
        return { success: true, outputPath: zipPath, featuresCount, fileSize: zipStats.size };
    }

    return { success: true, outputPath, featuresCount, fileSize: stats.size };
}

async function convert(options: ConversionOptions): Promise<ConversionResult> {
    const { sourcePath, targetPath, sourceFormat, targetFormat, onProgress, fileId, abortSignal } = options;
    const progress = createProgressReporter(onProgress, fileId);

    const initialProgress = options.initialProgress ?? 0;
    const expectedEndProgress = options.expectedEndProgress ?? 100;

    const { process: pythonProcess, promise } = runPythonProcess({
        sourcePath,
        targetPath,
        sourceFormat,
        targetFormat,
        fileId,
        onProgress: (pythonProgress) => {
            progress.processing(scaleProgress(pythonProgress, initialProgress, expectedEndProgress));
        },
    });

    const outcome = await abortable({
        signal: abortSignal,
        operation: () => promise,
        onAbort: () => {
            if (!pythonProcess.killed) {
                pythonProcess.kill('SIGTERM');
            }
        },
    });

    if (!outcome.success) {
        const error = outcome.aborted ? outcome.reason : outcome.error.message;
        progress.failed(error);
        return { success: false, error };
    }

    try {
        return await processOutput(outcome.value.outputPath, outcome.value.featuresCount);
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        const errorMsg = `Conversion succeeded but failed to read result: ${message}`;
        void logDebug('Failed to read conversion result', { fileId, error: message });
        progress.failed(errorMsg);
        return { success: false, error: errorMsg };
    }
}

export const $$pythonBridge = {
    convert,
};
