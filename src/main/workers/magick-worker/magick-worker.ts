import { parentPort } from 'node:worker_threads';
import { ImageMagick, initializeImageMagick, MagickFormat } from '@imagemagick/magick-wasm';
import { readFileSync } from 'node:fs';
import type { MagickWorkerConversionRequest, MagickWorkerConversionResponse } from './magick-worker.types';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

let initialized = false;

async function ensureInitialized(): Promise<void> {
    if (!initialized) {
        const wasmPath = require.resolve('@imagemagick/magick-wasm/magick.wasm');
        const wasmBytes = readFileSync(wasmPath);
        await initializeImageMagick(wasmBytes);
        initialized = true;
    }
}

function getFormatEnum(format: string): MagickFormat {
    const formatMap: Record<string, MagickFormat> = {
        heic: MagickFormat.Heic,
        png: MagickFormat.Png,
        jpg: MagickFormat.Jpeg,
        jpeg: MagickFormat.Jpeg,
        webp: MagickFormat.WebP,
    };
    return formatMap[format.toLowerCase()] || MagickFormat.Png;
}

async function convertImage(request: MagickWorkerConversionRequest): Promise<MagickWorkerConversionResponse> {
    try {
        await ensureInitialized();

        const { id, inputBuffer, targetFormat, quality, outputPath } = request;

        let outputBuffer: Uint8Array | undefined;

        ImageMagick.read(inputBuffer, (image) => {
            image.quality = quality ?? 100;
            image.write(getFormatEnum(targetFormat), (data: Uint8Array) => {
                outputBuffer = new Uint8Array(data);
            });
        });

        if (!outputBuffer) {
            throw new Error('Conversion produced no output');
        }

        await mkdir(dirname(outputPath), { recursive: true });
        await writeFile(outputPath, outputBuffer);

        return {
            id,
            success: true,
            outputPath,
        };
    } catch (error) {
        return {
            id: request.id,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

parentPort?.on('message', async (request: MagickWorkerConversionRequest) => {
    const response = await convertImage(request);
    parentPort?.postMessage(response);
});
