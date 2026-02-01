import { ipcMain } from 'electron';
import { IPCChannels } from 'shared/ipc/ipc-config';
import type { IPCRequest } from 'shared/ipc/ipc-config';
import { licenseService } from '../services/license-service';

export function registerLicenseHandlers(): void {
    void licenseService.initialize();

    ipcMain.handle(IPCChannels.license.getState, async () => {
        return licenseService.getLicenseState();
    });

    ipcMain.handle(IPCChannels.license.activate, async (_, request: IPCRequest<'license:activate'>) => {
        return licenseService.activateLicense(request.licenseKey);
    });

    ipcMain.handle(IPCChannels.license.canConvert, async () => {
        return licenseService.canConvert();
    });
}
