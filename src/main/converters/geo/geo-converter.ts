import { logDebug } from 'main/utils/debug-logger';
import { basename } from 'node:path';
import type { GeoConversionRequest } from 'shared/types/conversion.types';
import { type ConverterFunction, createProgressReporter, prepareOutputPath } from '../base/base-converter';
import { $$pythonBridge } from '../bridges/process-based/python-bridge';
import { checkShapefileDependencies } from '../../utils/geospatial-helpers';

function generateGeoSuggestedFileName(sourcePath: string, targetFormat: string): string {
    const fileNameWithoutExt = basename(sourcePath).replace(/\.[^/.]+$/, '');
    // Shapefiles are zipped for output
    const extension = targetFormat === 'shp' ? 'zip' : targetFormat;
    return `${fileNameWithoutExt}.${extension}`;
}

const convert: ConverterFunction<GeoConversionRequest> = async (request, onProgress, abortSignal) => {
    const { fileId, sourcePath, sourceFormat, targetFormat } = request;
    const progress = createProgressReporter(onProgress, fileId);

    if (abortSignal.aborted) {
        const errorMsg = abortSignal.reason?.message ?? 'Conversion aborted';
        progress.failed(errorMsg);
        return { fileId, success: false, error: errorMsg };
    }

    void logDebug('Geo conversion starting', { fileId, sourcePath, sourceFormat, targetFormat });

    progress.processing(3, 'Starting geo conversion...');

    try {
        // Check shapefile dependencies if source is shapefile
        if (sourceFormat === 'shp') {
            progress.processing(5, 'Checking shapefile dependencies...');
            const missingFiles = await checkShapefileDependencies(sourcePath);
            if (missingFiles.length > 0) {
                throw new Error(`Missing required files: ${missingFiles.join(', ')}`);
            }
        }

        progress.processing(7, `Reading ${sourceFormat.toUpperCase()} file...`);

        const outputPath = await prepareOutputPath(sourcePath, targetFormat);

        const result = await $$pythonBridge.convert({
            sourcePath,
            targetPath: outputPath,
            sourceFormat,
            targetFormat,
            onProgress,
            fileId,
            abortSignal,
            initialProgress: 15,
            expectedEndProgress: 95,
        });

        if (!result.success) {
            throw new Error(result.error || 'Conversion failed');
        }

        const suggestedFileName = generateGeoSuggestedFileName(sourcePath, targetFormat);
        const featuresMessage = result.featuresCount ? ` (${result.featuresCount} features)` : '';

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
            message: `Conversion completed successfully${featuresMessage}`,
        };
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        void logDebug('Geo conversion failed', { fileId, error: errorMsg });
        progress.failed(errorMsg);
        return { fileId, success: false, error: errorMsg };
    }
};

export const $$geoConverter = {
    convert,
};
