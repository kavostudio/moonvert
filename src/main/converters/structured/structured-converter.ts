import { logDebug } from 'main/utils/debug-logger';
import type { StructuredConversionRequest } from 'shared/types/conversion.types';
import { type ConverterFunction, createProgressReporter, generateSuggestedFileName, prepareOutputPath } from '../base/base-converter';
import { $$structuredBridge } from '../bridges/worker-based/structured-bridge';

const convert: ConverterFunction<StructuredConversionRequest> = async (request, onProgress, abortSignal) => {
    const { fileId, sourcePath, sourceFormat, targetFormat } = request;
    const progress = createProgressReporter(onProgress, fileId);

    if (abortSignal.aborted) {
        const errorMsg = abortSignal.reason?.message ?? 'Conversion aborted';
        progress.failed(errorMsg);
        return { fileId, success: false, error: errorMsg };
    }

    void logDebug('Structured conversion starting', { fileId, sourcePath, sourceFormat, targetFormat });

    progress.processing(0, 'Starting structured conversion...');

    const outputPath = await prepareOutputPath(sourcePath, targetFormat);

    const result = await $$structuredBridge.convert({
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
        void logDebug('Structured conversion failed', { fileId, error: errorMsg });
        progress.failed(errorMsg);
        return { fileId, success: false, error: errorMsg };
    }

    progress.complete({
        tempPath: result.outputPath,
        suggestedFileName: outputPath,
        fileSize: result.fileSize,
    });

    return {
        fileId,
        success: true,
        suggestedFileName: outputPath,
        fileSize: result.fileSize,
        tempPath: result.outputPath,
    };
};

export const $$structuredConverter = {
    convert,
};
