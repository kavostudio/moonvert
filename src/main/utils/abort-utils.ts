export function getAbortErrorMessage(signal: AbortSignal): string {
    const reason = signal.reason;
    if (typeof reason === 'string' && reason.trim().length > 0) {
        return reason;
    }
    if (reason instanceof Error && reason.message) {
        return reason.message;
    }
    return 'Canceled';
}

export function withAbort<T>(signal: AbortSignal | undefined, promise: Promise<T>): Promise<T> {
    if (!signal) {
        return promise;
    }
    if (signal.aborted) {
        return Promise.reject(new Error(getAbortErrorMessage(signal)));
    }
    let abortHandler: (() => void) | undefined;
    const abortPromise = new Promise<T>((_, reject) => {
        abortHandler = () => {
            reject(new Error(getAbortErrorMessage(signal)));
        };
        signal.addEventListener('abort', abortHandler, { once: true });
    });
    return Promise.race([promise, abortPromise]).finally(() => {
        if (abortHandler) {
            signal.removeEventListener('abort', abortHandler);
        }
    });
}
