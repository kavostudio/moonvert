import { ipcRenderer } from 'electron';
import { IPCChannels, IPCEvents } from 'shared/ipc/ipc-config';

export const windowAPI = {
    setSize: (width?: number, height?: number) => ipcRenderer.invoke(IPCChannels.window.setSize, { width, height }),
    getSize: (): Promise<{ width: number; height: number }> => ipcRenderer.invoke(IPCChannels.window.getSize),
    openDebugLog: () => ipcRenderer.invoke(IPCChannels.window.openDebugLog),
    onOpenSettings: (callback: () => void) => {
        const listener = () => callback();
        ipcRenderer.on(IPCEvents.settings.openRequested, listener);
        return () => {
            ipcRenderer.removeListener(IPCEvents.settings.openRequested, listener);
        };
    },
};
