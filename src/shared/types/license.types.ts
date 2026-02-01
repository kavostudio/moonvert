export const TRIAL_CONVERSION_LIMIT = 1;

export type LicenseStatus = 'trial' | 'active' | 'revoked';

export type LicenseState = {
    status: LicenseStatus;
} & ({ status: 'trial'; conversionsRemaining: number } | { status: 'active'; licenseKey: string } | { status: 'revoked'; licenseKey: string });

export type LicenseToken = {
    instanceId: string;
};

export type ActivateLicenseRequest = {
    licenseKey: string;
};

export const ActivateLicenseResponseZod = z
    .object({
        success: z.literal(true),
        token: z.string(),
        instanceId: z.string(),
    })
    .or(
        z.object({
            success: z.literal(false),
            message: z.string(),
        }),
    );

export type ActivateLicenseResult =
    | {
          success: true;
      }
    | {
          success: false;
          error: string;
      };

import { z } from 'zod';

export const ValidateLicenseResultZod = z
    .object({
        success: z.literal(true),
        status: z.enum(['valid', 'invalid', 'revoked']),
    })
    .or(
        z.object({
            success: z.literal(false),
            message: z.string(),
        }),
    );

export type ValidateLicenseResult = z.infer<typeof ValidateLicenseResultZod>;

export type CanConvertResult =
    | {
          allowed: true;
      }
    | {
          allowed: false;
          reason: string;
      };
