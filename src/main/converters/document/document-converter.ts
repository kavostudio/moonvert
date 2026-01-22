import { logDebug } from 'main/utils/debug-logger';
import { basename } from 'node:path';
import type { DocumentConversionRequest } from 'shared/types/conversion.types';
import { type ConverterFunction, createConversionProgress, generateOutputPath, reportProgress } from '../base/base-converter';
import { $$pandocBridge } from '../bridges/pandoc-bridge';
import { getAbortErrorMessage } from 'main/utils/abort-utils';

const convert: ConverterFunction<DocumentConversionRequest> = async (request, onProgress, abortSignal) => {
    const { fileId, sourcePath, sourceFormat, targetFormat, outputPath } = request;

    if (abortSignal.aborted) {
        const errorMsg = getAbortErrorMessage(abortSignal);
        reportProgress({
            ...createConversionProgress.failed({ fileId, error: errorMsg }),
            onProgress,
        });
        return { fileId, success: false, error: errorMsg };
    }

    void logDebug('Document conversion starting', {
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

    const result = await $$pandocBridge.convert({
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

        void logDebug('Document conversion failed', {
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
            data: result.data,
            suggestedFileName: outputFileName,
            fileSize: result.fileSize,
        }),
        onProgress,
    });

    return {
        fileId,
        success: true,
        data: result.data,
        suggestedFileName: outputFileName,
        fileSize: result.fileSize,
        tempPath: finalOutputPath,
    };
};

export const $$documentConverter = {
    convert,
};
