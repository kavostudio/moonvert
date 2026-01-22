import { ipcRenderer } from 'electron';

import { IPCChannels, IPCEvents, type GetThemeResult } from 'shared/ipc/ipc-config';

export const themeAPI = {
    getCurrent: (): Promise<GetThemeResult> => ipcRenderer.invoke(IPCChannels.theme.getCurrent),

    onThemeUpdated: (callback: (theme: GetThemeResult) => void): (() => void) => {
        const listener = (_: unknown, theme: GetThemeResult) => callback(theme);
        ipcRenderer.on(IPCEvents.theme.updated, listener);
        return () => {
            ipcRenderer.removeListener(IPCEvents.theme.updated, listener);
        };
    },
};
