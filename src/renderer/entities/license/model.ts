import { createEffect, createEvent, createStore, sample } from 'effector';
import type { ActivateLicenseResult, CanConvertResult, LicenseState } from 'shared/types/license.types';

const initializeLicense = createEvent<boolean>();
const openLicenseDialog = createEvent();
const closeLicenseDialog = createEvent();
const setLicenseDialogOpen = createEvent<boolean>();
const licenseStateChanged = createEvent<LicenseState>();

const $licenseState = createStore<LicenseState | null>(null);
const $licenseDialogOpen = createStore(false);

const fetchLicenseStateFx = createEffect(async (): Promise<LicenseState> => {
    return window.App.license.getState();
});

const activateLicenseFx = createEffect(async (licenseKey: string): Promise<ActivateLicenseResult> => {
    return window.App.license.activate(licenseKey);
});

const checkCanConvertFx = createEffect(async (): Promise<CanConvertResult> => {
    return window.App.license.canConvert();
});

sample({
    clock: initializeLicense,
    target: fetchLicenseStateFx,
});

sample({
    clock: fetchLicenseStateFx.doneData,
    target: $licenseState,
});

sample({
    clock: openLicenseDialog,
    fn: () => true,
    target: $licenseDialogOpen,
});

sample({
    clock: closeLicenseDialog,
    fn: () => false,
    target: $licenseDialogOpen,
});

sample({
    clock: setLicenseDialogOpen,
    target: $licenseDialogOpen,
});
sample({
    clock: activateLicenseFx.doneData,
    filter: (result) => result.success,
    target: fetchLicenseStateFx,
});

sample({
    clock: licenseStateChanged,
    target: $licenseState,
});

window.App.license.onStateChanged((state) => {
    licenseStateChanged(state);
});

export const $$license = {
    $licenseState,
    $licenseDialogOpen,

    initializeLicense,
    openLicenseDialog,
    closeLicenseDialog,
    setLicenseDialogOpen,

    fetchLicenseStateFx,
    activateLicenseFx,
    checkCanConvertFx,
};
