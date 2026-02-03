import { app, type BrowserWindow, Menu, shell } from 'electron';
import type electronUpdater from 'electron-updater';
import { config } from 'shared/config/app-config';
import { IPCEvents } from 'shared/ipc/ipc-config';

export function setupApplicationMenu(autoUpdater?: electronUpdater.AppUpdater, getMainWindow?: () => BrowserWindow | null) {
    app.setName('Moonvert');

    app.setAboutPanelOptions({
        applicationName: 'Moonvert',
        applicationVersion: config.version.number,
        version: config.version.codename,
        copyright: '© Kavo Studio',
        website: config.links.website,
        credits: 'The local file converter.',
    });

    const template: Electron.MenuItemConstructorOptions[] = [
        {
            label: app.name,
            submenu: [
                { role: 'about' },
                { type: 'separator' },
                {
                    label: 'Settings...',
                    accelerator: 'CmdOrCtrl+,',
                    click: () => {
                        const mainWindow = getMainWindow?.();
                        if (mainWindow) {
                            mainWindow.webContents.send(IPCEvents.settings.openRequested);
                        }
                    },
                },
                { type: 'separator' },
                ...(autoUpdater
                    ? [
                          {
                              label: 'Check for Updates...',
                              click: () => autoUpdater.checkForUpdates(),
                          } as Electron.MenuItemConstructorOptions,
                          { type: 'separator' } as Electron.MenuItemConstructorOptions,
                      ]
                    : []),
                { role: 'hide' as const },
                { role: 'hideOthers' as const },
                { role: 'unhide' as const },
                { type: 'separator' },
                { role: 'quit' as const },
            ],
        },
        { role: 'editMenu' },
        { role: 'windowMenu' },
        {
            label: 'Help',
            submenu: [
                {
                    label: 'Moonvert Website',
                    click: () => shell.openExternal(config.links.website),
                },
                {
                    label: 'Contact Support',
                    click: () => shell.openExternal(config.links.contact),
                },
                { type: 'separator' },
                {
                    label: 'GitHub Repository',
                    click: () => shell.openExternal(config.links.github.repository),
                },
            ],
        },
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}
