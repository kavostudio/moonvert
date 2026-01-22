import { createEffect, createEvent, restore, sample } from 'effector';
import { persist } from 'effector-storage/local';

export type Theme = 'light' | 'dark';

const setTheme = createEvent<Theme>();

const $theme = restore(setTheme, 'light');

const setThemeInitialized = createEvent<boolean>();

const $initialized = restore(setThemeInitialized, false);

const initializeTheme = createEffect(async () => {
    const themeInitialized = $initialized.getState();
    if (themeInitialized) return;

    const theme = await window.App.theme.getCurrent();
    setTheme(theme.shouldUseDarkColors ? 'dark' : 'light');
    setThemeInitialized(true);

    window.App.theme.onThemeUpdated((theme) => {
        setTheme(theme.shouldUseDarkColors ? 'dark' : 'light');
    });
});

const applyTheme = createEffect((theme: Theme) => {
    if (theme === 'dark') {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
});

$theme.watch(console.log);

sample({
    clock: $theme,
    target: applyTheme,
});

persist({
    store: $theme,
    key: 'theme',
});

initializeTheme();

export const $$theme = {
    $theme,
    setTheme,
};
