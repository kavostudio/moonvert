import packageJson from '~/package.json';

const appVersion = packageJson.version;
const appCodename = packageJson.versionCodename;
const utmContent = `Callisto-${appVersion}`;

export const config = {
    tempFolders: {
        tempFolder: 'moonvert-temp',
        fileDropsTempFolder: 'moonvert-drops',
        clipboardTempFolder: 'moonvert-clipboard',
    },

    version: {
        codename: appCodename,
        number: appVersion,
    },

    links: {
        github: {
            issues: '',
            releases: '',
            repository: '',
        },
        website: `https://moonvert.app/?utm_source=app&utm_medium=desktop&utm_campaign=moonvert&utm_content=${utmContent}`,
        donate: `https://moonvert.app/donate?utm_source=app&utm_medium=desktop&utm_campaign=moonvert&utm_content=${utmContent}`,
        contact: `https://moonvert.app/contact?utm_source=app&utm_medium=desktop&utm_campaign=moonvert&utm_content=${utmContent}`,
    },
};
