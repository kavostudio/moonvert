import { createEffect, createEvent, createStore, sample } from 'effector';
import {
    DOCUMENT_FORMATS,
    EBOOK_FORMATS,
    GEO_FORMATS,
    IMAGE_FORMATS,
    VIDEO_FORMATS,
    isConvertableDocumentFormat,
    isConvertableEbookFormat,
    isConvertableGeoFormat,
    isConvertableImageFormat,
    isConvertableVideoFormat,
    isDocumentTargetFormat,
    isEbookTargetFormat,
    isGeoTargetFormat,
    isImageTargetFormat,
    isVideoTargetFormat,
} from 'shared/config/converter-config';
import type {
    ConversionProgress,
    ConversionRequest,
    ConversionResult,
    DocumentConversionRequest,
    DocumentFileFormat,
    EbookFileFormat,
    FileFormat,
    GeoConversionRequest,
    GeoFileFormat,
    ImageConversionRequest,
    ImageFileFormat,
    VideoConversionRequest,
    VideoFileFormat,
} from 'shared/types/conversion.types';
import type { SelectedFile } from 'shared/ipc/ipc-config';
import { getScreenDimensions, Screens, type ScreenType } from './utils';
import { canConvertFileToFormat } from './configuration/helpers';

export type FileState = 'idle' | 'ready' | 'converting' | 'completed' | 'failed';

type Formats =
    | {
          format: ImageFileFormat;
          targetFormat?: ImageFileFormat;
      }
    | {
          format: GeoFileFormat;
          targetFormat?: GeoFileFormat;
      }
    | {
          format: DocumentFileFormat | EbookFileFormat;
          targetFormat?: DocumentFileFormat | EbookFileFormat;
      }
    | {
          format: VideoFileFormat;
          targetFormat?: VideoFileFormat;
      };

export type FileWithMetadata = {
    id: string;
    name: string;
    size: number;
    path?: string;
    isBundle?: boolean; // True for shapefiles
    bundleFiles?: string[]; // List of component extensions

    format: FileFormat;

    state: FileState;
} & (
    | {
          state: 'idle';
      }
    | ({
          state: 'ready';
          convertible: boolean;
      } & Formats)
    | ({
          state: 'converting';
          progress: number;
      } & Formats)
    | ({
          state: 'completed';
          resultData: Buffer;
          resultPath?: string;
          isSaving?: boolean;
          suggestedFileName: string;
          convertedSize: number;
          progress: 100;
      } & Formats)
    | ({
          state: 'failed';
          message: string;
      } & Formats)
);

type AppState = {
    currentScreen: ScreenType;
    files: FileWithMetadata[];
};

function detectFormatAndCheckAcceptance(fileName: string): FileFormat | null {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (!ext) return null;

    if (IMAGE_FORMATS.includes(ext as ImageFileFormat)) {
        return ext as FileFormat;
    }

    if (GEO_FORMATS.includes(ext as GeoFileFormat)) {
        return ext as FileFormat;
    }

    if (DOCUMENT_FORMATS.includes(ext as DocumentFileFormat)) {
        return ext as DocumentFileFormat;
    }

    if (EBOOK_FORMATS.includes(ext as EbookFileFormat)) {
        return ext as FileFormat;
    }

    if (VIDEO_FORMATS.includes(ext as VideoFileFormat)) {
        return ext as FileFormat;
    }

    return null;
}

function generateFileId(): string {
    return `file_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function toFileWithMetadata(file: SelectedFile): FileWithMetadata | null {
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

const mounted = createEvent<boolean>();

const navigateTo = createEvent<ScreenType>();
const resetWizard = createEvent();

const addFiles = createEvent<FileWithMetadata[]>();
const filesOpenedWith = createEvent<FileWithMetadata[]>();
const removeFile = createEvent<string>(); // fileId
const clearFiles = createEvent();

const updateFileTargetFormat = createEvent<{ fileId: string; targetFormat: FileFormat } | { fileId: string; targetFormat: FileFormat }[]>();

const startConversion = createEvent();

const cancelAllConversions = createEvent();

const updateFileProgress = createEvent<{
    fileId: string;
    progress: ConversionProgress;
}>();

const updateFileResult = createEvent<{
    fileId: string;
    result: ConversionResult;
}>();

const updateFileSavedPath = createEvent<{
    fileId: string;
    savedPath: string;
}>();

const setFileSaving = createEvent<{
    fileId: string;
    isSaving: boolean;
}>();

const cancelAllConversionsFx = createEffect(async () => {
    await window.App.conversion.cancelAllConversions();
});

const startConversionFx = createEffect(async () => {
    const state = $appState.getState();

    const filesToConvert = state.files.filter((f) => f.state !== 'idle' && f.path);

    if (filesToConvert.length === 0) {
        throw new Error('No files ready for conversion');
    }

    const conversions: ConversionRequest[] = filesToConvert
        .map((file) => {
            const baseRequest = {
                fileId: file.id,
                sourcePath: file.path!,
            };

            if (file.state !== 'idle' && isConvertableImageFormat(file.format) && isImageTargetFormat(file.targetFormat!)) {
                return {
                    ...baseRequest,
                    sourceFormat: file.format,
                    targetFormat: file.targetFormat,
                } as ImageConversionRequest;
            }

            if (file.state !== 'idle' && isConvertableGeoFormat(file.format) && isGeoTargetFormat(file.targetFormat!)) {
                return {
                    ...baseRequest,
                    sourceFormat: file.format,
                    targetFormat: file.targetFormat,
                } as GeoConversionRequest;
            }

            if (file.state !== 'idle' && isConvertableVideoFormat(file.format) && isVideoTargetFormat(file.targetFormat!)) {
                return {
                    ...baseRequest,
                    sourceFormat: file.format,
                    targetFormat: file.targetFormat,
                } as VideoConversionRequest;
            }

            // Documents and Ebooks
            if (file.state !== 'idle') {
                return {
                    ...baseRequest,
                    sourceFormat: file.format as DocumentFileFormat | EbookFileFormat,
                    targetFormat: file.targetFormat as DocumentFileFormat | EbookFileFormat,
                } as DocumentConversionRequest;
            }

            return null;
        })
        .filter((conversion): conversion is ConversionRequest => conversion !== null);

    window.App.conversion.convertBatch({ conversions });
});

const $appState = createStore<AppState>({
    currentScreen: Screens.Home,
    files: [],
})
    .on(clearFiles, (state) => ({
        ...state,
        files: [],
    }))
    .on(addFiles, (state, newFiles) => ({
        ...state,
        files: [...state.files, ...newFiles],
    }))
    .on(filesOpenedWith, (state, newFiles) => ({
        ...state,
        files: [...state.files, ...newFiles],
        currentScreen: Screens.Configuration,
    }))
    .on(removeFile, (state, fileId) => ({
        ...state,
        files: state.files.filter((file) => file.id !== fileId),
    }))
    .on(resetWizard, (state) => ({
        ...state,
        currentScreen: Screens.Home,
        files: [],
    }));

sample({
    clock: navigateTo,
    source: $appState,
    fn: (state, screen) => {
        if (screen === Screens.Home) {
            return {
                ...state,
                files: [],
                currentScreen: screen,
            };
        }
        return {
            ...state,
            currentScreen: screen,
        };
    },
    target: $appState,
});

sample({
    clock: updateFileTargetFormat,
    source: $appState,
    fn: (state, updates): AppState => {
        const updateArray = Array.isArray(updates) ? updates : [updates];
        const updateMap = new Map(updateArray.map((u) => [u.fileId, u.targetFormat]));

        return {
            ...state,
            files: state.files.map((file): FileWithMetadata => {
                const targetFormat = updateMap.get(file.id);
                if (!targetFormat) return file;

                if (isConvertableImageFormat(file.format) && isImageTargetFormat(targetFormat)) {
                    return {
                        ...file,
                        format: file.format as ImageFileFormat,
                        targetFormat: targetFormat as ImageFileFormat,
                        state: 'ready',
                        convertible: canConvertFileToFormat(file, targetFormat),
                    } satisfies FileWithMetadata;
                }

                if (isConvertableGeoFormat(file.format) && isGeoTargetFormat(targetFormat)) {
                    return {
                        ...file,
                        format: file.format as GeoFileFormat,
                        targetFormat: targetFormat as GeoFileFormat,
                        state: 'ready',
                        convertible: canConvertFileToFormat(file, targetFormat),
                    } satisfies FileWithMetadata;
                }

                if (
                    (isConvertableDocumentFormat(file.format) || isConvertableEbookFormat(file.format)) &&
                    (isDocumentTargetFormat(targetFormat) || isEbookTargetFormat(targetFormat))
                ) {
                    return {
                        ...file,
                        format: file.format as DocumentFileFormat | EbookFileFormat,
                        targetFormat: targetFormat as DocumentFileFormat | EbookFileFormat,
                        state: 'ready',
                        convertible: canConvertFileToFormat(file, targetFormat),
                    } satisfies FileWithMetadata;
                }

                if (isConvertableVideoFormat(file.format) && isVideoTargetFormat(targetFormat)) {
                    return {
                        ...file,
                        format: file.format as VideoFileFormat,
                        targetFormat: targetFormat as VideoFileFormat,
                        state: 'ready',
                        convertible: canConvertFileToFormat(file, targetFormat),
                    } satisfies FileWithMetadata;
                }

                return file;
            }),
        };
    },
    target: $appState,
});

sample({
    source: $appState,
    clock: startConversion,
    fn: (state) =>
        ({
            ...state,
            files: state.files.map((file) => {
                if (file.state === 'idle') return file;

                return file.state === 'ready' ? { ...file, state: 'converting', progress: 0 } : file;
            }),
        }) satisfies AppState,
    target: $appState,
});

sample({
    source: $appState,
    clock: cancelAllConversions,
    fn: (state) => ({
        ...state,
        currentScreen: Screens.Configuration,
        files: state.files.map((file) => {
            return {
                ...file,
                state: 'idle',
            } satisfies FileWithMetadata;
        }),
    }),
    target: $appState,
});

// Update file progress during conversion
sample({
    clock: updateFileProgress,
    source: $appState,
    fn: (state, { fileId, progress }) => {
        return {
            ...state,
            files: state.files.map((file) => {
                if (file.state === 'idle') return file;
                if (file.id !== fileId) return file;

                if (progress.status === 'processing') {
                    return {
                        ...file,
                        state: 'converting',
                        progress: progress.progress,
                    } satisfies FileWithMetadata;
                }

                if (progress.status === 'completed') {
                    return {
                        ...file,
                        state: 'completed',
                        suggestedFileName: progress.suggestedFileName,
                        progress: 100 as const,
                        resultData: progress.data,
                        convertedSize: progress.fileSize,
                        resultPath: progress.savedPath,
                    } satisfies FileWithMetadata;
                }

                if (progress.status === 'failed') {
                    return {
                        ...file,
                        state: 'failed',
                        message: progress.error ?? 'Conversion failed',
                    } satisfies FileWithMetadata;
                }

                return file;
            }),
        };
    },
    target: $appState,
});

sample({
    clock: updateFileSavedPath,
    source: $appState,
    fn: (state, { fileId, savedPath }) => ({
        ...state,
        files: state.files.map((file) => (file.id === fileId ? { ...file, resultPath: savedPath } : file)),
    }),
    target: $appState,
});

sample({
    clock: setFileSaving,
    source: $appState,
    fn: (state, { fileId, isSaving }) => ({
        ...state,
        files: state.files.map((file) => (file.id === fileId ? { ...file, isSaving } : file)),
    }),
    target: $appState,
});

const updateScreenDimensions = createEffect(async (screen: ScreenType) => {
    const { width, height } = getScreenDimensions(screen);
    await window.App.window.setSize(width, height);
});

sample({
    source: $appState,
    clock: [$appState.map((state) => state.currentScreen).updates, mounted],
    fn: (state) => state.currentScreen,
    target: updateScreenDimensions,
});

sample({
    clock: startConversion,
    target: startConversionFx,
});

sample({
    clock: cancelAllConversions,
    target: cancelAllConversionsFx,
});

if (typeof window !== 'undefined' && window.App?.conversion) {
    window.App.conversion.onBatchProgress((progress) => {
        console.log('Batch conversion progress:', progress);
        if (progress.current) {
            updateFileProgress({
                fileId: progress.current.fileId,
                progress: progress.current,
            });
        }
    });
}

if (typeof window !== 'undefined' && window.App?.file?.onFileOpenedWith) {
    window.App.file.onFileOpenedWith(({ files }) => {
        const converted = files.map((file) => toFileWithMetadata(file)).filter((file): file is FileWithMetadata => Boolean(file));

        if (converted.length > 0) {
            filesOpenedWith(converted);
        }
    });
}

const $allFilesProcessed = createStore<boolean>(false).on([$appState.map((state) => state.files).updates], (state, files) => {
    if (files.length === 0) return false;
    console.log({
        filesLeftToProcess: files.filter((file) => file.state !== 'completed' && file.state !== 'failed').length,
    });

    return files.every((file) => file.state === 'completed' || file.state === 'failed');
});

export const $$main = {
    $appState,
    $allFilesProcessed,

    mounted,

    Screens,

    navigateTo,

    resetWizard,

    addFiles,
    filesOpenedWith,
    removeFile,
    clearFiles,

    updateFileTargetFormat,

    startConversion,
    cancelAllConversions,
    updateFileProgress,
    updateFileResult,
    updateFileSavedPath,

    setFileSaving,

    updateScreenDimensions,
};
