import { ipcRenderer } from 'electron';
import { IPCChannels, IPCEvents, type IPCEventData, type IPCRequest, type IPCResponse } from 'shared/ipc/ipc-config';

export const licenseAPI = {
    getState: (): Promise<IPCResponse<'license:get-state'>> => {
        return ipcRenderer.invoke(IPCChannels.license.getState);
    },

    activate: (licenseKey: string): Promise<IPCResponse<'license:activate'>> => {
        const request: IPCRequest<'license:activate'> = { licenseKey };
        return ipcRenderer.invoke(IPCChannels.license.activate, request);
    },

    canConvert: (): Promise<IPCResponse<'license:can-convert'>> => {
        return ipcRenderer.invoke(IPCChannels.license.canConvert);
    },

    onStateChanged: (callback: (state: IPCEventData<'license:state-changed'>) => void) => {
        const listener = (_event: Electron.IpcRendererEvent, state: IPCEventData<'license:state-changed'>) => {
            callback(state);
        };
        ipcRenderer.on(IPCEvents.license.stateChanged, listener);
        return () => {
            ipcRenderer.removeListener(IPCEvents.license.stateChanged, listener);
        };
    },
};

export type LicenseAPI = typeof licenseAPI;
