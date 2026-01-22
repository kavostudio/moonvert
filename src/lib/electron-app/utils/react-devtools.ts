import { resolve } from 'node:path';
import { session } from 'electron';

export async function loadReactDevtools() {
    const reactDevToolsPath = resolve('src', 'lib', 'electron-app', 'extensions', 'react-developer-tools');

    try {
        await session.defaultSession.extensions.loadExtension(reactDevToolsPath, {
            allowFileAccess: true,
        });

        console.log('\nReact Developer Tools loaded!\n');
    } catch (err) {
        console.error('Error loading React Developer Tools:', err);
    }
}
