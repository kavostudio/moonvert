import { app } from 'electron';
import { getAbortErrorMessage } from 'main/utils/abort-utils';
import { logDebug } from 'main/utils/debug-logger';
import { spawn, type ChildProcess } from 'node:child_process';
import { existsSync } from 'node:fs';
import { stat } from 'node:fs/promises';
import { join } from 'node:path';
import type { DocumentFileFormat, EbookFileFormat } from 'shared/types/conversion.types';
import { createConversionProgress } from '../base/base-converter';
import type { BridgeConversionFunction, BridgeConversionOptions } from './bridge.types';

type ConversionOptions = BridgeConversionOptions<DocumentFileFormat | EbookFileFormat, DocumentFileFormat | EbookFileFormat>;

type ConversionResult = {
    success: boolean;
} & ({ success: true; outputPath: string; fileSize: number } | { success: false; error: string });

class PandocBridge {
    private readonly pandocPath: string;
    private readonly isDev: boolean;

    constructor() {
        this.isDev = process.env.NODE_ENV === 'development';
        this.pandocPath = this.findPandoc();
        void logDebug('Pandoc bridge initialized', {
            pandocPath: this.pandocPath || undefined,
            isDev: this.isDev,
        });
    }

    private findPandoc(): string {
        if (this.isDev) {
            const localPath = join(app.getAppPath(), 'dist', 'pandoc', 'darwin-arm64', 'pandoc');
            if (existsSync(localPath)) {
                return localPath;
            }

            throw new Error('Pandoc binary not found. Run: ./scripts/download-pandoc-darwin.sh');
        }

        const resourcesPath = process.resourcesPath;
        return join(resourcesPath, 'pandoc', 'pandoc');
    }

    async convert(options: ConversionOptions): Promise<ConversionResult> {
        const { sourcePath, targetPath, sourceFormat, targetFormat, onProgress, fileId, abortSignal } = options;

        if (abortSignal.aborted) {
            const errorMessage = getAbortErrorMessage(abortSignal);
            onProgress(
                createConversionProgress.failed({
                    fileId,
                    error: errorMessage,
                }),
            );
            return { success: false, error: errorMessage };
        }

        return new Promise((resolve, reject) => {
            let pandocProcess: ChildProcess;
            let errorOutput = '';
            let settled = false;

            const finalize = (result: ConversionResult) => {
                if (settled) return;
                settled = true;
                abortSignal.removeEventListener('abort', onAbort);
                resolve(result);
            };

            const onAbort = () => {
                const errorMessage = getAbortErrorMessage(abortSignal);
                if (pandocProcess && !pandocProcess.killed) {
                    pandocProcess.kill('SIGTERM');
                }
                onProgress(
                    createConversionProgress.failed({
                        fileId,
                        error: errorMessage,
                    }),
                );
                finalize({ success: false, error: errorMessage });
            };

            const args = [sourcePath, '-f', this.mapFormatToPandoc(sourceFormat), '-t', this.mapFormatToPandoc(targetFormat), '-o', targetPath];

            // if (documentOptions.standalone !== false) {
            //     args.push('--standalone');
            // }

            // if (documentOptions.toc) {
            //     args.push('--toc');
            // }

            //   if (documentOptions.mathEngine) {
            //     args.push(`--${documentOptions.mathEngine}`);
            //   }

            //   if (documentOptions.pdfEngine && targetFormat === "pdf") {
            //     args.push("--pdf-engine", documentOptions.pdfEngine);
            //   }

            void logDebug('Pandoc conversion starting', {
                fileId,
                sourcePath,
                targetPath,
                sourceFormat,
                targetFormat,
            });

            onProgress(
                createConversionProgress.processing({
                    fileId,
                    progress: 10,
                    message: 'Starting Pandoc conversion...',
                }),
            );

            pandocProcess = spawn(this.pandocPath, args);

            abortSignal.addEventListener('abort', onAbort, { once: true });

            pandocProcess.stderr?.on('data', (chunk) => {
                const message = chunk.toString();
                errorOutput += message;
                void logDebug('Pandoc stderr', {
                    fileId,
                    message,
                });
            });

            onProgress(
                createConversionProgress.processing({
                    fileId,
                    progress: 33,
                    message: 'Converting document...',
                }),
            );

            pandocProcess.on('close', async (code) => {
                if (code === 0) {
                    try {
                        const stats = await stat(targetPath);

                        onProgress(
                            createConversionProgress.processing({
                                fileId,
                                progress: 67,
                                message: 'Finalizing conversion...',
                            }),
                        );

                        finalize({
                            success: true,
                            outputPath: targetPath,
                            fileSize: stats.size,
                        });
                    } catch (error) {
                        const message = error instanceof Error ? error.message : 'Unknown error';
                        const errorMsg = `Failed to read output file: ${message}`;

                        void logDebug('Pandoc output read failed', {
                            fileId,
                            error: errorMsg,
                        });

                        onProgress(
                            createConversionProgress.failed({
                                fileId,
                                error: errorMsg,
                            }),
                        );

                        finalize({
                            success: false,
                            error: errorMsg,
                        });
                    }
                } else {
                    const errorMessage = errorOutput.trim() || `Pandoc exited with code ${code}`;

                    void logDebug('Pandoc conversion failed', {
                        fileId,
                        code,
                        error: errorMessage,
                    });

                    onProgress(
                        createConversionProgress.failed({
                            fileId,
                            error: errorMessage,
                        }),
                    );

                    finalize({
                        success: false,
                        error: errorMessage,
                    });
                }
            });

            pandocProcess.on('error', (error) => {
                const errorMsg = error.message.includes('ENOENT')
                    ? 'Pandoc is not installed. Please install it using Homebrew:\n\nbrew install pandoc\n\nThen restart the application.'
                    : `Pandoc process error: ${error.message}`;

                void logDebug('Pandoc process error', {
                    fileId,
                    error: errorMsg,
                });

                onProgress(
                    createConversionProgress.failed({
                        fileId,
                        error: errorMsg,
                    }),
                );

                finalize({
                    success: false,
                    error: errorMsg,
                });
            });
        });
    }

    private mapFormatToPandoc(format: DocumentFileFormat | EbookFileFormat): string {
        const formatMap: Record<DocumentFileFormat | EbookFileFormat, string> = {
            md: 'markdown',
            docx: 'docx',
            odt: 'odt',
            rtf: 'rtf',
            txt: 'txt',
            html: 'html',
            tex: 'latex',
            pdf: 'pdf',
            epub: 'epub',
            mobi: 'epub', // Pandoc doesn't support mobi directly, convert via epub
            azw3: 'epub',
        };

        return formatMap[format] || format;
    }
}

let pandocBridge: PandocBridge;

function getPandocBridge(): PandocBridge {
    if (!pandocBridge) {
        pandocBridge = new PandocBridge();
    }
    return pandocBridge;
}

const convert: BridgeConversionFunction<ConversionOptions, ConversionResult> = async (options) => {
    const bridge = getPandocBridge();

    return bridge.convert(options);
};

export const $$pandocBridge = {
    convert,
};
