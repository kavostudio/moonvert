import { app } from 'electron';
import { abortable } from 'main/utils/abortable';
import { logDebug } from 'main/utils/debug-logger';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { stat } from 'node:fs/promises';
import { join } from 'node:path';
import type { DocumentFileFormat, EbookFileFormat } from 'shared/types/conversion.types';
import { createProgressReporter } from '../../base/base-converter';
import type { BridgeConversionOptions, BridgeConversionResult } from '../bridge.types';

type ConversionOptions = BridgeConversionOptions<DocumentFileFormat | EbookFileFormat, DocumentFileFormat | EbookFileFormat>;
type ConversionResult = BridgeConversionResult<{}, {}>;

function getPandocPath(): string {
    const isDev = process.env.NODE_ENV === 'development';

    if (isDev) {
        const localPath = join(app.getAppPath(), 'dist', 'pandoc', 'darwin-arm64', 'pandoc');
        if (existsSync(localPath)) {
            return localPath;
        }
        throw new Error('Pandoc binary not found. Run: ./scripts/download-pandoc-darwin.sh');
    }

    return join(process.resourcesPath, 'pandoc', 'pandoc');
}

const FORMAT_MAP: Record<DocumentFileFormat | EbookFileFormat, string> = {
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

function mapFormatToPandoc(format: DocumentFileFormat | EbookFileFormat): string {
    return FORMAT_MAP[format] || format;
}

type RunPandocParams = {
    pandocPath: string;
    args: string[];
    fileId: string;
};

function runPandocProcess({ pandocPath, args, fileId }: RunPandocParams): { process: ReturnType<typeof spawn>; promise: Promise<void> } {
    const pandocProcess = spawn(pandocPath, args);
    let errorOutput = '';

    const promise = new Promise<void>((resolve, reject) => {
        pandocProcess.stderr?.on('data', (chunk) => {
            const message = chunk.toString();
            errorOutput += message;
            void logDebug('Pandoc stderr', { fileId, message });
        });

        pandocProcess.on('close', (code) => {
            if (code === 0) {
                resolve();
            } else {
                const errorMessage = errorOutput.trim() || `Pandoc exited with code ${code}`;
                void logDebug('Pandoc conversion failed', { fileId, code, error: errorMessage });
                reject(new Error(errorMessage));
            }
        });

        pandocProcess.on('error', (error) => {
            const errorMsg = error.message.includes('ENOENT')
                ? 'Pandoc is not installed. Please install it using Homebrew:\n\nbrew install pandoc\n\nThen restart the application.'
                : `Pandoc process error: ${error.message}`;

            void logDebug('Pandoc process error', { fileId, error: errorMsg });
            reject(new Error(errorMsg));
        });
    });

    return { process: pandocProcess, promise };
}

async function convert(options: ConversionOptions): Promise<ConversionResult> {
    const { sourcePath, targetPath, sourceFormat, targetFormat, onProgress, fileId, abortSignal } = options;
    const progress = createProgressReporter(onProgress, fileId);

    void logDebug('Pandoc conversion starting', { fileId, sourcePath, targetPath, sourceFormat, targetFormat });

    progress.processing(10, 'Starting Pandoc conversion...');

    const pandocPath = getPandocPath();
    const args = [sourcePath, '-f', mapFormatToPandoc(sourceFormat), '-t', mapFormatToPandoc(targetFormat), '-o', targetPath];

    const { process: pandocProcess, promise } = runPandocProcess({ pandocPath, args, fileId });

    progress.processing(33, 'Converting document...');

    const outcome = await abortable({
        signal: abortSignal,
        operation: () => promise,
        onAbort: () => {
            if (!pandocProcess.killed) {
                pandocProcess.kill('SIGTERM');
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
        void logDebug('Pandoc output read failed', { fileId, error: errorMsg });
        progress.failed(errorMsg);
        return { success: false, error: errorMsg };
    }
}

export const $$pandocBridge = {
    convert,
};
