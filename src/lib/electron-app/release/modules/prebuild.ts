/** biome-ignore-all lint/correctness/noUnusedVariables: <> */
import { resolve, basename } from 'node:path';
import { writeFile } from 'node:fs/promises';

import trustedDependencies from '../../../../../trusted-dependencies-scripts.json';
import packageJSON from '../../../../../package.json';
import { getDevFolder } from '../utils/path';

async function createPackageJSONDistVersion() {
    const { main, scripts, resources, devDependencies, ...rest } = packageJSON;

    const packageJSONDistVersion = {
        main: `./main/${basename(main || 'index.mjs')}`,
        ...rest,
    };

    try {
        await Promise.all([
            writeFile(resolve(getDevFolder(main), 'package.json'), JSON.stringify(packageJSONDistVersion, null, 2)),

            writeFile(resolve(getDevFolder(main), packageJSON.pnpm.onlyBuiltDependenciesFile), JSON.stringify(trustedDependencies, null, 2)),
        ]);
    } catch ({ message }: any) {
        console.log(`
    🛑 Something went wrong!\n
      🧐 There was a problem creating the package.json dist version...\n
      👀 Error: ${message}
    `);
    }
}

createPackageJSONDistVersion();
