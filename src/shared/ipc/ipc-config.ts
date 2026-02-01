import type { BatchConversionProgress, BatchConversionRequest, ConversionRequest, ConversionResult } from '../types/conversion.types';
import type { LicenseState, ActivateLicenseRequest, ActivateLicenseResult, CanConvertResult } from '../types/license.types';

export type SelectedFile = {
    path: string;
    name: string;
    size: number;
    isBundle?: boolean; // True for shapefiles
    bundleFiles?: string[]; // List of component extensions: ['.shp', '.shx', '.dbf', '.prj']
};

export type fileSelectionResult = {
    canceled: boolean;
    files: SelectedFile[];
};

export type SaveDroppedFileRequest = {
    fileName: string;
    fileData: ArrayBuffer;
};

export type SaveDroppedFileResult = {
    success: boolean;
    file?: SelectedFile;
    error?: string;
};

export type CancelConversionRequest = {
    fileId: string;
};

export type CancelConversionResult = {
    success: boolean;
    fileId: string;
};

export type CancelAllConversionsRequest = void;

export type CancelAllConversionsResult = {
    success: boolean;
};

export type SaveAllToFolderRequest = {
    files: Array<{
        fileId: string;
        tempPath: string;
        suggestedFileName: string;
    }>;
};

export type SaveAllToFolderResult = {
    success: boolean;
    savedPaths?: Record<string, string>; // fileId -> savedPath
    error?: string;
};

export type CopyFilesToClipboardRequest = {
    files: Array<{
        fileId: string;
        tempPath: string;
        suggestedFileName: string;
    }>;
};

export type CopyFilesToClipboardResult = {
    success: boolean;
    copiedCount?: number;
    error?: string;
};

export type ThemeSource = 'system' | 'light' | 'dark';

export type GetThemeResult = {
    shouldUseDarkColors: boolean;
    themeSource: ThemeSource;
};

export type SetWindowSizeRequest = {
    width?: number;
    height?: number;
};

export type SetWindowSizeResult = {
    success: boolean;
};

export type OpenDebugLogResult = {
    success: boolean;
    path?: string;
    error?: string;
};

export type IPCChannelMap = {
    'file:select-files': {
        request: void;
        response: fileSelectionResult;
    };
    'file:save-dropped-file': {
        request: SaveDroppedFileRequest;
        response: SaveDroppedFileResult;
    };

    'conversion:convert-file': {
        request: ConversionRequest;
        response: ConversionResult;
    };
    'conversion:convert-batch': {
        request: BatchConversionRequest;
        response: ConversionResult[];
    };
    'conversion:cancel': {
        request: CancelConversionRequest;
        response: CancelConversionResult;
    };
    'conversion:cancel-all': {
        request: CancelAllConversionsRequest;
        response: CancelAllConversionsResult;
    };
    'file:save-all-to-folder': {
        request: SaveAllToFolderRequest;
        response: SaveAllToFolderResult;
    };
    'file:copy-to-clipboard': {
        request: CopyFilesToClipboardRequest;
        response: CopyFilesToClipboardResult;
    };

    'theme:get-current': {
        request: void;
        response: GetThemeResult;
    };
    'window:set-size': {
        request: SetWindowSizeRequest;
        response: SetWindowSizeResult;
    };
    'window:get-size': {
        request: void;
        response: { width: number; height: number };
    };
    'window:open-debug-log': {
        request: void;
        response: OpenDebugLogResult;
    };

    'license:get-state': {
        request: void;
        response: LicenseState;
    };
    'license:activate': {
        request: ActivateLicenseRequest;
        response: ActivateLicenseResult;
    };
    'license:can-convert': {
        request: void;
        response: CanConvertResult;
    };
    'license:reset-for-testing': {
        request: void;
        response: void;
    };
    'license:get-debug-info': {
        request: void;
        response: Record<string, unknown> | null;
    };
};

export type IPCEventMap = {
    'conversion:batch-progress': BatchConversionProgress;
    'theme:updated': GetThemeResult;
    'file:opened-with': {
        files: SelectedFile[];
        timestamp: number;
    };
    'license:state-changed': LicenseState;
};

export type IPCChannel = keyof IPCChannelMap;

export type IPCEvent = keyof IPCEventMap;

export type IPCRequest<T extends IPCChannel> = IPCChannelMap[T]['request'];

export type IPCResponse<T extends IPCChannel> = IPCChannelMap[T]['response'];

export type IPCEventData<T extends IPCEvent> = IPCEventMap[T];

export const IPCChannels = {
    files: {
        selectFiles: 'file:select-files',
        saveDroppedFile: 'file:save-dropped-file',
        saveAllToFolder: 'file:save-all-to-folder',
        copyToClipboard: 'file:copy-to-clipboard',
    },

    conversion: {
        convertFile: 'conversion:convert-file',
        convertBatch: 'conversion:convert-batch',
        cancel: 'conversion:cancel',
        cancelAll: 'conversion:cancel-all',
    },

    theme: {
        getCurrent: 'theme:get-current',
    },

    window: {
        setSize: 'window:set-size',
        getSize: 'window:get-size',
        openDebugLog: 'window:open-debug-log',
    },

    license: {
        getState: 'license:get-state',
        activate: 'license:activate',
        canConvert: 'license:can-convert',
        resetForTesting: 'license:reset-for-testing',
        getDebugInfo: 'license:get-debug-info',
    },
} as const satisfies Record<string, Record<string, IPCChannel>>;

export const IPCEvents = {
    conversion: {
        batchProgress: 'conversion:batch-progress',
    },
    theme: {
        updated: 'theme:updated',
    },
    files: {
        openedWith: 'file:opened-with',
    },
    license: {
        stateChanged: 'license:state-changed',
    },
} as const satisfies Record<string, Record<string, IPCEvent>>;
