import { randomBytes } from 'crypto';
import { BrowserWindow, app, clipboard, dialog, ipcMain, shell } from 'electron';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { config } from 'shared/config/app-config';
import {
    AllowedConversionOptions,
    AudioConversionOptions,
    DocumentConversionOptions,
    EbookConversionOptions,
    GeoConversionOptions,
    ImageConversionOptions,
    VideoConversionOptions,
} from 'shared/config/converter-config';
import { IPCChannels, type IPCRequest, type IPCResponse } from 'shared/ipc/ipc-config';
import { processShapefileBundle } from './utils';
import { logDebug } from 'main/utils/debug-logger';

export function registerFileHandlers(): void {
    ipcMain.handle(IPCChannels.files.selectFiles, async (event): Promise<IPCResponse<'file:select-files'>> => {
        // Get the window that made the request
        const window = BrowserWindow.fromWebContents(event.sender);

        const result = await dialog.showOpenDialog(window!, {
            properties: ['openFile', 'multiSelections'],
            filters: [
                {
                    name: 'All Supported Files',
                    extensions: Object.keys(AllowedConversionOptions),
                },
                {
                    name: 'Geo Files',
                    extensions: Object.keys(GeoConversionOptions),
                },
                {
                    name: 'Image Files',
                    extensions: Object.keys(ImageConversionOptions),
                },
                {
                    name: 'Documents and Ebooks',
                    extensions: [...Object.keys(DocumentConversionOptions), ...Object.keys(EbookConversionOptions)],
                },
                {
                    name: 'Videos',
                    extensions: Object.keys(VideoConversionOptions),
                },
                {
                    name: 'Audio Files',
                    extensions: Object.keys(AudioConversionOptions),
                },
            ],
        });

        if (result.canceled || result.filePaths.length === 0) {
            return { canceled: true, files: [] };
        }

        const fs = await import('fs/promises');
        const path = await import('path');

        const files = await Promise.all(
            result.filePaths.map(async (filePath) => {
                const stats = await fs.stat(filePath);
                const fileName = path.basename(filePath);

                // Check if this is a shapefile - auto-discover companions
                if (filePath.toLowerCase().endsWith('.shp')) {
                    return await processShapefileBundle(filePath, fileName, stats.size);
                }

                return {
                    path: filePath,
                    name: fileName,
                    size: stats.size,
                };
            }),
        );

        return { canceled: false, files };
    });

    ipcMain.handle(
        IPCChannels.files.saveDroppedFile,
        async (event, { fileName, fileData }: IPCRequest<'file:save-dropped-file'>): Promise<IPCResponse<'file:save-dropped-file'>> => {
            try {
                const tempDir = join(app.getPath('temp'), config.tempFolders.fileDropsTempFolder);
                await mkdir(tempDir, { recursive: true });

                const isShapefileRelated = /\.(shp|shx|dbf|prj|cpg|sbn|sbx)$/i.test(fileName);

                let filePath: string;
                if (isShapefileRelated) {
                    const extMatch = fileName.match(/\.([^.]+)$/);
                    const ext = extMatch ? extMatch[1].toLowerCase() : '';
                    const baseName = fileName.replace(/\.[^.]+$/, '');

                    const safeBaseName = baseName.replace(/[^a-zA-Z0-9.-]/g, '_');
                    const shapefileDir = join(tempDir, safeBaseName);
                    await mkdir(shapefileDir, { recursive: true });

                    filePath = join(shapefileDir, `${safeBaseName}.${ext}`);
                } else {
                    const uniqueId = randomBytes(8).toString('hex');
                    const safeFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
                    filePath = join(tempDir, `${uniqueId}-${safeFileName}`);
                }

                const buffer = Buffer.from(fileData);
                await writeFile(filePath, buffer);

                const fs = await import('fs/promises');
                const stats = await fs.stat(filePath);

                return {
                    success: true,
                    file: {
                        path: filePath,
                        name: fileName,
                        size: stats.size,
                    },
                };
            } catch (error) {
                void logDebug('Failed to save dropped file', { fileName, error });
                return {
                    success: false,
                    error: error instanceof Error ? error.message : 'Unknown error',
                };
            }
        },
    );

    ipcMain.handle(IPCChannels.files.saveAllToFolder, async (event, { files }: IPCRequest<'file:save-all-to-folder'>): Promise<IPCResponse<'file:save-all-to-folder'>> => {
        try {
            const window = BrowserWindow.fromWebContents(event.sender);

            const result = await dialog.showOpenDialog(window!, {
                properties: ['openDirectory', 'createDirectory'],
                title: 'Select destination folder',
            });

            if (result.canceled || result.filePaths.length === 0) {
            }

            const destFolder = result.filePaths[0];
            const savedPaths: Record<string, string> = {};
            const { existsSync } = await import('fs');
            const { basename, extname, join: joinPath } = await import('path');

            for (const file of files) {
                let finalPath = joinPath(destFolder, file.suggestedFileName);

                if (existsSync(finalPath)) {
                    const ext = extname(file.suggestedFileName);
                    const nameWithoutExt = basename(file.suggestedFileName, ext);
                    let counter = 1;

                    while (existsSync(finalPath)) {
                        finalPath = joinPath(destFolder, `${nameWithoutExt}(${counter})${ext}`);
                        counter++;
                    }
                }

                await writeFile(finalPath, file.data);
                savedPaths[file.fileId] = finalPath;
            }

            shell.openPath(destFolder);

            return {
                success: true,
                savedPaths,
            };
        } catch (error) {
            void logDebug('Failed to save files to folder', { error });
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    });

    ipcMain.handle(IPCChannels.files.copyToClipboard, async (event, { files }: IPCRequest<'file:copy-to-clipboard'>): Promise<IPCResponse<'file:copy-to-clipboard'>> => {
        try {
            const tempDir = join(app.getPath('temp'), config.tempFolders.clipboardTempFolder);
            await mkdir(tempDir, { recursive: true });

            const filePaths: string[] = [];
            const { existsSync } = await import('fs');
            const { basename, extname, join: joinPath } = await import('path');

            // Write each file to temp directory
            for (const file of files) {
                let finalPath = joinPath(tempDir, file.suggestedFileName);

                // Handle duplicate filenames
                if (existsSync(finalPath)) {
                    const ext = extname(file.suggestedFileName);
                    const nameWithoutExt = basename(file.suggestedFileName, ext);
                    let counter = 1;

                    while (existsSync(finalPath)) {
                        finalPath = joinPath(tempDir, `${nameWithoutExt}(${counter})${ext}`);
                        counter++;
                    }
                }

                await writeFile(finalPath, file.data);
                filePaths.push(finalPath);
            }

            // On macOS, we need to use NSFilenamesPboardType with proper plist format
            if (process.platform === 'darwin') {
                const plist = require('plist');
                const fileList = filePaths;
                const plistData = plist.build(fileList);
                clipboard.writeBuffer('NSFilenamesPboardType', Buffer.from(plistData));
            } else {
                throw new Error('Copying files to clipboard is only implemented for macOS at this time.');
            }

            return {
                success: true,
                copiedCount: filePaths.length,
            };
        } catch (error) {
            void logDebug('Failed to copy files to clipboard', { error });
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    });
}

export function unregisterFileHandlers(): void {
    ipcMain.removeHandler(IPCChannels.files.selectFiles);
    ipcMain.removeHandler(IPCChannels.files.saveDroppedFile);
    ipcMain.removeHandler(IPCChannels.files.saveAllToFolder);
    ipcMain.removeHandler(IPCChannels.files.copyToClipboard);
}
