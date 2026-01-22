import { app } from 'electron';
import { appendFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';

// const DEBUG_ENV_KEYS = ['MOONVERT_DEBUG', 'CONVERTOR_DEBUG'];

export function isDebugEnabled(): boolean {
    // return DEBUG_ENV_KEYS.some((key) => {
    //     const value = process.env[key];
    //     if (!value) return false;
    //     return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
    // });
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
