import { randomBytes } from 'crypto';
import { app } from 'electron';
import { tmpdir } from 'os';
import { join, basename } from 'path';
import { config } from 'shared/config/app-config';
import type {
    CompletedConversionProgress,
    ConversionProgress,
    ConversionRequest,
    ConversionResult,
    FailedConversionProgress,
    FileFormat,
    ProcessingConversionProgress,
} from 'shared/types/conversion.types';

export function generateOutputPath(sourcePath: string, targetFormat: FileFormat): string {
    const sourceFileName = basename(sourcePath);
    const fileNameWithoutExt = sourceFileName.replace(/\.[^/.]+$/, '');
    const uniqueId = randomBytes(8).toString('hex');
    const outputFileName = `${fileNameWithoutExt}-${uniqueId}.${targetFormat}`;

    return join(app.getPath('temp'), config.tempFolders.fileDropsTempFolder, outputFileName);
}

export const createConversionProgress = {
    processing: (overrides: Pick<ProcessingConversionProgress, 'fileId'> & Partial<Pick<ProcessingConversionProgress, 'progress' | 'message'>>) =>
        ({
            fileId: overrides.fileId,
            progress: overrides?.progress ?? 0,
            status: 'processing',
            message: 'Starting conversion',
        }) satisfies ProcessingConversionProgress,
    completed: (overrides: Pick<CompletedConversionProgress, 'fileId' | 'data' | 'suggestedFileName' | 'fileSize'>) =>
        ({
            fileId: overrides.fileId,
            progress: 100,
            status: 'completed',
            message: 'Converted',
            data: overrides.data,
            suggestedFileName: overrides.suggestedFileName,
            fileSize: overrides.fileSize,
        }) satisfies CompletedConversionProgress,
    failed: (overrides: Pick<ProcessingConversionProgress, 'fileId'> & Partial<Pick<FailedConversionProgress, 'error'>>) =>
        ({
            fileId: overrides.fileId,
            progress: 100,
            status: 'failed',
            error: overrides.error || 'Conversion failed',
        }) satisfies FailedConversionProgress,
} as const;

export function reportProgress({
    onProgress,
    ...progress
}: ConversionProgress & {
    onProgress: (progress: ConversionProgress) => void;
}): void {
    onProgress({
        ...progress,
    });
}

export type ConverterFunction<T extends ConversionRequest> = (
    request: T,
    onProgress: (progress: ConversionProgress) => void,
    abortSignal: AbortSignal,
) => Promise<ConversionResult>;
