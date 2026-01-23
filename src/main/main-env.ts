import { makeEnv } from 'shared/utils';
import z from 'zod';

export const MainEnv = makeEnv({
    schema: {
        MOONVERT_UPDATE_SECRET: z.string().optional(),
        MOONVERT_UPDATE_URL: z.url().optional(),
        MOONVERT_AUTH_HEADER: z.string().optional(),
    },
    values: {
        MOONVERT_UPDATE_SECRET: import.meta.env.VITE_MAIN_MOONVERT_UPDATE_SECRET,
        MOONVERT_UPDATE_URL: import.meta.env.VITE_MAIN_MOONVERT_UPDATE_URL,
        MOONVERT_AUTH_HEADER: import.meta.env.VITE_MAIN_MOONVERT_AUTH_HEADER,
    },
});
