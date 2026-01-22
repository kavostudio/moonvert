/// <reference types="vite/client" />

import type { ConversionAPI } from './src/preload/conversion';
import type { FileAPI } from './src/preload/file';

declare global {
    interface Window {
        App: {
            username: string | undefined;
            conversion: ConversionAPI;
            file: FileAPI;
        };
    }
}
