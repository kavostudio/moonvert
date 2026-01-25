import { combine, createEvent, createStore, sample } from 'effector';
import type { FileFormat } from 'shared/types/conversion.types';
import { $$main } from '../model';
import type { FileGroup } from './helpers';
import { groupFilesByType } from './helpers';

type ConfigurationState = {
    steps: FileGroup[];
    currentStepIndex: number;
    selectedTargetFormats: Record<FileGroup, FileFormat | null>;
};

const initialize = createEvent();
const nextStep = createEvent();
const previousStep = createEvent();
const setTargetFormat = createEvent<{ group: FileGroup; format: FileFormat }>();
const reset = createEvent();

const $initialized = createStore(false)
    .reset(reset)
    .on(initialize, () => true);

const $configState = createStore<ConfigurationState>({
    steps: [],
    currentStepIndex: 0,
    selectedTargetFormats: {
        images: null,
        documents: null,
        geospatial: null,
        books: null,
        videos: null,
        audio: null,
    },
}).reset(reset);

const $groupedFiles = $$main.$appState.map((state) => groupFilesByType(state.files));

const $canProceedToNextStep = combine($configState, $groupedFiles, (configState, groupedFiles) => {
    const currentGroup = configState.steps[configState.currentStepIndex];
    if (!currentGroup) {
        return false;
    }
    const currentFiles = groupedFiles[currentGroup];
    if (currentFiles.length === 0) {
        return false;
    }
    const targetFormat = configState.selectedTargetFormats[currentGroup];
    if (!targetFormat) {
        return false;
    }

    if (currentFiles.some((f) => f.state === 'ready' && f.convertible === false)) {
        return false;
    }

    return true;
});

sample({
    clock: initialize,
    source: $groupedFiles,
    fn: (grouped): ConfigurationState => {
        const steps = (Object.entries(grouped) as [FileGroup, unknown[]][]).filter(([_, files]) => files.length > 0).map(([group]) => group);

        return {
            steps,
            currentStepIndex: 0,
            selectedTargetFormats: {
                images: null,
                documents: null,
                geospatial: null,
                books: null,
                videos: null,
                audio: null,
            },
        };
    },
    target: $configState,
});

sample({
    clock: nextStep,
    source: $configState,
    fn: (state) => {
        const isOnSummary = state.currentStepIndex === state.steps.length;

        if (isOnSummary) {
            return state;
        }

        return {
            ...state,
            currentStepIndex: state.currentStepIndex + 1,
        };
    },
    target: $configState,
});

sample({
    clock: previousStep,
    source: $configState,
    fn: (state) => {
        if (state.currentStepIndex === 0) {
            return state;
        }

        return {
            ...state,
            currentStepIndex: state.currentStepIndex - 1,
        };
    },
    target: $configState,
});

sample({
    clock: setTargetFormat,
    source: $configState,
    fn: (state, { group, format }) => ({
        ...state,
        selectedTargetFormats: {
            ...state.selectedTargetFormats,
            [group]: format,
        },
    }),
    target: $configState,
});

sample({
    clock: setTargetFormat,
    source: combine($$main.$appState, $groupedFiles),
    fn: ([appState, grouped], { group, format }) => {
        const filesInGroup = grouped[group] || [];
        return filesInGroup.map((file) => ({
            fileId: file.id,
            targetFormat: format,
        }));
    },
    target: $$main.updateFileTargetFormat,
});

// When a file is removed, check if we need to re-initialize steps
sample({
    clock: $$main.removeFile,
    source: combine($configState, $groupedFiles),
    filter: ([_, grouped]) => {
        // Re-initialize if any group becomes empty
        const steps = (Object.entries(grouped) as [FileGroup, unknown[]][]).filter(([_, files]) => files.length > 0).map(([group]) => group);
        return steps.length > 0;
    },
    fn: ([configState, grouped]) => {
        const newSteps = (Object.entries(grouped) as [FileGroup, unknown[]][]).filter(([_, files]) => files.length > 0).map(([group]) => group);

        // Keep the same group if it still has files, otherwise go to first step
        const currentGroup = configState.steps[configState.currentStepIndex];
        const currentGroupStillExists = newSteps.includes(currentGroup);

        return {
            steps: newSteps,
            currentStepIndex: currentGroupStillExists ? newSteps.indexOf(currentGroup) : 0,
            selectedTargetFormats: configState.selectedTargetFormats,
        };
    },
    target: $configState,
});

// If all files are removed, navigate back to home
sample({
    clock: $$main.removeFile,
    source: $groupedFiles,
    filter: (grouped) => {
        const hasAnyFiles = Object.values(grouped).some((files) => files.length > 0);
        return !hasAnyFiles;
    },
    fn: () => $$main.Screens.Home,
    target: $$main.navigateTo,
});

sample({
    clock: $$main.navigateTo,
    filter: (screen) => screen !== $$main.Screens.Configuration,
    target: reset,
});

export const $$configuration = {
    $configState,
    $groupedFiles,

    initialize,
    reset,
    $initialized,

    nextStep,
    previousStep,
    setTargetFormat,

    $canProceedToNextStep,
};
