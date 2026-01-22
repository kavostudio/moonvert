import { mkdir } from 'fs/promises';
import { dirname } from 'path';
import type { ConversionResult, GeoConversionRequest } from 'shared/types/conversion.types';
import { type ConverterFunction, createConversionProgress, generateOutputPath, reportProgress } from '../base/base-converter';
import { logDebug } from 'main/utils/debug-logger';
import { $$pythonBridge } from '../bridges/python-bridge';
import { getAbortErrorMessage } from 'main/utils/abort-utils';
import { checkShapefileDependencies } from '../../utils/geospatial-helpers';

const convert: ConverterFunction<GeoConversionRequest> = async (request, onProgress, abortSignal) => {
    const { fileId, sourcePath, sourceFormat, targetFormat, outputPath } = request;

    try {
        if (abortSignal.aborted) {
            const errorMessage = getAbortErrorMessage(abortSignal);
            reportProgress({
                ...createConversionProgress.failed({ fileId, error: errorMessage }),
                onProgress,
            });
            return { fileId, success: false, error: errorMessage };
        }

        reportProgress({
            ...createConversionProgress.processing({
                fileId,
                progress: 10,
            }),
            onProgress,
        });

        if (sourceFormat === 'shp') {
            reportProgress({
                ...createConversionProgress.processing({
                    fileId,
                    progress: 15,
                    message: 'Checking dependencies',
                }),
                onProgress,
            });
            const missingFiles = await checkShapefileDependencies(sourcePath);
            if (missingFiles.length > 0) {
                return {
                    fileId,
                    success: false,
                    error: `Missing required files: ${missingFiles.join(', ')}`,
                };
            }
        }

        reportProgress({
            ...createConversionProgress.processing({
                fileId,
                progress: 25,
                message: `Reading ${sourceFormat.toUpperCase()} file`,
            }),
            onProgress,
        });

        const finalOutputPath = outputPath || generateOutputPath(sourcePath, targetFormat);

        const outputDir = dirname(finalOutputPath);

        await mkdir(outputDir, { recursive: true });

        void logDebug('Geo conversion starting', {
            fileId,
            sourcePath,
            sourceFormat,
            targetFormat,
            outputPath: finalOutputPath,
        });

        const result = await $$pythonBridge.convert({
            sourcePath,
            targetPath: finalOutputPath,
            sourceFormat,
            targetFormat,
            onProgress,
            fileId,
            abortSignal,
        });

        if (!result.success) {
            throw new Error(result.error || 'Conversion failed');
        }

        const baseName =
            sourcePath
                .split('/')
                .pop()
                ?.replace(/\.[^.]+$/, '') || 'converted';

        const defaultExtension = targetFormat === 'shp' ? 'zip' : targetFormat;

        const defaultFileName = `${baseName}.${defaultExtension}`;

        let conversionResult: ConversionResult = {
            fileId,
            success: true,
            data: result.data,
            suggestedFileName: defaultFileName,
            fileSize: result.fileSize,
            tempPath: result.outputPath || finalOutputPath,
            message: `Conversion completed successfully${result.featuresCount ? ` (${result.featuresCount} features)` : ''}`,
        };

        if (targetFormat === 'shp' && conversionResult.success) {
            const baseName =
                request.sourcePath
                    .split('/')
                    .pop()
                    ?.replace(/\.[^.]+$/, '') || 'converted';
            const zipFileName = `${baseName}.zip`;

            conversionResult = {
                ...conversionResult,
                suggestedFileName: zipFileName,
            };
        }

        reportProgress({
            ...createConversionProgress.completed({
                fileId,
                data: conversionResult.data,
                suggestedFileName: conversionResult.suggestedFileName,
                fileSize: conversionResult.fileSize,
            }),
            onProgress,
        });

        return conversionResult;
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        reportProgress({
            ...createConversionProgress.failed({
                fileId,
                error: errorMessage,
            }),
            onProgress,
        });

        return {
            fileId,
            success: false,
            error: errorMessage,
        };
    }
};

export const $$geoConverter = {
    convert,
};
