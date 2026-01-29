import { mkdir } from 'fs/promises';
import { dirname, basename } from 'node:path';
import { logDebug } from 'main/utils/debug-logger';
import { getAbortErrorMessage } from 'main/utils/abort-utils';
import type { VideoConversionRequest } from 'shared/types/conversion.types';
import { type ConverterFunction, createConversionProgress, generateOutputPath, reportProgress } from '../base/base-converter';
import { $$ffmpegBridge } from 'main/converters/bridges/ffmpeg-bridge';

const convert: ConverterFunction<VideoConversionRequest> = async (request, onProgress, abortSignal) => {
    const { fileId, sourcePath, sourceFormat, targetFormat, outputPath } = request;

    if (abortSignal.aborted) {
        const errorMsg = getAbortErrorMessage(abortSignal);
        reportProgress({
            ...createConversionProgress.failed({ fileId, error: errorMsg }),
            onProgress,
        });
        return { fileId, success: false, error: errorMsg };
    }

    void logDebug('Video conversion starting', {
        fileId,
        sourcePath,
        sourceFormat,
        targetFormat,
        outputPath,
    });

    reportProgress({
        ...createConversionProgress.processing({ fileId }),
        onProgress,
    });

    const finalOutputPath = outputPath || generateOutputPath(sourcePath, targetFormat);
    const outputDir = dirname(finalOutputPath);
    await mkdir(outputDir, { recursive: true });

    const result = await $$ffmpegBridge.convert({
        sourcePath,
        targetPath: finalOutputPath,
        sourceFormat,
        targetFormat,
        onProgress,
        fileId,
        abortSignal,
    });

    if (!result.success) {
        const errorMsg = result.error || 'Conversion failed';
        void logDebug('Video conversion failed', {
            fileId,
            sourcePath,
            sourceFormat,
            targetFormat,
            error: errorMsg,
        });
        reportProgress({
            ...createConversionProgress.failed({ fileId, error: errorMsg }),
            onProgress,
        });
        return {
            fileId,
            success: false,
            error: errorMsg,
        };
    }

    const sourceFileName = basename(sourcePath);
    const fileNameWithoutExt = sourceFileName.replace(/\.[^/.]+$/, '');
    const outputFileName = `${fileNameWithoutExt}.${targetFormat}`;

    reportProgress({
        ...createConversionProgress.completed({
            fileId,
            tempPath: result.outputPath,
            suggestedFileName: outputFileName,
            fileSize: result.fileSize,
        }),
        onProgress,
    });

    return {
        fileId,
        success: true,
        suggestedFileName: outputFileName,
        fileSize: result.fileSize,
        tempPath: result.outputPath,
        message: `Converted to ${targetFormat.toUpperCase()}`,
    };
};

export const $$videoConverter = {
    convert,
};
