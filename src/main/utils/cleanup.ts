import { app } from 'electron';
import { rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { config } from 'shared/config/app-config';
import { logDebug } from './debug-logger';

/**
 * Clean up all temporary files created during the app session
 */
export async function cleanupTempFiles(): Promise<void> {
    try {
        const tempDir = app.getPath('temp');

        const tempPaths = [
            join(tempDir, config.tempFolders.fileDropsTempFolder),
            join(tempDir, config.tempFolders.tempFolder),
            join(tempDir, config.tempFolders.clipboardTempFolder),
        ];

        await Promise.allSettled(
            tempPaths.map((path) =>
                rm(path, { recursive: true, force: true }).catch((err) => {
                    // Ignore errors if directory doesn't exist
                    if (err.code !== 'ENOENT') {
                        void logDebug('Failed to clean up temporary files', { path, error: err });
                    }
                }),
            ),
        );

        void logDebug('Temporary files cleaned up');
    } catch (error) {
        void logDebug('Error during cleanup', { error });
    }
}
