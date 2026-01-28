import { app, BrowserWindow, shell, type BrowserWindowConstructorOptions } from 'electron';
import { join } from 'node:path';

import { createWindow } from 'lib/electron-app/factories/windows/create';
import { ENVIRONMENT } from 'shared/config/constants';
import { displayName } from '~/package.json';

export async function MainWindow(options: BrowserWindowConstructorOptions) {
    const window = createWindow({
        id: 'main',
        title: displayName,
        width: 708,
        height: 448,
        minWidth: 708,
        minHeight: 448,
        show: false,
        center: false,
        movable: true,
        resizable: false,
        alwaysOnTop: false,
        autoHideMenuBar: true,
        titleBarStyle: 'hiddenInset',
        frame: false,
        backgroundMaterial: 'auto',
        transparent: true,

        webPreferences: {
            preload: join(__dirname, '../preload/index.js'),
            // Enable file drops
            webSecurity: ENVIRONMENT.IS_DEV ? false : true,
            // Allow accessing file paths from dropped files
            nodeIntegrationInWorker: false,
        },

        ...options,
    });

    window.webContents.on('did-finish-load', () => {
        if (ENVIRONMENT.IS_DEV) {
            window.webContents.openDevTools({ mode: 'detach' });
        }

        window.show();
    });

    window.webContents.setWindowOpenHandler(({ url }) => {
        shell.openExternal(url);
        return { action: 'deny' };
    });

    window.on('close', (event) => {
        const isQuitting = (app as { isQuitting?: boolean }).isQuitting === true;
        if (process.platform === 'darwin' && !isQuitting) {
            event.preventDefault();
            window.hide();
            return;
        }

        for (const window of BrowserWindow.getAllWindows()) {
            window.destroy();
        }
    });

    return window;
}
