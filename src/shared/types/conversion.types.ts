import z from 'zod';

export const ImageFileFormatZod = z.enum(['png', 'jpg', 'jpeg', 'heic', 'webp', 'tiff', 'bmp', 'ico', 'icns', 'avif']);

export type ImageFileFormat = z.infer<typeof ImageFileFormatZod>;

export const DocumentFileFormatZod = z.enum(['docx', 'odt', 'rtf', 'txt', 'md', 'html', 'tex', 'pdf']);

export type DocumentFileFormat = z.infer<typeof DocumentFileFormatZod>;

export const EbookFileFormatZod = z.enum(['epub', 'mobi', 'azw3']);

export type EbookFileFormat = z.infer<typeof EbookFileFormatZod>;

export const VideoFileFormatZod = z.enum(['mp4', 'mov', 'webm', 'mkv', 'avi', 'gif', 'm4v', '3gp', 'flv', 'ts', 'mts', 'm2ts', 'wmv', 'ogv', 'mpg', 'mpeg', 'mxf', 'vob']);

export type VideoFileFormat = z.infer<typeof VideoFileFormatZod>;

export const GeoFileFormatZod = z.enum(['geojson', 'gpkg', 'shp', 'kml', 'kmz', 'gpx', 'gml', 'wkt']);

export type GeoFileFormat = z.infer<typeof GeoFileFormatZod>;

export const AudioFileFormatZod = z.enum(['mp3', 'wav', 'flac', 'aac', 'm4a', 'ogg', 'wma', 'aiff', 'alac', 'opus', 'ape', 'wv']);

export type AudioFileFormat = z.infer<typeof AudioFileFormatZod>;

export type FileFormat = GeoFileFormat | ImageFileFormat | DocumentFileFormat | EbookFileFormat | VideoFileFormat | AudioFileFormat;

export type FileInfo = {
    id: string;
    name: string;
    path: string;
    size: number;
    format: FileFormat;
    targetFormat?: FileFormat;
};

export type ImageConversionOptions = {
    quality: number;
    lossless: boolean;
    progressive: boolean;
};

export type GenericConversionRequest<T extends object, F extends FileFormat> = {
    fileId: string;
    sourcePath: string;
    sourceFormat: F;
    targetFormat: F;
    outputPath?: string;
} & T;

export type ImageConversionRequest = GenericConversionRequest<
    {
        imageOptions?: Partial<ImageConversionOptions>;
    },
    ImageFileFormat
>;

export type GeoConversionRequest = GenericConversionRequest<{}, GeoFileFormat>;

export type DocumentConversionOptions = {
    standalone?: boolean;
    toc?: boolean;
    // mathEngine?: "mathjax" | "katex" | "webtex";
    // pdfEngine?: "pdflatex" | "xelatex" | "wkhtmltopdf";
};

export type DocumentConversionRequest = GenericConversionRequest<
    {
        documentOptions?: Partial<DocumentConversionOptions>;
    },
    DocumentFileFormat | EbookFileFormat
>;

export type VideoConversionRequest = GenericConversionRequest<{}, VideoFileFormat>;

export type AudioConversionOptions = {
    bitrate?: number; // e.g., 128, 192, 256, 320 (kbps)
    sampleRate?: number; // e.g., 44100, 48000
    channels?: number; // 1 for mono, 2 for stereo
};

export type AudioConversionRequest = GenericConversionRequest<
    {
        audioOptions?: Partial<AudioConversionOptions>;
    },
    AudioFileFormat
>;

export type ConversionRequest = ImageConversionRequest | GeoConversionRequest | DocumentConversionRequest | VideoConversionRequest | AudioConversionRequest;

type BaseConversionProgress = {
    fileId: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    message?: string;
};

export type ProcessingConversionProgress = BaseConversionProgress & {
    status: 'processing';
    progress: number;
};

export type CompletedConversionProgress = BaseConversionProgress & {
    status: 'completed';
    progress: 100;
    tempPath: string;
    suggestedFileName: string;
    fileSize: number;
};

export type FailedConversionProgress = BaseConversionProgress & {
    status: 'failed';
    progress: number;
    error: string;
};

export type ConversionProgress = ProcessingConversionProgress | CompletedConversionProgress | FailedConversionProgress;

export type ConversionResult = {
    fileId: string;
    success: boolean;
    message?: string;
} & (
    | {
          success: true;
          tempPath: string;
          suggestedFileName: string;
          fileSize: number;
      }
    | {
          success: false;
          error?: string;
      }
);

export type BatchConversionRequest = {
    conversions: ConversionRequest[];
};

export type BatchConversionProgress = {
    total: number;
    completed: number;
    failed: number;
    current?: ConversionProgress;
};
