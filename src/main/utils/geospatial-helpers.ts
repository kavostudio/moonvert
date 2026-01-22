import { promises as fs } from 'fs';

export async function checkShapefileDependencies(filePath: string): Promise<string[]> {
    const basePath = filePath.replace(/\.shp$/i, '');
    const requiredFiles = ['.shx', '.dbf'];
    const missing: string[] = [];

    for (const ext of requiredFiles) {
        try {
            await fs.access(basePath + ext);
        } catch {
            try {
                await fs.access(basePath + ext.toUpperCase());
            } catch {
                missing.push(ext);
            }
        }
    }

    return missing;
}
