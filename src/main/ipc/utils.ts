import { app } from 'electron';
import { mkdir, copyFile, readdir, stat } from 'fs/promises';
import { logDebug } from 'main/utils/debug-logger';
import { join, dirname, basename, extname } from 'path';
import { config } from 'shared/config/app-config';
import { AllowedConversionOptions } from 'shared/config/converter-config';
import type { SelectedFile } from 'shared/ipc/ipc-config';

export type ShapefileBundleResult = {
    path: string;
    name: string;
    size: number;
    isBundle: true;
    bundleFiles: string[];
};

export type SingleFileResult = {
    path: string;
    name: string;
    size: number;
    isBundle?: false;
};

export type FileResult = ShapefileBundleResult | SingleFileResult;

export type ProcessOpenWithResult = {
    files: SelectedFile[];
    rejected: string[];
};

/**
 * Process a shapefile and its companion files (.shx, .dbf, .prj, etc.)
 * Copies all related files to a temp directory and returns bundle information
 */
export async function processShapefileBundle(filePath: string, fileName: string, fileSize: number): Promise<FileResult> {
    const dir = dirname(filePath);
    const baseName = fileName.replace(/\.shp$/i, '');

    try {
        const dirContents = await readdir(dir);
        const shapefileExtensions = ['.shp', '.shx', '.dbf', '.prj', '.cpg', '.sbn', '.sbx'];

        const companions = dirContents.filter((file) => {
            const fileBase = file.replace(/\.[^.]+$/, '');
            const fileExt = file.match(/\.[^.]+$/)?.[0]?.toLowerCase();
            return fileBase === baseName && fileExt && shapefileExtensions.includes(fileExt);
        });

        const hasShx = companions.some((f) => /\.shx$/i.test(f));
        const hasDbf = companions.some((f) => /\.dbf$/i.test(f));

        if (!hasShx || !hasDbf) {
            const missing = [];
            if (!hasShx) missing.push('.shx');
            if (!hasDbf) missing.push('.dbf');

            void logDebug('Shapefile bundle missing required companions', {
                fileName,
                missingCompanions: missing,
            });
            // Return the file anyway but without bundle info
            return {
                path: filePath,
                name: fileName,
                size: fileSize,
            };
        }

        // Copy all companions to temp directory
        const tempDir = join(app.getPath('temp'), config.tempFolders.fileDropsTempFolder);
        const safeBaseName = baseName.replace(/[^a-zA-Z0-9.-]/g, '_');
        const shapefileDir = join(tempDir, safeBaseName);
        await mkdir(shapefileDir, { recursive: true });

        let totalSize = 0;
        const bundleExtensions: string[] = [];

        for (const companion of companions) {
            const sourcePath = join(dir, companion);
            const ext = companion.match(/\.[^.]+$/)?.[0]?.toLowerCase() || '';
            const destPath = join(shapefileDir, `${safeBaseName}${ext}`);

            await copyFile(sourcePath, destPath);
            const companionStats = await stat(destPath);
            totalSize += companionStats.size;
            bundleExtensions.push(ext);
        }

        return {
            path: join(shapefileDir, `${safeBaseName}.shp`),
            name: fileName,
            size: totalSize,
            isBundle: true,
            bundleFiles: bundleExtensions,
        };
    } catch (error) {
        void logDebug('Error processing shapefile companions', { fileName, error });
        return {
            path: filePath,
            name: fileName,
            size: fileSize,
        };
    }
}

export function getFileExtension(filePath: string): string | null {
    const ext = extname(filePath).toLowerCase();
    if (!ext) return null;
    return ext.startsWith('.') ? ext.slice(1) : ext;
}

export async function processOpenWithFiles(filePaths: string[]): Promise<ProcessOpenWithResult> {
    const supportedExtensions = new Set(Object.keys(AllowedConversionOptions));
    const files: SelectedFile[] = [];
    const rejected: string[] = [];

    for (const filePath of filePaths) {
        try {
            const stats = await stat(filePath);
            if (!stats.isFile()) {
                rejected.push(filePath);
                continue;
            }

            const ext = getFileExtension(filePath);

            if (!ext || !supportedExtensions.has(ext)) {
                rejected.push(filePath);
                continue;
            }

            const fileName = basename(filePath);

            if (ext === 'shp') {
                const shapefileResult = await processShapefileBundle(filePath, fileName, stats.size);
                files.push(shapefileResult);
                continue;
            }

            files.push({
                path: filePath,
                name: fileName,
                size: stats.size,
            });
        } catch (error) {
            void logDebug('Failed to process opened file:', { filePath, error });
            rejected.push(filePath);
        }
    }

    return { files, rejected };
}
