import { ipcRenderer } from 'electron';
import { IPCChannels, IPCEvents, type IPCEventData, type IPCRequest, type IPCResponse } from 'shared/ipc/ipc-config';

export const conversionAPI = {
    convertBatch: (request: IPCRequest<'conversion:convert-batch'>): Promise<IPCResponse<'conversion:convert-batch'>> => {
        return ipcRenderer.invoke(IPCChannels.conversion.convertBatch, request);
    },

    cancelAllConversions: (): Promise<IPCResponse<'conversion:cancel-all'>> => {
        return ipcRenderer.invoke(IPCChannels.conversion.cancelAll);
    },

    onBatchProgress: (callback: (progress: IPCEventData<'conversion:batch-progress'>) => void) => {
        const listener = (_: unknown, progress: IPCEventData<'conversion:batch-progress'>) => callback(progress);
        ipcRenderer.on(IPCEvents.conversion.batchProgress, listener);

        return () => {
            ipcRenderer.removeListener(IPCEvents.conversion.batchProgress, listener);
        };
    },
};

export type ConversionAPI = typeof conversionAPI;
