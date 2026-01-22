import { mkdir, readFile } from 'fs/promises';
import { logDebug } from 'main/utils/debug-logger';
import { dirname } from 'path';
import type { ConversionResult, ImageConversionOptions, ImageConversionRequest } from 'shared/types/conversion.types';
import { type ConverterFunction, createConversionProgress, generateOutputPath, reportProgress } from '../base/base-converter';
import { $$magickBridge } from '../bridges/magick-bridge';
import { getAbortErrorMessage, withAbort } from 'main/utils/abort-utils';

const defaultOptions: ImageConversionOptions = {
    quality: 100,
    progressive: true,
    lossless: false,
};

const convertWithMagick: ConverterFunction<ImageConversionRequest> = async (request, onProgress, abortSignal) => {
    const { fileId, sourcePath, sourceFormat, targetFormat, outputPath, imageOptions } = request;

    if (abortSignal.aborted) {
        throw new Error(getAbortErrorMessage(abortSignal));
    }

    void logDebug('Image conversion (magick) starting', {
        fileId,
        sourcePath,
        sourceFormat,
        targetFormat,
        outputPath: outputPath || undefined,
        imageOptions: imageOptions || undefined,
    });

    const options = { ...defaultOptions, ...imageOptions };

    reportProgress({
        ...createConversionProgress.processing({
            fileId,
            progress: 25,
            message: 'Converting with ImageMagick',
        }),
        onProgress,
    });

    const finalOutputPath = outputPath || generateOutputPath(sourcePath, targetFormat);

    const outputDir = dirname(finalOutputPath);
    await withAbort(abortSignal, mkdir(outputDir, { recursive: true }));

    reportProgress({
        ...createConversionProgress.processing({
            fileId,
            progress: 50,
            message: 'Processing with ImageMagick',
        }),
        onProgress,
    });
    await $$magickBridge.convert({
        sourcePath,
        targetPath: finalOutputPath,
        sourceFormat,
        targetFormat,
        quality: options.quality,
        onProgress,
        fileId,
        abortSignal,
    });

    reportProgress({
        ...createConversionProgress.processing({
            fileId,
            progress: 75,
            message: 'Reading result',
        }),
        onProgress,
    });

    const data = await withAbort(abortSignal, readFile(finalOutputPath));
    const fileSize = data.length;

    reportProgress({
        ...createConversionProgress.processing({
            fileId,
            progress: 90,
            message: 'Finalizing conversion',
        }),
        onProgress,
    });

    const baseName =
        sourcePath
            .split('/')
            .pop()
            ?.replace(/\.[^/.]+$/, '') || 'image';
    const suggestedFileName = `${baseName}.${targetFormat}`;

    return {
        fileId,
        success: true,
        data,
        suggestedFileName,
        fileSize,
        tempPath: finalOutputPath,
        message: `Converted to ${targetFormat.toUpperCase()} via ImageMagick`,
    };
};

const convert: ConverterFunction<ImageConversionRequest> = async (request, onProgress, abortSignal) => {
    const { fileId, sourceFormat, targetFormat } = request;

    try {
        if (abortSignal.aborted) {
            throw new Error(getAbortErrorMessage(abortSignal));
        }
        reportProgress({
            ...createConversionProgress.processing({ fileId }),
            onProgress,
        });

        const conversionResult: ConversionResult = await convertWithMagick(request, onProgress, abortSignal);

        if (!conversionResult.success) {
            const errorMsg = conversionResult.error || 'Conversion failed';
            throw new Error(errorMsg);
        }

        reportProgress({
            ...createConversionProgress.completed({
                fileId,
                suggestedFileName: conversionResult.suggestedFileName,
                fileSize: conversionResult.fileSize,
                data: conversionResult.data,
            }),
            onProgress,
        });

        return conversionResult;
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        void logDebug('Image conversion failed', {
            fileId,
            sourceFormat,
            targetFormat,
            error: errorMessage,
        });

        reportProgress({
            ...createConversionProgress.failed({ fileId, error: errorMessage }),
            onProgress,
        });

        return {
            fileId,
            success: false,
            error: `Image conversion failed: ${errorMessage}`,
        };
    }
};

export const $$imageConverter = {
    convert,
};
