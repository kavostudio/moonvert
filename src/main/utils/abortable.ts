import { getAbortErrorMessage } from './abort-utils';

export class AbortError extends Error {
    readonly isAbortError = true;

    constructor(signal: AbortSignal) {
        super(getAbortErrorMessage(signal));
        this.name = 'AbortError';
    }
}

export function isAbortError(error: unknown): error is AbortError {
    return error instanceof Error && 'isAbortError' in error && error.isAbortError === true;
}

export type AbortableOptions<T> = {
    signal: AbortSignal;

    operation: () => Promise<T>;

    onAbort?: () => void | Promise<void>;
};

export type AbortableResult<T> = {
    success: true;
    value: T;
};

export type AbortableAborted = {
    success: false;
    aborted: true;
    reason: string;
};

export type AbortableError = {
    success: false;
    aborted: false;
    error: Error;
};

export type AbortableOutcome<T> = AbortableResult<T> | AbortableAborted | AbortableError;

export async function abortable<T>(options: AbortableOptions<T>): Promise<AbortableOutcome<T>> {
    const { signal, operation, onAbort } = options;

    if (signal.aborted) {
        const reason = getAbortErrorMessage(signal);
        return { success: false, aborted: true, reason };
    }

    let abortHandler: (() => void) | undefined;
    let settled = false;

    const cleanup = () => {
        if (abortHandler) {
            signal.removeEventListener('abort', abortHandler);
            abortHandler = undefined;
        }
    };

    const abortPromise = new Promise<never>((_, reject) => {
        abortHandler = () => {
            if (settled) return;
            onAbort?.();
            reject(new AbortError(signal));
        };
        signal.addEventListener('abort', abortHandler, { once: true });
    });

    try {
        const value = await Promise.race([operation(), abortPromise]);
        settled = true;
        cleanup();
        return { success: true, value };
    } catch (error) {
        settled = true;
        cleanup();

        if (isAbortError(error)) {
            return { success: false, aborted: true, reason: error.message };
        }

        return {
            success: false,
            aborted: false,
            error: error instanceof Error ? error : new Error(String(error)),
        };
    }
}
