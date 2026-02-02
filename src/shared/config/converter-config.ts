import {
    AudioFileFormatZod,
    StructuredFileFormatZod,
    DocumentFileFormatZod,
    EbookFileFormatZod,
    GeoFileFormatZod,
    ImageFileFormatZod,
    VideoFileFormatZod,
    type AudioFileFormat,
    type StructuredFileFormat,
    type DocumentFileFormat,
    type EbookFileFormat,
    type FileFormat,
    type GeoFileFormat,
    type ImageFileFormat,
    type VideoFileFormat,
} from '../types/conversion.types';

export const GeoConversionOptions = {
    geojson: ['gpkg', 'shp', 'kml', 'kmz', 'gpx', 'gml', 'wkt'],
    gpkg: ['geojson', 'shp', 'kml', 'kmz', 'gpx', 'gml', 'wkt'],
    shp: ['geojson', 'gpkg', 'kml', 'kmz', 'gpx', 'gml', 'wkt'],
    kml: ['geojson', 'gpkg', 'shp', 'kmz', 'gpx', 'gml', 'wkt'],
    kmz: ['geojson', 'gpkg', 'shp', 'kml', 'gpx', 'gml', 'wkt'],
    gpx: ['geojson', 'gpkg', 'shp', 'kml', 'kmz', 'gml', 'wkt'],
    gml: ['geojson', 'gpkg', 'shp', 'kml', 'kmz', 'gpx', 'wkt'],
    // wkt: [],
} as const satisfies Partial<Record<GeoFileFormat, GeoFileFormat[]>>;

export const ImageConversionOptions = {
    png: ['jpg', 'jpeg', 'webp', 'tiff', 'bmp', 'ico', 'avif', 'icns'],
    jpg: ['png', 'webp', 'tiff', 'bmp', 'ico', 'avif', 'icns'],
    jpeg: ['png', 'webp', 'tiff', 'bmp', 'ico', 'avif', 'icns'],
    heic: ['png', 'jpg', 'jpeg', 'webp', 'tiff', 'bmp', 'ico', 'avif', 'icns'],
    webp: ['png', 'jpg', 'jpeg', 'tiff', 'bmp', 'ico', 'avif', 'icns'],
    tiff: ['png', 'jpg', 'jpeg', 'webp', 'bmp', 'ico', 'avif', 'icns'],
    bmp: ['png', 'jpg', 'jpeg', 'webp', 'tiff', 'ico', 'avif', 'icns'],
    // ico: ['png', 'jpg', 'jpeg', 'webp', 'tiff', 'bmp', 'avif'], // Imagemagick doesn't seem to support conversion from ico
    avif: ['png', 'jpg', 'jpeg', 'webp', 'tiff', 'bmp', 'ico', 'icns'],
} as const satisfies Partial<Record<ImageFileFormat, ImageFileFormat[]>>;

export const DocumentConversionOptions = {
    docx: ['odt', 'rtf', 'html', 'md', 'tex', 'epub'],
    odt: ['docx', 'rtf', 'html', 'md', 'tex', 'epub'],
    rtf: ['docx', 'odt', 'html', 'md', 'tex'],
    // txt: ['docx', 'odt', 'rtf', 'html', 'md', 'tex'],
    md: ['docx', 'odt', 'rtf', 'html', 'tex', 'epub'],
    html: ['docx', 'odt', 'rtf', 'md', 'tex', 'epub'],
    tex: ['docx', 'odt', 'rtf', 'html', 'md'],
    // pdf: ["docx", "odt", "rtf", "html", "md", "txt", "tex", "epub"], // Pandoc does not support conversion from txt
} as const satisfies Partial<Record<DocumentFileFormat, (DocumentFileFormat | EbookFileFormat)[]>>;

export const EbookConversionOptions = {
    epub: ['docx', 'html', 'md', 'mobi'],
    mobi: ['epub', 'docx', 'html', 'md'],
    azw3: ['epub', 'docx', 'html', 'md'],
} as const satisfies Partial<Record<EbookFileFormat, (DocumentFileFormat | EbookFileFormat)[]>>;

export const VideoConversionOptions = {
    mp4: ['mov', 'webm', 'mkv', 'avi', 'gif', 'm4v', '3gp', 'flv', 'ts', 'mts', 'm2ts', 'wmv', 'ogv', 'mpg', 'mpeg', 'mxf', 'vob'],
    mov: ['mp4', 'webm', 'mkv', 'avi', 'gif', 'm4v', '3gp', 'flv', 'ts', 'mts', 'm2ts', 'wmv', 'ogv', 'mpg', 'mpeg', 'mxf', 'vob'],
    webm: ['mp4', 'mov', 'mkv', 'avi', 'gif', 'm4v', '3gp', 'flv', 'ts', 'mts', 'm2ts', 'wmv', 'ogv', 'mpg', 'mpeg', 'mxf', 'vob'],
    mkv: ['mp4', 'mov', 'webm', 'avi', 'gif', 'm4v', '3gp', 'flv', 'ts', 'mts', 'm2ts', 'wmv', 'ogv', 'mpg', 'mpeg', 'mxf', 'vob'],
    avi: ['mp4', 'mov', 'webm', 'mkv', 'gif', 'm4v', '3gp', 'flv', 'ts', 'mts', 'm2ts', 'wmv', 'ogv', 'mpg', 'mpeg', 'mxf', 'vob'],
    gif: ['mp4', 'mov', 'webm', 'mkv', 'avi', 'm4v', '3gp', 'flv', 'ts', 'mts', 'm2ts', 'wmv', 'ogv', 'mpg', 'mpeg', 'mxf', 'vob'],
    m4v: ['mp4', 'mov', 'webm', 'mkv', 'avi', 'gif', '3gp', 'flv', 'ts', 'mts', 'm2ts', 'wmv', 'ogv', 'mpg', 'mpeg', 'mxf', 'vob'],
    '3gp': ['mp4', 'mov', 'webm', 'mkv', 'avi', 'gif', 'm4v', 'flv', 'ts', 'mts', 'm2ts', 'wmv', 'ogv', 'mpg', 'mpeg', 'mxf', 'vob'],
    flv: ['mp4', 'mov', 'webm', 'mkv', 'avi', 'gif', 'm4v', '3gp', 'ts', 'mts', 'm2ts', 'wmv', 'ogv', 'mpg', 'mpeg', 'mxf', 'vob'],
    ts: ['mp4', 'mov', 'webm', 'mkv', 'avi', 'gif', 'm4v', '3gp', 'flv', 'mts', 'm2ts', 'wmv', 'ogv', 'mpg', 'mpeg', 'mxf', 'vob'],
    mts: ['mp4', 'mov', 'webm', 'mkv', 'avi', 'gif', 'm4v', '3gp', 'flv', 'ts', 'm2ts', 'wmv', 'ogv', 'mpg', 'mpeg', 'mxf', 'vob'],
    m2ts: ['mp4', 'mov', 'webm', 'mkv', 'avi', 'gif', 'm4v', '3gp', 'flv', 'ts', 'mts', 'wmv', 'ogv', 'mpg', 'mpeg', 'mxf', 'vob'],
    wmv: ['mp4', 'mov', 'webm', 'mkv', 'avi', 'gif', 'm4v', '3gp', 'flv', 'ts', 'mts', 'm2ts', 'ogv', 'mpg', 'mpeg', 'mxf', 'vob'],
    ogv: ['mp4', 'mov', 'webm', 'mkv', 'avi', 'gif', 'm4v', '3gp', 'flv', 'ts', 'mts', 'm2ts', 'wmv', 'mpg', 'mpeg', 'mxf', 'vob'],
    mpg: ['mp4', 'mov', 'webm', 'mkv', 'avi', 'gif', 'm4v', '3gp', 'flv', 'ts', 'mts', 'm2ts', 'wmv', 'ogv', 'mpeg', 'mxf', 'vob'],
    mpeg: ['mp4', 'mov', 'webm', 'mkv', 'avi', 'gif', 'm4v', '3gp', 'flv', 'ts', 'mts', 'm2ts', 'wmv', 'ogv', 'mpg', 'mxf', 'vob'],
    mxf: ['mp4', 'mov', 'webm', 'mkv', 'avi', 'gif', 'm4v', '3gp', 'flv', 'ts', 'mts', 'm2ts', 'wmv', 'ogv', 'mpg', 'mpeg', 'vob'],
    vob: ['mp4', 'mov', 'webm', 'mkv', 'avi', 'gif', 'm4v', '3gp', 'flv', 'ts', 'mts', 'm2ts', 'wmv', 'ogv', 'mpg', 'mpeg', 'mxf'],
} as const satisfies Partial<Record<VideoFileFormat, VideoFileFormat[]>>;

export const AudioConversionOptions = {
    mp3: ['wav', 'flac', 'aac', 'm4a', 'ogg', 'wma', 'aiff', 'opus'],
    wav: ['mp3', 'flac', 'aac', 'm4a', 'ogg', 'wma', 'aiff', 'opus'],
    flac: ['mp3', 'wav', 'aac', 'm4a', 'ogg', 'wma', 'aiff', 'opus'],
    aac: ['mp3', 'wav', 'flac', 'm4a', 'ogg', 'wma', 'aiff', 'opus'],
    m4a: ['mp3', 'wav', 'flac', 'aac', 'ogg', 'wma', 'aiff', 'opus'],
    ogg: ['mp3', 'wav', 'flac', 'aac', 'm4a', 'wma', 'aiff', 'opus'],
    wma: ['mp3', 'wav', 'flac', 'aac', 'm4a', 'ogg', 'aiff', 'opus'],
    aiff: ['mp3', 'wav', 'flac', 'aac', 'm4a', 'ogg', 'wma', 'opus'],
    alac: ['mp3', 'wav', 'flac', 'aac', 'm4a', 'ogg', 'wma', 'aiff', 'opus'],
    opus: ['mp3', 'wav', 'flac', 'aac', 'm4a', 'ogg', 'wma', 'aiff'],
    ape: ['mp3', 'wav', 'flac', 'aac', 'm4a', 'ogg', 'aiff', 'opus'],
    wv: ['mp3', 'wav', 'flac', 'aac', 'm4a', 'ogg', 'aiff', 'opus'],
} as const satisfies Partial<Record<AudioFileFormat, AudioFileFormat[]>>;

export const StructuredConversionOptions = {
    json: ['yaml', 'yml', 'plist', 'toml'],
    yaml: ['json', 'plist', 'toml'],
    yml: ['json', 'plist', 'toml'],
    plist: ['json', 'yaml', 'toml'],
    toml: ['json', 'yaml', 'plist'],
} as const satisfies Partial<Record<StructuredFileFormat, StructuredFileFormat[]>>;

export const AllowedConversionOptions = {
    ...GeoConversionOptions,
    ...ImageConversionOptions,
    ...DocumentConversionOptions,
    ...EbookConversionOptions,
    ...VideoConversionOptions,
    ...AudioConversionOptions,
    ...StructuredConversionOptions,
};

export const IMAGE_FORMATS = Object.keys(ImageConversionOptions) as ImageFileFormat[];

export const GEO_FORMATS = Object.keys(GeoConversionOptions) as GeoFileFormat[];

export const DOCUMENT_FORMATS = Object.keys(DocumentConversionOptions) as DocumentFileFormat[];

export const EBOOK_FORMATS = Object.keys(EbookConversionOptions) as EbookFileFormat[];

export const VIDEO_FORMATS = Object.keys(VideoConversionOptions) as VideoFileFormat[];

export const AUDIO_FORMATS = Object.keys(AudioConversionOptions) as AudioFileFormat[];

export const STRUCTURED_FORMATS = Object.keys(StructuredConversionOptions) as StructuredFileFormat[];

export function isConvertableImageFormat(format: FileFormat): format is ImageFileFormat {
    return IMAGE_FORMATS.includes(format as ImageFileFormat);
}

export function isImageTargetFormat(format: FileFormat): format is ImageFileFormat {
    return ImageFileFormatZod.safeParse(format).success;
}

export function isConvertableGeoFormat(format: FileFormat): format is GeoFileFormat {
    return GEO_FORMATS.includes(format as GeoFileFormat);
}

export function isGeoTargetFormat(format: FileFormat): format is GeoFileFormat {
    return GeoFileFormatZod.safeParse(format).success;
}

export function isConvertableDocumentFormat(format: FileFormat): format is DocumentFileFormat {
    return DOCUMENT_FORMATS.includes(format as DocumentFileFormat);
}

export function isDocumentTargetFormat(format: FileFormat): format is DocumentFileFormat {
    return DocumentFileFormatZod.safeParse(format).success;
}

export function isConvertableEbookFormat(format: FileFormat): format is EbookFileFormat {
    return EBOOK_FORMATS.includes(format as EbookFileFormat);
}

export function isEbookTargetFormat(format: FileFormat): format is EbookFileFormat {
    return EbookFileFormatZod.safeParse(format).success;
}

export function isConvertableVideoFormat(format: FileFormat): format is VideoFileFormat {
    return VIDEO_FORMATS.includes(format as VideoFileFormat);
}

export function isVideoTargetFormat(format: FileFormat): format is VideoFileFormat {
    return VideoFileFormatZod.safeParse(format).success;
}

export function isConvertableAudioFormat(format: FileFormat): format is AudioFileFormat {
    return AUDIO_FORMATS.includes(format as AudioFileFormat);
}

export function isAudioTargetFormat(format: FileFormat): format is AudioFileFormat {
    return AudioFileFormatZod.safeParse(format).success;
}

export function isConvertableStructuredFormat(format: FileFormat): format is StructuredFileFormat {
    return STRUCTURED_FORMATS.includes(format as StructuredFileFormat);
}

export function isStructuredTargetFormat(format: FileFormat): format is StructuredFileFormat {
    return StructuredFileFormatZod.safeParse(format).success;
}

export type ConvertableFileFormat = keyof typeof AllowedConversionOptions;
