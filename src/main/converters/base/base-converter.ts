import { randomBytes } from 'crypto';
import { app } from 'electron';
import { mkdir } from 'fs/promises';
import { basename, dirname, join } from 'path';
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

function generateOutputPath(sourcePath: string, targetFormat: FileFormat): string {
    const fileNameWithoutExt = basename(sourcePath).replace(/\.[^/.]+$/, '');
    const uniqueId = randomBytes(8).toString('hex');
    const outputFileName = `${fileNameWithoutExt}-${uniqueId}.${targetFormat}`;

    return join(app.getPath('temp'), config.tempFolders.fileDropsTempFolder, outputFileName);
}

export function generateSuggestedFileName(sourcePath: string, targetFormat: FileFormat): string {
    const fileNameWithoutExt = basename(sourcePath).replace(/\.[^/.]+$/, '');
    return `${fileNameWithoutExt}.${targetFormat}`;
}

export async function prepareOutputPath(sourcePath: string, targetFormat: FileFormat): Promise<string> {
    const outputPath = generateOutputPath(sourcePath, targetFormat);
    await mkdir(dirname(outputPath), { recursive: true });
    return outputPath;
}

const createConversionProgress = {
    processing: (overrides: Pick<ProcessingConversionProgress, 'fileId'> & Partial<Pick<ProcessingConversionProgress, 'progress' | 'message'>>) =>
        ({
            fileId: overrides.fileId,
            progress: overrides?.progress ?? 0,
            status: 'processing',
            message: overrides?.message ?? 'Converting...',
        }) satisfies ProcessingConversionProgress,
    completed: (overrides: Pick<CompletedConversionProgress, 'fileId' | 'tempPath' | 'suggestedFileName' | 'fileSize'>) =>
        ({
            fileId: overrides.fileId,
            progress: 100,
            status: 'completed',
            message: 'Converted',
            tempPath: overrides.tempPath,
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

type ProgressReporter = {
    failed(error: string): void;
    processing: (progress: number, message?: string) => void;
    complete(params: { tempPath: string; suggestedFileName: string; fileSize: number }): void;
};

export function createProgressReporter(onProgress: (progress: ConversionProgress) => void, fileId: string): ProgressReporter {
    return {
        failed: (error) => {
            onProgress(createConversionProgress.failed({ fileId, error }));
        },
        processing: (progress, message) => {
            onProgress(createConversionProgress.processing({ fileId, progress, message }));
        },
        complete: ({ tempPath, suggestedFileName, fileSize }) => {
            onProgress(createConversionProgress.completed({ fileId, tempPath, suggestedFileName, fileSize }));
        },
    };
}

export type ConverterFunction<T extends ConversionRequest> = (
    request: T,
    onProgress: (progress: ConversionProgress) => void,
    abortSignal: AbortSignal,
) => Promise<ConversionResult>;
