import { logDebug } from 'main/utils/debug-logger';
import type { AudioConversionRequest } from 'shared/types/conversion.types';
import { type ConverterFunction, createProgressReporter, generateSuggestedFileName, prepareOutputPath } from '../base/base-converter';
import { $$ffmpegBridge } from 'main/converters/bridges/process-based/ffmpeg/ffmpeg-bridge';

const convert: ConverterFunction<AudioConversionRequest> = async (request, onProgress, abortSignal) => {
    const { fileId, sourcePath, sourceFormat, targetFormat, audioOptions } = request;
    const progress = createProgressReporter(onProgress, fileId);

    if (abortSignal.aborted) {
        const errorMsg = abortSignal.reason?.message ?? 'Conversion aborted';
        progress.failed(errorMsg);
        return { fileId, success: false, error: errorMsg };
    }

    void logDebug('Audio conversion starting', { fileId, sourcePath, sourceFormat, targetFormat });

    progress.processing(0, 'Starting audio conversion...');

    const outputPath = await prepareOutputPath(sourcePath, targetFormat);

    const result = await $$ffmpegBridge.convertAudio({
        sourcePath,
        targetPath: outputPath,
        sourceFormat,
        targetFormat,
        onProgress,
        fileId,
        abortSignal,
        audioOptions,
    });

    if (!result.success) {
        const errorMsg = result.error || 'Conversion failed';
        void logDebug('Audio conversion failed', { fileId, error: errorMsg });
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
        message: `Converted to ${targetFormat.toUpperCase()}`,
    };
};

export const $$audioConverter = {
    convert,
};
