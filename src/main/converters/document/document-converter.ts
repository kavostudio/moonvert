import { logDebug } from 'main/utils/debug-logger';
import type { DocumentConversionRequest } from 'shared/types/conversion.types';
import { type ConverterFunction, createProgressReporter, generateSuggestedFileName, prepareOutputPath } from '../base/base-converter';
import { $$pandocBridge } from '../bridges/process-based/pandoc-bridge';

const convert: ConverterFunction<DocumentConversionRequest> = async (request, onProgress, abortSignal) => {
    const { fileId, sourcePath, sourceFormat, targetFormat } = request;
    const progress = createProgressReporter(onProgress, fileId);

    if (abortSignal.aborted) {
        const errorMsg = abortSignal.reason?.message ?? 'Conversion aborted';
        progress.failed(errorMsg);
        return { fileId, success: false, error: errorMsg };
    }

    void logDebug('Document conversion starting', { fileId, sourcePath, sourceFormat, targetFormat });

    progress.processing(0, 'Starting document conversion...');

    const outputPath = await prepareOutputPath(sourcePath, targetFormat);

    const result = await $$pandocBridge.convert({
        sourcePath,
        targetPath: outputPath,
        sourceFormat,
        targetFormat,
        onProgress,
        fileId,
        abortSignal,
    });

    if (!result.success) {
        const errorMsg = result.error || 'Conversion failed';
        void logDebug('Document conversion failed', { fileId, error: errorMsg });
        progress.failed(errorMsg);
        return { fileId, success: false, error: errorMsg };
    }

    const suggestedFileName = generateSuggestedFileName(sourcePath, targetFormat);

    progress.complete({
        tempPath: result.outputPath,
        suggestedFileName,
        fileSize: result.fileSize,
    });

    return {
        fileId,
        success: true,
        suggestedFileName,
        fileSize: result.fileSize,
        tempPath: result.outputPath,
    };
};

export const $$documentConverter = {
    convert,
};
