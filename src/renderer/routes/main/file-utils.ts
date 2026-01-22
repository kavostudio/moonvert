import type { DocumentFileFormat, FileFormat } from 'shared/types/conversion.types';
import { DOCUMENT_FORMATS, EBOOK_FORMATS, GEO_FORMATS, IMAGE_FORMATS, VIDEO_FORMATS } from 'shared/config/converter-config';
import type { FileWithMetadata } from './model';

export type FileInput = {
    path: string;
    name: string;
    size: number;
    isBundle?: boolean;
    bundleFiles?: string[];
};

function detectFormatAndCheckAcceptance(fileName: string): FileFormat | null {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (!ext) return null;

    if (IMAGE_FORMATS.includes(ext as (typeof IMAGE_FORMATS)[number])) {
        return ext as FileFormat;
    }

    if (GEO_FORMATS.includes(ext as (typeof GEO_FORMATS)[number])) {
        return ext as FileFormat;
    }

    if (DOCUMENT_FORMATS.includes(ext as (typeof DOCUMENT_FORMATS)[number])) {
        return ext as DocumentFileFormat;
    }

    if (EBOOK_FORMATS.includes(ext as (typeof EBOOK_FORMATS)[number])) {
        return ext as FileFormat;
    }

    if (VIDEO_FORMATS.includes(ext as (typeof VIDEO_FORMATS)[number])) {
        return ext as FileFormat;
    }

    return null;
}

function generateFileId(): string {
    return `file_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function toFileWithMetadata(file: FileInput): FileWithMetadata | null {
    const fileFormat = detectFormatAndCheckAcceptance(file.name);

    if (!fileFormat) {
        return null;
    }

    return {
        id: generateFileId(),
        name: file.name,
        size: file.size,
        path: file.path,
        isBundle: file.isBundle,
        bundleFiles: file.bundleFiles,
        state: 'idle',
        format: fileFormat,
    } as FileWithMetadata;
}
