import type { BrowserWindow, IpcMainInvokeEvent } from 'electron';

import type { registerRoute } from 'lib/electron-router-dom';

export type BrowserWindowOrNull = Electron.BrowserWindow | null;

type Route = Parameters<typeof registerRoute>[0];

export type WindowProps = Electron.BrowserWindowConstructorOptions & {
    id: Route['id'];
    query?: Route['query'];
};

export type WindowCreationByIPC = {
    channel: string;
    window(): BrowserWindowOrNull;
    callback(window: BrowserWindow, event: IpcMainInvokeEvent): void;
};
