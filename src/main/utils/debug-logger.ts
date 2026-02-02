import { app } from 'electron';
import { appendFile, mkdir, open, stat, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

const MAX_LOG_SIZE_BYTES = 10 * 1024 * 1024;
const TRUNCATE_TO_BYTES = 9 * 1024 * 1024;

export function isDebugEnabled(): boolean {
    return true;
}

export function getDebugLogPath(): string | null {
    if (!isDebugEnabled()) return null;
    if (!app.isReady()) return null;

    return join(app.getPath('userData'), 'logs', 'debug.log');
}

async function writeLogLine(line: string): Promise<void> {
    const logPath = getDebugLogPath();
    if (!logPath) return;

    await mkdir(dirname(logPath), { recursive: true });
    await appendFile(logPath, `${line}\n`);
}

export async function logDebug(message: string, meta?: Record<string, unknown>): Promise<void> {
    if (!isDebugEnabled()) return;

    console.log(`[DEBUG] ${message}`, meta || '');

    const timestamp = new Date().toISOString();
    const metaSuffix = meta ? ` ${JSON.stringify(meta)}` : '';
    await writeLogLine(`[${timestamp}] ${message}${metaSuffix}`);
}

export async function cleanupDebugLog(): Promise<void> {
    const logPath = getDebugLogPath();
    if (!logPath) return;

    try {
        const stats = await stat(logPath);
        if (stats.size <= MAX_LOG_SIZE_BYTES) return;

        const fileHandle = await open(logPath, 'r');
        try {
            const readPosition = stats.size - TRUNCATE_TO_BYTES;
            const buffer = Buffer.alloc(TRUNCATE_TO_BYTES);
            await fileHandle.read(buffer, 0, TRUNCATE_TO_BYTES, readPosition);

            const firstNewline = buffer.indexOf('\n');
            const cleanContent = firstNewline >= 0 ? buffer.subarray(firstNewline + 1) : buffer;

            await writeFile(logPath, cleanContent);
            console.log(`[DEBUG] Log file cleaned up: ${stats.size} bytes -> ${cleanContent.length} bytes`);
        } finally {
            await fileHandle.close();
        }
    } catch (error) {
        void logDebug('Failed to cleanup log file', { error });
    }
}
