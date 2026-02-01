import { makeEnv } from 'shared/utils';
import z from 'zod';

export const MainEnv = makeEnv({
    schema: {
        MOONVERT_UPDATE_SECRET: z.string().optional(),
        MOONVERT_UPDATE_URL: z.url().optional(),
        MOONVERT_AUTH_HEADER: z.string().optional(),
        IS_OFFICIAL_BUILD: z.union([z.literal('true'), z.literal('false')]),
        API_URL: z.url(),
        JWT_PUBLIC_KEY: z.string(),
    },
    values: {
        MOONVERT_UPDATE_SECRET: import.meta.env.VITE_MAIN_MOONVERT_UPDATE_SECRET,
        MOONVERT_UPDATE_URL: import.meta.env.VITE_MAIN_MOONVERT_UPDATE_URL,
        MOONVERT_AUTH_HEADER: import.meta.env.VITE_MAIN_MOONVERT_AUTH_HEADER,
        IS_OFFICIAL_BUILD: import.meta.env.VITE_IS_OFFICIAL_BUILD,
        API_URL: import.meta.env.VITE_MAIN_API_URL,
        JWT_PUBLIC_KEY: import.meta.env.VITE_JWT_PUBLIC_KEY,
    },
});
