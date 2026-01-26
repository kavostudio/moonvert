import { app, BrowserWindow, dialog } from 'electron';
import electronUpdater from 'electron-updater';

const { autoUpdater } = electronUpdater;

import { makeAppWithSingleInstanceLock } from 'lib/electron-app/factories/app/instance';
import { makeAppSetup } from 'lib/electron-app/factories/app/setup';
import { loadReactDevtools } from 'lib/electron-app/utils';
import { ENVIRONMENT } from 'shared/config/constants';
import { MainWindow } from './windows/main-window';
import { waitFor } from 'shared/utils';
import { registerConversionHandlers } from './ipc/conversion-handler';
import { registerFileHandlers } from './ipc/file-handler';
import { setupThemeHandler } from './ipc/theme-handler';
import { registerWindowHandlers } from './ipc/window-handler';
import { conversionManager } from './converters/conversion-manager';
import { cleanupTempFiles } from './utils/cleanup';
import { getDebugLogPath, isDebugEnabled, logDebug } from './utils/debug-logger';
import { IPCEvents } from 'shared/ipc/ipc-config';
import { processOpenWithFiles } from './ipc/utils';
import { MainEnv } from './main-env';

import windowStateKeeper from 'electron-window-state';

let mainWindow: BrowserWindow | null = null;
let pendingOpenWithPaths: string[] = [];
let handlersRegistered = false;

function focusWindow(window: BrowserWindow) {
    if (window.isMinimized()) {
        window.restore();
    }

    window.show();
    window.focus();
}

function sendOpenWithFiles(window: BrowserWindow, files: { path: string; name: string; size: number; isBundle?: boolean; bundleFiles?: string[] }[]) {
    const payload = {
        files,
        timestamp: Date.now(),
    };

    if (window.webContents.isLoading()) {
        void logDebug('Window is loading, will send opened files after load');
        window.webContents.once('did-finish-load', () => {
            void logDebug('Window finished loading, sending opened files now');
            window.webContents.send(IPCEvents.files.openedWith, payload);
        });
    } else {
        void logDebug('Window is not loading, sending opened files immediately');
        window.webContents.send(IPCEvents.files.openedWith, payload);
    }

    focusWindow(window);
}

async function handleOpenWithFiles(filePaths: string[]) {
    if (filePaths.length === 0) return;

    void logDebug('Handling open-with files', { count: filePaths.length });

    const { files, rejected } = await processOpenWithFiles(filePaths);

    if (files.length === 0) {
        const dialogWindow = mainWindow ?? BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0];
        if (dialogWindow) {
            dialog.showMessageBox(dialogWindow, {
                type: 'error',
                title: 'Unsupported File',
                message: 'No supported files were opened.',
                detail: 'Moonvert supports images, geospatial files, documents, and ebooks.',
            });
        }
        void logDebug('No supported files were opened');
        return;
    }

    if (mainWindow) {
        void logDebug('Sending opened files to main window', { fileCount: files.length });
        sendOpenWithFiles(mainWindow, files);
    } else {
        void logDebug('No main window to send opened files to, queuing paths', { fileCount: files.length });
        pendingOpenWithPaths = [...pendingOpenWithPaths, ...filePaths];
    }

    if (rejected.length > 0) {
        void logDebug('Some opened files were rejected', { rejected });
    }
}

if (process.platform === 'darwin') {
    app.on('open-file', (event, filePath) => {
        event.preventDefault();

        void logDebug('App opened with file', { filePath });

        if (app.isReady()) {
            handleOpenWithFiles([filePath]);
            void logDebug('Processed open-with file after app ready', { filePath });
        } else {
            pendingOpenWithPaths = [...pendingOpenWithPaths, filePath];
        }
    });
}

makeAppWithSingleInstanceLock(async () => {
    await app.whenReady();

    (app as { isQuitting?: boolean }).isQuitting = false;

    if (isDebugEnabled()) {
        const logPath = getDebugLogPath();
        void logDebug('Debug logging enabled', {
            version: app.getVersion(),
            nodeEnv: process.env.NODE_ENV,
            logPath: logPath || undefined,
        });

        process.on('uncaughtException', (error) => {
            void logDebug('Uncaught exception', {
                message: error.message,
                stack: error.stack,
            });
        });

        process.on('unhandledRejection', (reason) => {
            void logDebug('Unhandled rejection', {
                reason: reason instanceof Error ? reason.message : String(reason),
            });
        });
    }

    if (app.isPackaged && process.platform === 'darwin' && MainEnv.MOONVERT_UPDATE_URL && MainEnv.MOONVERT_UPDATE_SECRET && MainEnv.MOONVERT_AUTH_HEADER) {
        const updateUrl = MainEnv.MOONVERT_UPDATE_URL;
        const updateSecret = MainEnv.MOONVERT_UPDATE_SECRET;

        autoUpdater.setFeedURL({
            provider: 'generic',
            url: updateUrl,
        });
        autoUpdater.requestHeaders = { [MainEnv.MOONVERT_AUTH_HEADER]: updateSecret };

        autoUpdater.autoDownload = true;
        autoUpdater.autoInstallOnAppQuit = false;

        autoUpdater.on('checking-for-update', () => {
            void logDebug('AutoUpdater: checking for updates');
        });

        autoUpdater.on('update-available', (info) => {
            void logDebug('AutoUpdater: update available', { version: info.version });
        });

        autoUpdater.on('update-not-available', (info) => {
            void logDebug('AutoUpdater: no update available', { version: info.version });
        });

        autoUpdater.on('error', (error) => {
            void logDebug('AutoUpdater: error', { message: error.message });
        });

        autoUpdater.on('download-progress', (progress) => {
            void logDebug('AutoUpdater: download progress', {
                percent: progress.percent,
                bytesPerSecond: progress.bytesPerSecond,
                transferred: progress.transferred,
                total: progress.total,
            });
        });

        autoUpdater.on('update-downloaded', async (info) => {
            void logDebug('AutoUpdater: update downloaded', { version: info.version });

            const dialogWindow = mainWindow ?? BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0];
            if (!dialogWindow) {
                autoUpdater.quitAndInstall();
                return;
            }

            const { response } = await dialog.showMessageBox(dialogWindow, {
                type: 'info',
                buttons: ['Install and Restart', 'Later'],
                defaultId: 0,
                cancelId: 1,
                title: 'Update Ready',
                message: `Moonvert ${info.version} is ready to install.`,
                detail: 'Restart the app to apply the update.',
            });

            if (response === 0) {
                (app as { isQuitting?: boolean }).isQuitting = true;
                autoUpdater.quitAndInstall();
            }
        });

        void autoUpdater.checkForUpdates();
    }

    const createMainWindow = async (): Promise<BrowserWindow> => {
        const mainWindowState = windowStateKeeper({
            defaultWidth: 1000,
            defaultHeight: 800,
        });

        const window = await makeAppSetup(() =>
            MainWindow({
                x: mainWindowState.x,
                y: mainWindowState.y,
                width: mainWindowState.width,
                height: mainWindowState.height,
            }),
        );

        mainWindowState.manage(window);

        window.on('closed', () => {
            if (mainWindow === window) {
                mainWindow = null;
            }
        });

        if (!handlersRegistered) {
            registerConversionHandlers(window);
            registerFileHandlers();
            setupThemeHandler();
            registerWindowHandlers();
            handlersRegistered = true;
        }

        return window;
    };

    const window = await createMainWindow();
    mainWindow = window;

    // Clean up temporary files on app quit
    app.on('before-quit', async (event) => {
        const alreadyQuitting = (app as { isQuitting?: boolean }).isQuitting === true;

        if (alreadyQuitting) {
            // Already quitting (e.g., from quitAndInstall), let it proceed naturally
            conversionManager.abortAll('App is closing');
            await cleanupTempFiles();
            return;
        }

        event.preventDefault();
        (app as { isQuitting?: boolean }).isQuitting = true;
        conversionManager.abortAll('App is closing');
        await cleanupTempFiles();
        app.exit(0);
    });

    app.on('activate', async () => {
        if (!mainWindow || mainWindow.isDestroyed()) {
            mainWindow = await createMainWindow();
        } else {
            focusWindow(mainWindow);
        }

        if (pendingOpenWithPaths.length > 0 && mainWindow) {
            void logDebug('Processing pending open-with files after activate', { count: pendingOpenWithPaths.length });
            const paths = pendingOpenWithPaths;
            pendingOpenWithPaths = [];
            handleOpenWithFiles(paths);
        }
    });

    if (pendingOpenWithPaths.length > 0) {
        void logDebug('Processing pending open-with files after startup', { count: pendingOpenWithPaths.length });
        const paths = pendingOpenWithPaths;
        pendingOpenWithPaths = [];
        handleOpenWithFiles(paths);
    }

    if (ENVIRONMENT.IS_DEV) {
        await loadReactDevtools();
        /* This trick is necessary to get the new
      React Developer Tools working at app initial load.
      Otherwise, it only works on manual reload.
    */
        window.webContents.once('devtools-opened', async () => {
            await waitFor(1000);
            window.webContents.reload();
        });
    }
});
