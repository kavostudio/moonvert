import { ipcMain, BrowserWindow, shell } from 'electron';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { IPCChannels } from 'shared/ipc/ipc-config';
import type { IPCRequest, IPCResponse } from 'shared/ipc/ipc-config';
import { getDebugLogPath } from 'main/utils/debug-logger';

export function registerWindowHandlers() {
    ipcMain.handle(IPCChannels.window.setSize, async (event, request: IPCRequest<'window:set-size'>): Promise<IPCResponse<'window:set-size'>> => {
        try {
            const window = BrowserWindow.fromWebContents(event.sender);
            if (!window) {
                return { success: false };
            }

            const currentSize = window.getSize();
            const newWidth = request.width ?? currentSize[0];
            const newHeight = request.height ?? currentSize[1];

            window.setSize(newWidth, newHeight, true);

            return { success: true };
        } catch (error) {
            return { success: false };
        }
    });

    ipcMain.handle(IPCChannels.window.getSize, async (event): Promise<IPCResponse<'window:get-size'>> => {
        try {
            const window = BrowserWindow.fromWebContents(event.sender);
            if (!window) {
                return { width: 0, height: 0 };
            }

            const [width, height] = window.getSize();

            return { width, height };
        } catch (error) {
            return { width: 0, height: 0 };
        }
    });

    ipcMain.handle(IPCChannels.window.openDebugLog, async (): Promise<IPCResponse<'window:open-debug-log'>> => {
        try {
            const logPath = getDebugLogPath();
            if (!logPath) {
                return { success: false, error: 'Debug log path unavailable.' };
            }

            await mkdir(dirname(logPath), { recursive: true });
            await writeFile(logPath, '', { flag: 'a' });

            const result = await shell.openPath(logPath);
            if (result) {
                return { success: false, error: result };
            }

            return { success: true, path: logPath };
        } catch (error) {
            return { success: false, error: 'Failed to open debug log.' };
        }
    });
}
