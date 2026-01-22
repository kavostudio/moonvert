import { BrowserWindow, ipcMain, nativeTheme } from 'electron';

import { IPCChannels, IPCEvents, type GetThemeResult, type IPCResponse } from 'shared/ipc/ipc-config';

function getThemeState(): GetThemeResult {
    return {
        shouldUseDarkColors: nativeTheme.shouldUseDarkColors,
        themeSource: nativeTheme.themeSource,
    };
}

function getWindowBackgroundColor() {
    return nativeTheme.shouldUseDarkColors ? '#1f1f1f' : '#ffffff';
}

export function setupThemeHandler() {
    ipcMain.handle(IPCChannels.theme.getCurrent, async (_): Promise<IPCResponse<'theme:get-current'>> => {
        return getThemeState();
    });

    nativeTheme.on('updated', () => {
        const themeState = getThemeState();
        const backgroundColor = getWindowBackgroundColor();

        for (const window of BrowserWindow.getAllWindows()) {
            window.setBackgroundColor(backgroundColor);
            window.webContents.send(IPCEvents.theme.updated, themeState);
        }
    });
}
