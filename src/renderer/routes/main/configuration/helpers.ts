import type { FileFormat } from 'shared/types/conversion.types';
import type { FileWithMetadata } from '../model';
import {
    AllowedConversionOptions,
    type ConvertableFileFormat,
    isConvertableDocumentFormat,
    isConvertableEbookFormat,
    isConvertableGeoFormat,
    isConvertableImageFormat,
    isConvertableVideoFormat,
} from 'shared/config/converter-config';

export type FileGroup = 'images' | 'documents' | 'books' | 'geospatial' | 'videos';

const groupValidators: Record<FileGroup, (format: FileFormat) => boolean> = {
    images: isConvertableImageFormat,
    documents: (format: FileFormat) => isConvertableDocumentFormat(format),
    books: (format: FileFormat) => isConvertableEbookFormat(format),
    geospatial: isConvertableGeoFormat,
    videos: isConvertableVideoFormat,
};

export function groupFilesByType(files: FileWithMetadata[]): Record<FileGroup, FileWithMetadata[]> {
    const groups: Record<FileGroup, FileWithMetadata[]> = {
        images: [],
        documents: [],
        books: [],
        geospatial: [],
        videos: [],
    };

    for (const file of files) {
        for (const [group, validator] of Object.entries(groupValidators)) {
            if (validator(file.format)) {
                groups[group as FileGroup].push(file);
                break;
            }
        }
    }

    return groups;
}

export function getGroupDisplayName(group: FileGroup): string {
    const names: Record<FileGroup, string> = {
        images: 'Images',
        documents: 'Documents',
        books: 'Books',
        geospatial: 'Geospatial',
        videos: 'Videos',
    };
    return names[group];
}

export function getSourceFormatsForGroup(files: FileWithMetadata[]): ConvertableFileFormat[] {
    const formats = new Set(files.map((f) => f.format));
    return Array.from(formats).sort() as ConvertableFileFormat[];
}

export function getAllFormatsForGroup(group: FileGroup): FileFormat[] {
    const formatSets: Record<FileGroup, FileFormat[]> = {
        images: [],
        documents: [],
        books: [],
        geospatial: [],
        videos: [],
    };

    for (const [sourceFormat, targets] of Object.entries(AllowedConversionOptions)) {
        for (const [group, validator] of Object.entries(groupValidators)) {
            if (validator(sourceFormat as FileFormat)) {
                formatSets[group as FileGroup].push(...(targets as FileFormat[]));
                break;
            }
        }
    }

    return Array.from(new Set(formatSets[group]));
}

export function getAvailableTargetFormats(group: FileGroup): FileFormat[] {
    return getAllFormatsForGroup(group);
}

export function canConvertFileToFormat(file: FileWithMetadata, targetFormat: FileFormat): boolean {
    const sourceFormat = file.format as ConvertableFileFormat;
    const allowedTargets = AllowedConversionOptions[sourceFormat];
    return allowedTargets ? allowedTargets.includes(targetFormat as never) : false;
}
