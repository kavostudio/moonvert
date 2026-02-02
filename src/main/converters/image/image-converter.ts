import { stat } from 'fs/promises';
import { logDebug } from 'main/utils/debug-logger';
import type { ImageConversionOptions, ImageConversionRequest } from 'shared/types/conversion.types';
import { type ConverterFunction, createProgressReporter, generateSuggestedFileName, prepareOutputPath } from '../base/base-converter';
import { $$magickBridge } from '../bridges/worker-based/magick-bridge';

const defaultOptions: ImageConversionOptions = {
    quality: 100,
    progressive: true,
    lossless: false,
};

const convert: ConverterFunction<ImageConversionRequest> = async (request, onProgress, abortSignal) => {
    const { fileId, sourcePath, sourceFormat, targetFormat, imageOptions } = request;
    const progress = createProgressReporter(onProgress, fileId);

    if (abortSignal.aborted) {
        const errorMsg = abortSignal.reason?.message ?? 'Conversion aborted';
        progress.failed(errorMsg);
        return { fileId, success: false, error: errorMsg };
    }

    void logDebug('Image conversion starting', { fileId, sourcePath, sourceFormat, targetFormat });

    progress.processing(0, 'Starting image conversion...');

    const options = { ...defaultOptions, ...imageOptions };
    const outputPath = await prepareOutputPath(sourcePath, targetFormat);

    progress.processing(25, 'Processing with ImageMagick...');

    try {
        await $$magickBridge.convert({
            sourcePath,
            targetPath: outputPath,
            sourceFormat,
            targetFormat,
            quality: options.quality,
            onProgress,
            fileId,
            abortSignal,
        });

        progress.processing(75, 'Finalizing conversion...');

        const stats = await stat(outputPath);
        const suggestedFileName = generateSuggestedFileName(sourcePath, targetFormat);

        progress.complete({
            tempPath: outputPath,
            suggestedFileName,
            fileSize: stats.size,
        });

        return {
            fileId,
            success: true,
            suggestedFileName,
            fileSize: stats.size,
            tempPath: outputPath,
            message: `Converted to ${targetFormat.toUpperCase()}`,
        };
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        void logDebug('Image conversion failed', { fileId, error: errorMsg });
        progress.failed(errorMsg);
        return { fileId, success: false, error: `Image conversion failed: ${errorMsg}` };
    }
};

export const $$imageConverter = {
    convert,
};
