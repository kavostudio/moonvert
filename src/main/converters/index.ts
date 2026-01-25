import {
    AllowedConversionOptions,
    isAudioTargetFormat,
    isConvertableAudioFormat,
    isConvertableDocumentFormat,
    isConvertableEbookFormat,
    isConvertableGeoFormat,
    isConvertableImageFormat,
    isConvertableVideoFormat,
    isDocumentTargetFormat,
    isEbookTargetFormat,
    isVideoTargetFormat,
} from 'shared/config/converter-config';
import type {
    AudioConversionRequest,
    ConversionRequest,
    DocumentConversionRequest,
    FileFormat,
    GeoConversionRequest,
    ImageConversionRequest,
    VideoConversionRequest,
} from 'shared/types/conversion.types';
import type { ConverterFunction } from './base/base-converter';
import { $$audioConverter } from './audio/audio-converter';
import { $$documentConverter } from './document/document-converter';
import { $$geoConverter } from './geo/geo-converter';
import { $$imageConverter } from './image/image-converter';
import { $$videoConverter } from './video/video-converter';

export function getConverter(sourceFormat: FileFormat, targetFormat: FileFormat): ConverterFunction<ConversionRequest> | null {
    if (!isConversionSupported(sourceFormat, targetFormat)) {
        return null;
    }

    if (isConvertableImageFormat(sourceFormat)) {
        return async (request, onProgress, abortSignal) => {
            const result = await $$imageConverter.convert(request as ImageConversionRequest, onProgress, abortSignal);
            return result;
        };
    }

    if (isConvertableGeoFormat(sourceFormat)) {
        return async (request, onProgress, abortSignal) => {
            const result = await $$geoConverter.convert(request as GeoConversionRequest, onProgress, abortSignal);
            return result;
        };
    }

    if ((isConvertableDocumentFormat(sourceFormat) || isConvertableEbookFormat(sourceFormat)) && (isDocumentTargetFormat(targetFormat) || isEbookTargetFormat(targetFormat))) {
        return async (request, onProgress, abortSignal) => {
            const result = await $$documentConverter.convert(request as DocumentConversionRequest, onProgress, abortSignal);
            return result;
        };
    }

    if (isConvertableVideoFormat(sourceFormat) && isVideoTargetFormat(targetFormat)) {
        return async (request, onProgress, abortSignal) => {
            const result = await $$videoConverter.convert(request as VideoConversionRequest, onProgress, abortSignal);
            return result;
        };
    }

    if (isConvertableAudioFormat(sourceFormat) && isAudioTargetFormat(targetFormat)) {
        return async (request, onProgress, abortSignal) => {
            const result = await $$audioConverter.convert(request as AudioConversionRequest, onProgress, abortSignal);
            return result;
        };
    }

    return null;
}

export function isConversionSupported(sourceFormat: FileFormat, targetFormat: FileFormat): boolean {
    const allowedTargets = AllowedConversionOptions[sourceFormat as keyof typeof AllowedConversionOptions];
    const conversionSupported = allowedTargets ? (allowedTargets as readonly FileFormat[]).includes(targetFormat) : false;
    return conversionSupported;
}
