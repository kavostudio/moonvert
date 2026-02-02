import type { FileFormat } from '../types/conversion.types';

type FormatCategory = 'Raster Image' | 'Vector Geospatial' | 'Document' | 'Ebook' | 'Video' | 'Audio' | 'Configuration';

const formatCategories: Record<string, FormatCategory> = {
    RasterImage: 'Raster Image',
    VectorGeospatial: 'Vector Geospatial',
    Document: 'Document',
    Ebook: 'Ebook',
    Video: 'Video',
    Audio: 'Audio',
    Configuration: 'Configuration',
};

export type FormatMetadata = {
    name: string;
    extension: string;
    description: string;
    category: FormatCategory;
};

export const FORMAT_METADATA: Record<FileFormat, FormatMetadata> = {
    png: {
        name: 'PNG',
        extension: '.png',
        description: 'Portable Network Graphics - Lossless compression with transparency',
        category: formatCategories.RasterImage,
    },
    jpg: {
        name: 'JPG',
        extension: '.jpg',
        description: 'JPEG Image - Lossy compression ideal for photographs',
        category: formatCategories.RasterImage,
    },
    jpeg: {
        name: 'JPEG',
        extension: '.jpeg',
        description: 'JPEG Image - Lossy compression ideal for photographs',
        category: formatCategories.RasterImage,
    },
    heic: {
        name: 'HEIC',
        extension: '.heic',
        description: 'High Efficiency Image - Modern Apple format with better compression',
        category: formatCategories.RasterImage,
    },
    webp: {
        name: 'WebP',
        extension: '.webp',
        description: 'Modern web image format with superior compression',
        category: formatCategories.RasterImage,
    },
    tiff: {
        name: 'TIFF',
        extension: '.tiff',
        description: 'Tagged Image File Format - High quality, large file size',
        category: formatCategories.RasterImage,
    },
    bmp: {
        name: 'BMP',
        extension: '.bmp',
        description: 'Bitmap Image - Uncompressed Windows format',
        category: formatCategories.RasterImage,
    },
    ico: {
        name: 'ICO',
        extension: '.ico',
        description: 'Icon format - Used for favicons and application icons',
        category: formatCategories.RasterImage,
    },
    icns: {
        name: 'ICNS',
        extension: '.icns',
        description: 'Apple Icon Image Format - Used for macOS application icons',
        category: formatCategories.RasterImage,
    },
    avif: {
        name: 'AVIF',
        extension: '.avif',
        description: 'AV1 Image Format - Next-gen format with excellent compression',
        category: formatCategories.RasterImage,
    },

    // Geospatial formats
    geojson: {
        name: 'GeoJSON',
        extension: '.geojson',
        description: 'Geographic JSON - Open standard for web mapping',
        category: formatCategories.VectorGeospatial,
    },
    gpkg: {
        name: 'GeoPackage',
        extension: '.gpkg',
        description: 'SQLite-based geospatial database - OGC standard',
        category: formatCategories.VectorGeospatial,
    },
    shp: {
        name: 'Shapefile',
        extension: '.shp',
        description: 'ESRI Shapefile - Industry standard for GIS data',
        category: formatCategories.VectorGeospatial,
    },
    kml: {
        name: 'KML',
        extension: '.kml',
        description: 'Keyhole Markup Language - Google Earth format',
        category: formatCategories.VectorGeospatial,
    },
    kmz: {
        name: 'KMZ',
        extension: '.kmz',
        description: 'Compressed KML - Zipped Google Earth format',
        category: formatCategories.VectorGeospatial,
    },
    gpx: {
        name: 'GPX',
        extension: '.gpx',
        description: 'GPS Exchange Format - Standard for GPS data',
        category: formatCategories.VectorGeospatial,
    },
    gml: {
        name: 'GML',
        extension: '.gml',
        description: 'Geography Markup Language - OGC XML-based format',
        category: formatCategories.VectorGeospatial,
    },
    wkt: {
        name: 'WKT',
        extension: '.wkt',
        description: 'Well-Known Text - Text-based geometry representation',
        category: formatCategories.VectorGeospatial,
    },

    // Document formats
    docx: {
        name: 'DOCX',
        extension: '.docx',
        description: 'Microsoft Word Document - Modern Office format',
        category: formatCategories.Document,
    },
    odt: {
        name: 'ODT',
        extension: '.odt',
        description: 'OpenDocument Text - Open standard document format',
        category: formatCategories.Document,
    },
    rtf: {
        name: 'RTF',
        extension: '.rtf',
        description: 'Rich Text Format - Universal document format',
        category: formatCategories.Document,
    },
    txt: {
        name: 'TXT',
        extension: '.txt',
        description: 'Plain Text - Simple unformatted text file',
        category: formatCategories.Document,
    },
    md: {
        name: 'Markdown',
        extension: '.md',
        description: 'Markdown - Lightweight markup for formatted text',
        category: formatCategories.Document,
    },
    html: {
        name: 'HTML',
        extension: '.html',
        description: 'HyperText Markup Language - Web document format',
        category: formatCategories.Document,
    },
    tex: {
        name: 'LaTeX',
        extension: '.tex',
        description: 'LaTeX Document - Academic and scientific typesetting',
        category: formatCategories.Document,
    },
    pdf: {
        name: 'PDF',
        extension: '.pdf',
        description: 'Portable Document Format - Universal document standard',
        category: formatCategories.Document,
    },

    // Ebook formats
    epub: {
        name: 'EPUB',
        extension: '.epub',
        description: 'Electronic Publication - Open ebook standard',
        category: formatCategories.Ebook,
    },
    mobi: {
        name: 'MOBI',
        extension: '.mobi',
        description: 'Mobipocket - Kindle-compatible ebook format',
        category: formatCategories.Ebook,
    },
    azw3: {
        name: 'AZW3',
        extension: '.azw3',
        description: 'Kindle Format 8 - Modern Kindle ebook format',
        category: formatCategories.Ebook,
    },

    // Video formats
    mp4: {
        name: 'MP4',
        extension: '.mp4',
        description: 'MPEG-4 Part 14 - widely supported video container',
        category: formatCategories.Video,
    },
    mov: {
        name: 'MOV',
        extension: '.mov',
        description: 'QuickTime Movie - Apple video container format',
        category: formatCategories.Video,
    },
    webm: {
        name: 'WebM',
        extension: '.webm',
        description: 'Open web video format optimized for browsers',
        category: formatCategories.Video,
    },
    mkv: {
        name: 'MKV',
        extension: '.mkv',
        description: 'Matroska - flexible container with broad codec support',
        category: formatCategories.Video,
    },
    avi: {
        name: 'AVI',
        extension: '.avi',
        description: 'Audio Video Interleave - legacy video container format',
        category: formatCategories.Video,
    },
    gif: {
        name: 'GIF',
        extension: '.gif',
        description: 'Animated GIF - short looping image animation',
        category: formatCategories.Video,
    },
    m4v: {
        name: 'M4V',
        extension: '.m4v',
        description: 'MPEG-4 video container used by Apple devices',
        category: formatCategories.Video,
    },
    '3gp': {
        name: '3GP',
        extension: '.3gp',
        description: '3GPP multimedia container for mobile devices',
        category: formatCategories.Video,
    },
    flv: {
        name: 'FLV',
        extension: '.flv',
        description: 'Flash Video container format',
        category: formatCategories.Video,
    },
    ts: {
        name: 'TS',
        extension: '.ts',
        description: 'MPEG transport stream container',
        category: formatCategories.Video,
    },
    mts: {
        name: 'MTS',
        extension: '.mts',
        description: 'AVCHD transport stream container',
        category: formatCategories.Video,
    },
    m2ts: {
        name: 'M2TS',
        extension: '.m2ts',
        description: 'Blu-ray transport stream container',
        category: formatCategories.Video,
    },
    wmv: {
        name: 'WMV',
        extension: '.wmv',
        description: 'Windows Media Video container format',
        category: formatCategories.Video,
    },
    ogv: {
        name: 'OGV',
        extension: '.ogv',
        description: 'Ogg video container format',
        category: formatCategories.Video,
    },
    mpg: {
        name: 'MPG',
        extension: '.mpg',
        description: 'MPEG program stream container',
        category: formatCategories.Video,
    },
    mpeg: {
        name: 'MPEG',
        extension: '.mpeg',
        description: 'MPEG program stream container',
        category: formatCategories.Video,
    },
    mxf: {
        name: 'MXF',
        extension: '.mxf',
        description: 'Material Exchange Format for professional video',
        category: formatCategories.Video,
    },
    vob: {
        name: 'VOB',
        extension: '.vob',
        description: 'DVD Video Object container format',
        category: formatCategories.Video,
    },

    // Audio formats
    mp3: {
        name: 'MP3',
        extension: '.mp3',
        description: 'MPEG Audio Layer III - Universal lossy audio format',
        category: formatCategories.Audio,
    },
    wav: {
        name: 'WAV',
        extension: '.wav',
        description: 'Waveform Audio - Uncompressed PCM audio',
        category: formatCategories.Audio,
    },
    flac: {
        name: 'FLAC',
        extension: '.flac',
        description: 'Free Lossless Audio Codec - Lossless compression',
        category: formatCategories.Audio,
    },
    aac: {
        name: 'AAC',
        extension: '.aac',
        description: 'Advanced Audio Coding - High efficiency lossy format',
        category: formatCategories.Audio,
    },
    m4a: {
        name: 'M4A',
        extension: '.m4a',
        description: 'MPEG-4 Audio - Apple audio container format',
        category: formatCategories.Audio,
    },
    ogg: {
        name: 'OGG',
        extension: '.ogg',
        description: 'Ogg Vorbis - Open source lossy audio format',
        category: formatCategories.Audio,
    },
    wma: {
        name: 'WMA',
        extension: '.wma',
        description: 'Windows Media Audio - Microsoft audio format',
        category: formatCategories.Audio,
    },
    aiff: {
        name: 'AIFF',
        extension: '.aiff',
        description: 'Audio Interchange File Format - Uncompressed Apple audio',
        category: formatCategories.Audio,
    },
    alac: {
        name: 'ALAC',
        extension: '.alac',
        description: 'Apple Lossless Audio Codec - Lossless Apple format',
        category: formatCategories.Audio,
    },
    opus: {
        name: 'Opus',
        extension: '.opus',
        description: 'Opus Audio - Modern efficient lossy codec',
        category: formatCategories.Audio,
    },
    ape: {
        name: 'APE',
        extension: '.ape',
        description: "Monkey's Audio - Lossless audio compression",
        category: formatCategories.Audio,
    },
    wv: {
        name: 'WavPack',
        extension: '.wv',
        description: 'WavPack - Hybrid lossless audio compression',
        category: formatCategories.Audio,
    },

    // Configuration formats
    json: {
        name: 'JSON',
        extension: '.json',
        description: 'JavaScript Object Notation - Human-readable data format',
        category: formatCategories.Configuration,
    },
    yaml: {
        name: 'YAML',
        extension: '.yaml',
        description: "YAML Ain't Markup Language - Human-friendly data serialization",
        category: formatCategories.Configuration,
    },
    yml: {
        name: 'YML',
        extension: '.yml',
        description: "YAML Ain't Markup Language - Human-friendly data serialization",
        category: formatCategories.Configuration,
    },
    plist: {
        name: 'Property List',
        extension: '.plist',
        description: 'Apple Property List - macOS/iOS configuration format',
        category: formatCategories.Configuration,
    },
    toml: {
        name: 'TOML',
        extension: '.toml',
        description: "Tom's Obvious Minimal Language - Simple configuration format",
        category: formatCategories.Configuration,
    },
};

export function getFormatMetadata(format: FileFormat): FormatMetadata {
    return FORMAT_METADATA[format];
}
