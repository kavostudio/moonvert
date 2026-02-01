import { MainEnv } from 'main/main-env';

export function getJwtPublicKey(): string {
    return Buffer.from(MainEnv.JWT_PUBLIC_KEY, 'base64').toString('utf-8');
}
