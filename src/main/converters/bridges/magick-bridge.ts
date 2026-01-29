import { app } from 'electron';
import { logDebug } from 'main/utils/debug-logger';
import { type MagickWorkerConversionRequest, MagickWorkerMessageZod } from 'main/workers/magick-worker/magick-worker.types';
import { readFile, writeFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { Worker } from 'node:worker_threads';
import type { ImageFileFormat } from 'shared/types/conversion.types';
import type { BridgeConversionFunction, BridgeConversionOptions, BridgeConversionResult } from './bridge.types';
import { getAbortErrorMessage } from 'main/utils/abort-utils';

type ConversionOptions = BridgeConversionOptions<ImageFileFormat, ImageFileFormat, { quality?: number }>;

type ConversionResult = BridgeConversionResult<{}, {}>;

class MagickBridge {
    private getWorkerPath(): string {
        const appPath = app.getAppPath();
        if (process.env.NODE_ENV === 'development') {
            return join(appPath, 'node_modules/.dev/main/workers/magick-worker.mjs');
        }
        return join(appPath, 'main/workers/magick-worker.mjs');
    }

    async convert(options: ConversionOptions): Promise<ConversionResult> {
        const { sourcePath, targetPath, sourceFormat, targetFormat, quality, onProgress, fileId, abortSignal } = options;

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

        const inputBuffer = await readFile(sourcePath);
        const id = `${Date.now()}-${Math.random()}`;
        const worker = new Worker(this.getWorkerPath());

        let abortHandler: (() => void) | undefined;
        let settled = false;

        const finalize = async (result: PromiseSettledResult<Buffer>): Promise<ConversionResult> => {
            if (settled) {
                return { success: false, error: 'Magick conversion already finalized' };
            }
            settled = true;
            if (abortHandler) {
                abortSignal.removeEventListener('abort', abortHandler);
            }
            await worker.terminate();

            if (result.status === 'rejected') {
                const errorMessage = result.reason instanceof Error ? result.reason.message : 'Unknown error';
                onProgress({
                    fileId,
                    status: 'failed',
                    progress: 100,
                    error: errorMessage,
                });
                return { success: false, error: errorMessage };
            }

            await writeFile(targetPath, result.value);
            const fileSize = (await stat(targetPath)).size;

            onProgress({
                fileId,
                status: 'processing',
                progress: 100,
                message: 'Magick conversion complete',
            });

            return {
                success: true,
                outputPath: targetPath,
                fileSize,
            };
        };

        const conversionPromise = new Promise<Buffer>((resolve, reject) => {
            worker.on('message', (response) => {
                const parsed = MagickWorkerMessageZod.safeParse(response);
                if (!parsed.success) {
                    void logDebug('Magick worker sent invalid message', { error: parsed.error, response });
                    reject(new Error('Magick worker sent invalid response'));
                    return;
                }

                const data = parsed.data;
                if (data.id !== id) return;

                if (data.success) {
                    resolve(Buffer.from(data.outputBuffer));
                } else {
                    reject(new Error(data.error || 'Conversion failed'));
                }
            });

            worker.on('error', (error) => {
                void logDebug('Magick worker error', { error });
                reject(error);
            });
        });

        const abortPromise = new Promise<Buffer>((_, reject) => {
            abortHandler = () => {
                const reason = getAbortErrorMessage(abortSignal);
                void worker.terminate();
                reject(new Error(reason));
            };
            abortSignal.addEventListener('abort', abortHandler, { once: true });
        });

        const request: MagickWorkerConversionRequest = {
            id,
            inputBuffer: new Uint8Array(inputBuffer),
            sourceFormat,
            targetFormat,
            quality,
        };

        worker.postMessage(request);

        try {
            const result = await Promise.race([conversionPromise, abortPromise]);
            return await finalize({ status: 'fulfilled', value: result });
        } catch (error) {
            return await finalize({ status: 'rejected', reason: error });
        }
    }
}

let magickBridge: MagickBridge;

function getMagickBridge(): MagickBridge {
    if (!magickBridge) {
        magickBridge = new MagickBridge();
    }
    return magickBridge;
}

const convert: BridgeConversionFunction<ConversionOptions, ConversionResult> = async (options) => {
    const bridge = getMagickBridge();

    return bridge.convert(options);
};

export const $$magickBridge = {
    convert,
};
