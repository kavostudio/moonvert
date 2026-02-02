import { BrowserWindow } from 'electron';
import Store from 'electron-store';
import jwt from 'jsonwebtoken';
import { hostname } from 'node:os';
import { MainEnv } from 'main/main-env';
import { getJwtPublicKey } from 'main/utils/jwt';
import { IPCEvents } from 'shared/ipc/ipc-config';
import {
    type LicenseStatus,
    TRIAL_CONVERSION_LIMIT,
    ValidateLicenseResultZod,
    type ActivateLicenseResult,
    type CanConvertResult,
    type LicenseState,
    type LicenseToken,
    type ValidateLicenseResult,
    ActivateLicenseResponseZod,
} from 'shared/types/license.types';

const REVALIDATION_INTERVAL_MS = 0 * 24 * 60 * 60 * 1000; // 1 day

type LicenseStoreSchema = {
    conversionCount: number;
    license: {
        status: LicenseStatus;
    } & (
        | {
              status: 'active';
              key: string;
              token: string;
              instanceId: string;
              lastValidated: number;
          }
        | { status: 'revoked'; key: string }
        | { status: 'trial' }
    );
};

const encryptionKey = import.meta.env.VITE_STORE_ENCRYPTION_KEY;

const store = new Store<LicenseStoreSchema>({
    name: 'license',
    ...(encryptionKey && { encryptionKey }),
    defaults: {
        conversionCount: 0,
        license: {
            status: 'trial',
        },
    },
});

// store.clear();

class LicenseService {
    async initialize(): Promise<void> {
        await this.canConvert();
    }

    private getDeviceName(): string {
        try {
            return hostname();
        } catch {
            return 'Unknown Device';
        }
    }

    private broadcastLicenseState(): void {
        const state = this.getLicenseState();
        for (const window of BrowserWindow.getAllWindows()) {
            window.webContents.send(IPCEvents.license.stateChanged, state);
        }
    }

    isOfficialBuild(): boolean {
        return MainEnv.IS_OFFICIAL_BUILD === 'true';
    }

    resetForTesting(): void {
        if (process.env.NODE_ENV === 'production') {
            console.warn('resetForTesting is not available in production');
            return;
        }
        store.clear();
        console.log('License state reset for testing');
    }

    getLicenseState(): LicenseState {
        if (!this.isOfficialBuild()) {
            return {
                status: 'active',
                licenseKey: 'CUSTOM_BUILD_LICENSE',
            };
        }

        const license = store.get('license');

        if (license.status === 'revoked') {
            return {
                status: 'revoked',
                licenseKey: '',
            };
        }

        if (license.status === 'active') {
            return {
                status: 'active',
                licenseKey: license.key,
            };
        }

        const conversionCount = store.get('conversionCount');
        const remaining = Math.max(0, TRIAL_CONVERSION_LIMIT - conversionCount);

        return {
            status: 'trial',
            conversionsRemaining: remaining,
        };
    }

    async canConvert(): Promise<CanConvertResult> {
        if (!this.isOfficialBuild()) {
            return { allowed: true };
        }

        console.log('Checking license state for conversion...');

        const license = store.get('license');

        if (license?.status === 'revoked') {
            return { allowed: false, reason: 'License has been revoked' };
        }

        if (license.status === 'active') {
            if (!this.validateTokenLocally(license.token)) {
                store.set('license', {
                    status: 'revoked',
                    key: license.key,
                } satisfies LicenseStoreSchema['license']);

                this.broadcastLicenseState();

                return { allowed: false, reason: 'License token is invalid' };
            }

            if (this.shouldRevalidate()) {
                try {
                    const result = await this.revalidateOnline();

                    if (result.success && (result.status === 'invalid' || result.status === 'revoked')) {
                        this.broadcastLicenseState();
                        store.set('license', {
                            status: 'revoked',
                            key: license.key,
                        } satisfies LicenseStoreSchema['license']);
                        return { allowed: false, reason: 'License has been revoked' };
                    }

                    if (result.success && result.status === 'valid') {
                        store.set('license.lastValidated', Date.now());
                        this.broadcastLicenseState();
                    }
                } catch {
                    // Will retry on next canConvert() call
                }
            }
            return { allowed: true };
        }

        const conversionCount = store.get('conversionCount');

        if (conversionCount < TRIAL_CONVERSION_LIMIT) {
            return { allowed: true };
        }

        return {
            allowed: false,
            reason: `Trial limit reached (${TRIAL_CONVERSION_LIMIT} conversions). Please activate a license.`,
        };
    }

    incrementConversion(): void {
        if (!this.isOfficialBuild()) {
            return;
        }

        const current = store.get('conversionCount');
        store.set('conversionCount', current + 1);
        this.broadcastLicenseState();
    }

    async activateLicense(licenseKey: string): Promise<ActivateLicenseResult> {
        try {
            const response = await fetch(`${MainEnv.API_URL}/activate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    licenseKey,
                    deviceName: this.getDeviceName(),
                }),
            });

            const dataRaw = await response.json();

            const data = ActivateLicenseResponseZod.parse(dataRaw);

            if (!data.success) {
                return {
                    success: false,
                    error: data.message || 'Activation failed',
                };
            }

            try {
                jwt.verify(data.token, getJwtPublicKey(), { algorithms: ['RS256'] });
            } catch {
                return {
                    success: false,
                    error: 'Invalid license token received',
                };
            }

            store.set('license', {
                status: 'active',
                key: licenseKey,
                token: data.token,
                instanceId: data.instanceId,
                lastValidated: Date.now(),
            } satisfies LicenseStoreSchema['license']);

            this.broadcastLicenseState();

            return { success: true };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Network error. Please check your connection.',
            };
        }
    }

    private validateTokenLocally(token: string): boolean {
        try {
            const decoded = jwt.verify(token, getJwtPublicKey(), {
                algorithms: ['RS256'],
            }) as LicenseToken;

            console.log('Decoded license token:', decoded);

            const license = store.get('license');
            if (license.status === 'active' && decoded.instanceId !== license.instanceId) {
                console.warn('License token instance ID does not match stored instance');
                return false;
            }

            return true;
        } catch (error) {
            if (error instanceof jwt.JsonWebTokenError) {
                console.warn('Invalid JWT signature:', error.message);
            } else if (error instanceof jwt.TokenExpiredError) {
                console.warn('JWT token expired');
            } else {
                console.warn('JWT validation error:', error);
            }
            return false;
        }
    }

    private shouldRevalidate(): boolean {
        const license = store.get('license');
        if (!license || license.status !== 'active') {
            return true;
        }
        return Date.now() - license.lastValidated > REVALIDATION_INTERVAL_MS;
    }

    private async revalidateOnline(): Promise<ValidateLicenseResult> {
        const license = store.get('license');
        if (license.status !== 'active') {
            throw new Error('No active license to revalidate');
        }

        const response = await fetch(`${MainEnv.API_URL}/validate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ licenseKey: license.key, instanceId: license.instanceId }),
        });

        if (!response.ok) {
            throw new Error('Validation request failed');
        }

        const data = await response.json();
        return ValidateLicenseResultZod.parse(data);
    }
}

export const licenseService = new LicenseService();
