import { ipcRenderer } from 'electron';
import { IPCChannels, IPCEvents, type IPCEventData, type IPCRequest, type IPCResponse } from 'shared/ipc/ipc-config';

export const fileAPI = {
    selectFiles: (): Promise<IPCResponse<'file:select-files'>> => {
        return ipcRenderer.invoke(IPCChannels.files.selectFiles);
    },

    saveDroppedFile: (fileName: string, fileData: ArrayBuffer): Promise<IPCResponse<'file:save-dropped-file'>> => {
        const request: IPCRequest<'file:save-dropped-file'> = {
            fileName,
            fileData,
        };
        return ipcRenderer.invoke(IPCChannels.files.saveDroppedFile, request);
    },

    saveFileAs: (fileId: string, data: Buffer, suggestedFileName: string): Promise<IPCResponse<'file:save-as'>> => {
        const request: IPCRequest<'file:save-as'> = {
            fileId,
            data,
            suggestedFileName,
        };
        return ipcRenderer.invoke(IPCChannels.files.saveAs, request);
    },

    saveAllToFolder: (
        files: Array<{
            fileId: string;
            data: Buffer;
            suggestedFileName: string;
        }>,
    ): Promise<IPCResponse<'file:save-all-to-folder'>> => {
        const request: IPCRequest<'file:save-all-to-folder'> = { files };
        return ipcRenderer.invoke(IPCChannels.files.saveAllToFolder, request);
    },

    copyToClipboard: (
        files: Array<{
            fileId: string;
            data: Buffer;
            suggestedFileName: string;
        }>,
    ): Promise<IPCResponse<'file:copy-to-clipboard'>> => {
        const request: IPCRequest<'file:copy-to-clipboard'> = { files };
        return ipcRenderer.invoke(IPCChannels.files.copyToClipboard, request);
    },

    onFileOpenedWith: (callback: (data: IPCEventData<'file:opened-with'>) => void) => {
        const listener = (_: unknown, data: IPCEventData<'file:opened-with'>) => callback(data);
        ipcRenderer.on(IPCEvents.files.openedWith, listener);

        return () => {
            ipcRenderer.removeListener(IPCEvents.files.openedWith, listener);
        };
    },
};

export type FileAPI = typeof fileAPI;
