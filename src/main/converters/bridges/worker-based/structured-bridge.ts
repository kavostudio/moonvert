import { app } from 'electron';
import { abortable } from 'main/utils/abortable';
import { logDebug } from 'main/utils/debug-logger';
import { type StructuredWorkerConversionRequest, StructuredWorkerMessageZod } from 'main/workers/structured-worker/structured-worker.types';
import { readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { Worker } from 'node:worker_threads';
import type { StructuredFileFormat } from 'shared/types/conversion.types';
import { createProgressReporter } from '../../base/base-converter';
import type { BridgeConversionOptions, BridgeConversionResult } from '../bridge.types';

type ConversionOptions = BridgeConversionOptions<StructuredFileFormat, StructuredFileFormat, {}>;
type ConversionResult = BridgeConversionResult<{}, {}>;

function getWorkerPath(): string {
    const appPath = app.getAppPath();
    const isDev = process.env.NODE_ENV === 'development';

    return isDev ? join(appPath, 'node_modules/.dev/main/workers/structured-worker.mjs') : join(appPath, 'main/workers/structured-worker.mjs');
}

type WorkerConversionParams = {
    worker: Worker;
    request: StructuredWorkerConversionRequest;
};

function runWorkerConversion({ worker, request }: WorkerConversionParams): Promise<string> {
    return new Promise((resolve, reject) => {
        worker.on('message', (response) => {
            const parsed = StructuredWorkerMessageZod.safeParse(response);

            if (!parsed.success) {
                void logDebug('Structured worker sent invalid message', { error: parsed.error, response });
                reject(new Error('Structured worker sent invalid response'));
                return;
            }

            const data = parsed.data;
            if (data.id !== request.id) return;

            if (data.success) {
                resolve(data.outputPath);
            } else {
                reject(new Error(data.error || 'Conversion failed'));
            }
        });

        worker.on('error', (error) => {
            void logDebug('Structured worker error', { error });
            reject(error);
        });

        worker.postMessage(request);
    });
}

async function convert(options: ConversionOptions): Promise<ConversionResult> {
    const { sourcePath, targetPath, sourceFormat, targetFormat, onProgress, fileId, abortSignal } = options;
    const progress = createProgressReporter(onProgress, fileId);

    const inputBuffer = await readFile(sourcePath);
    const worker = new Worker(getWorkerPath());

    const request: StructuredWorkerConversionRequest = {
        id: `${Date.now()}-${Math.random()}`,
        inputBuffer: new Uint8Array(inputBuffer),
        sourceFormat,
        targetFormat,
        outputPath: targetPath,
    };

    const outcome = await abortable({
        signal: abortSignal,
        operation: () => runWorkerConversion({ worker, request }),
        onAbort: () => {
            void worker.terminate();
        },
    });

    await worker.terminate();

    if (!outcome.success) {
        const error = outcome.aborted ? outcome.reason : outcome.error.message;
        progress.failed(error);
        return { success: false, error };
    }

    const fileStat = await stat(targetPath);

    if (!fileStat.isFile()) {
        const errorMessage = 'Conversion failed: output file not found';
        progress.failed(errorMessage);
        return { success: false, error: errorMessage };
    }

    return { success: true, outputPath: targetPath, fileSize: fileStat.size };
}

export const $$structuredBridge = {
    convert,
};
