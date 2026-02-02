import { logDebug } from 'main/utils/debug-logger';
import { basename } from 'node:path';
import type { StructuredConversionRequest } from 'shared/types/conversion.types';
import { type ConverterFunction, createConversionProgress, generateOutputPath, reportProgress } from '../base/base-converter';
import { $$structuredBridge } from '../bridges/structured-bridge';
import { getAbortErrorMessage } from 'main/utils/abort-utils';

const convert: ConverterFunction<StructuredConversionRequest> = async (request, onProgress, abortSignal) => {
    const { fileId, sourcePath, sourceFormat, targetFormat, outputPath } = request;

    if (abortSignal.aborted) {
        const errorMsg = getAbortErrorMessage(abortSignal);
        reportProgress({
            ...createConversionProgress.failed({ fileId, error: errorMsg }),
            onProgress,
        });
        return { fileId, success: false, error: errorMsg };
    }

    void logDebug('Structured conversion starting', {
        fileId,
        sourcePath,
        sourceFormat,
        targetFormat,
        outputPath,
    });

    reportProgress({
        ...createConversionProgress.processing({
            fileId,
        }),
        onProgress,
    });

    const finalOutputPath = outputPath || generateOutputPath(sourcePath, targetFormat);

    const result = await $$structuredBridge.convert({
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

        void logDebug('Structured conversion failed', {
            fileId,
            sourcePath,
            sourceFormat,
            targetFormat,
            error: errorMsg,
        });
        reportProgress({
            ...createConversionProgress.failed({
                fileId,
                error: errorMsg,
            }),
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
    };
};

export const $$structuredConverter = {
    convert,
};
