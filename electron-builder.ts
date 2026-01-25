/** biome-ignore-all lint/suspicious/noTemplateCurlyInString: <> */
import type { Configuration } from 'electron-builder';

import { author as _author, displayName, main, name, resources, version } from './package.json';

import { getDevFolder } from './src/lib/electron-app/release/utils/path';
import { DOCUMENT_FORMATS, EBOOK_FORMATS, GEO_FORMATS, IMAGE_FORMATS, VIDEO_FORMATS } from './src/shared/config/converter-config';
import 'dotenv/config';

const authorSlug = _author.slug;
const currentYear = new Date().getFullYear();
const appId = `dev.${authorSlug}.${name}`.toLowerCase();

const buildType: 'light' | 'standard' = process.env.BUILD_TYPE === 'standard' ? 'standard' : 'light';

const s3Bucket = process.env.S3_BUCKET;
const s3Endpoint = process.env.S3_ENDPOINT;

console.log(`Building ${buildType} build`);

export default {
    appId,
    productName: displayName,
    copyright: `Copyright © ${currentYear} — ${_author.name}`,

    publish: [
        {
            provider: 's3',
            bucket: s3Bucket!,
            region: 'auto',
            endpoint: s3Endpoint,
            acl: 'private',
        },
    ],

    directories: {
        app: getDevFolder(main),
        output: `dist/v${version}`,
    },

    compression: 'maximum',
    concurrency: {
        jobs: 3,
    },

    dmg: {
        sign: true,
        icon: `${resources}/build/icons/icon.icns`,
        iconSize: 80,
        format: 'UDBZ',
        contents: [
            {
                x: 130,
                y: 220,
                type: 'file',
            },
            {
                x: 410,
                y: 220,
                type: 'link',
                path: '/Applications',
            },
        ],
        window: {
            width: 540,
            height: 380,
        },
    },

    mac: {
        artifactName: `${name}-v\${version}-\${os}-\${arch}.\${ext}`,
        icon: `${resources}/build/icons/icon.icns`,
        category: 'public.app-category.utilities',
        hardenedRuntime: true,
        gatekeeperAssess: false,
        entitlements: `${resources}/build/entitlements.mac.plist`,
        entitlementsInherit: `${resources}/build/entitlements.mac.inherit.plist`,
        notarize: true,
        fileAssociations: [
            {
                ext: [...IMAGE_FORMATS],
                name: 'Image Files',
                role: 'Editor',
                icon: `${resources}/build/icons/icon.icns`,
            },
            {
                ext: [...GEO_FORMATS],
                name: 'Geospatial Files',
                role: 'Editor',
                icon: `${resources}/build/icons/icon.icns`,
            },
            {
                ext: [...DOCUMENT_FORMATS],
                name: 'Document Files',
                role: 'Editor',
                icon: `${resources}/build/icons/icon.icns`,
            },
            {
                ext: [...EBOOK_FORMATS],
                name: 'Ebook Files',
                role: 'Editor',
                icon: `${resources}/build/icons/icon.icns`,
            },
            {
                ext: [...VIDEO_FORMATS],
                name: 'Video Files',
                role: 'Editor',
                icon: `${resources}/build/icons/icon.icns`,
            },
        ],
        target:
            buildType === 'light'
                ? [{ target: 'zip', arch: ['arm64'] }]
                : [
                      { target: 'dmg', arch: ['arm64'] },
                      { target: 'zip', arch: ['arm64'] },
                      { target: 'dir', arch: ['arm64'] },
                  ],
        compression: 'maximum',
        asarUnpack: ['**/*.node'],
        asar: true,
        extraResources:
            buildType === 'light'
                ? [
                      //   {
                      //       from: 'dist/ffmpeg/darwin-${arch}',
                      //       to: 'ffmpeg',
                      //       filter: ['**/*'],
                      //   },
                  ]
                : [
                      {
                          from: 'dist/ffmpeg/darwin-${arch}',
                          to: 'ffmpeg',
                          filter: ['**/*'],
                      },
                      {
                          from: 'dist/pandoc/darwin-${arch}',
                          to: 'pandoc',
                          filter: ['**/*'],
                      },
                      {
                          from: 'dist/python/darwin',
                          to: 'python',
                          filter: ['**/*'],
                      },
                  ],
    },
} satisfies Configuration;
