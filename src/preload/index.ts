import { contextBridge } from 'electron';
import { conversionAPI } from './conversion';
import type { ConversionAPI } from './conversion';
import { fileAPI } from './file';
import type { FileAPI } from './file';
import { themeAPI } from './theme';
import { windowAPI } from './window';

declare global {
    interface Window {
        App: typeof API;
    }
}

const API = {
    username: process.env.USER,
    conversion: conversionAPI,
    file: fileAPI,
    theme: themeAPI,
    window: windowAPI,
};

contextBridge.exposeInMainWorld('App', API);

export type ThemeAPI = typeof themeAPI;
export type WindowAPI = typeof windowAPI;
export type { ConversionAPI, FileAPI };
