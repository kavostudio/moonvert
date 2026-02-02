import { createEffect, createEvent, createStore, sample } from 'effector';
import {
    isAudioTargetFormat,
    isStructuredTargetFormat,
    isConvertableAudioFormat,
    isConvertableStructuredFormat,
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
    AudioFileFormat,
    ConversionProgress,
    ConversionRequest,
    DocumentFileFormat,
    EbookFileFormat,
    FileFormat,
    GeoFileFormat,
    ImageFileFormat,
    VideoFileFormat,
} from 'shared/types/conversion.types';
import { toast } from 'sonner';
import { canConvertFileToFormat } from './configuration/helpers';
import { toFileWithMetadata } from './file-utils';
import { getScreenDimensions, Screens, type ScreenType } from './utils';

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
      }
    | {
          format: AudioFileFormat;
          targetFormat?: AudioFileFormat;
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
          resultPath: string;
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

export type FailedFile = FileWithMetadata & { state: 'failed' };

type AppState = {
    currentScreen: ScreenType;
    files: FileWithMetadata[];
};

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

const convertFx = createEffect(async () => {
    const state = $appState.getState();

    const filesToConvert = state.files.filter((f) => f.state !== 'idle' && f.path);

    if (filesToConvert.length === 0) {
        throw new Error('No files ready for conversion');
    }

    const conversions = filesToConvert
        .map((file): ConversionRequest | null => {
            if (file.state === 'idle' || !file.targetFormat || !file.path) {
                return null;
            }

            const baseRequest = {
                fileId: file.id,
                sourcePath: file.path,
            };

            if (
                (isConvertableImageFormat(file.format) && isImageTargetFormat(file.targetFormat)) ||
                (isConvertableGeoFormat(file.format) && isGeoTargetFormat(file.targetFormat)) ||
                (isConvertableVideoFormat(file.format) && isVideoTargetFormat(file.targetFormat)) ||
                (isConvertableAudioFormat(file.format) && isAudioTargetFormat(file.targetFormat)) ||
                (isConvertableStructuredFormat(file.format) && isStructuredTargetFormat(file.targetFormat)) ||
                ((isConvertableDocumentFormat(file.format) || isConvertableEbookFormat(file.format)) &&
                    (isDocumentTargetFormat(file.targetFormat) || isEbookTargetFormat(file.targetFormat)))
            ) {
                return {
                    ...baseRequest,
                    sourceFormat: file.format,
                    targetFormat: file.targetFormat,
                } as ConversionRequest;
            }

            return null;
        })
        .filter((conversion): conversion is ConversionRequest => conversion !== null);

    return await window.App.conversion.convertBatch({ conversions });
});

sample({
    clock: convertFx.doneData,
    fn: (result) => {
        return result;
    },
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

                if (
                    (isConvertableImageFormat(file.format) && isImageTargetFormat(targetFormat)) ||
                    (isConvertableGeoFormat(file.format) && isGeoTargetFormat(targetFormat)) ||
                    ((isConvertableDocumentFormat(file.format) || isConvertableEbookFormat(file.format)) &&
                        (isDocumentTargetFormat(targetFormat) || isEbookTargetFormat(targetFormat))) ||
                    (isConvertableVideoFormat(file.format) && isVideoTargetFormat(targetFormat)) ||
                    (isConvertableAudioFormat(file.format) && isAudioTargetFormat(targetFormat)) ||
                    (isConvertableStructuredFormat(file.format) && isStructuredTargetFormat(targetFormat))
                ) {
                    return {
                        ...file,
                        format: file.format,
                        targetFormat: targetFormat,
                        state: 'ready',
                        convertible: canConvertFileToFormat(file, targetFormat),
                    } as FileWithMetadata;
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
                if (file.state === 'idle' || file.id !== fileId) return file;

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
                        progress: progress.progress,
                        resultPath: progress.tempPath,
                        convertedSize: progress.fileSize,
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
    target: convertFx,
});

sample({
    clock: cancelAllConversions,
    target: cancelAllConversionsFx,
});

if (typeof window !== 'undefined' && window.App?.conversion) {
    window.App.conversion.onBatchProgress((progress) => {
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

const $allFilesProcessed = createStore<boolean>(false).on([$appState.map((state) => state.files).updates], (_, files) => {
    if (files.length === 0) return false;

    return files.every((file) => file.state === 'completed' || file.state === 'failed');
});

sample({
    source: $appState,
    clock: $allFilesProcessed,
    filter: (_, isProcessed) => isProcessed === true,
    fn: (state) => {
        const failed = state.files.filter((f) => f.state === 'failed').length;

        const title = failed > 0 ? 'Conversion Finished' : 'Conversion Complete';

        if (failed > 0) {
            toast.error(title, {});
        } else {
            toast.success(title, {});
        }
    },
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
    updateFileSavedPath,

    setFileSaving,

    updateScreenDimensions,
};
