const DEFAULT_ABORT_REASON = 'Conversion canceled';

type AbortReason = string | Error;

class ConversionManager {
    private readonly activeControllers = new Map<string, AbortController>();
    private acceptNew = true;

    allowConversions(accept: boolean): void {
        this.acceptNew = accept;
    }

    conversionAllowed(): boolean {
        return this.acceptNew;
    }

    register(fileId: string): AbortController | null {
        if (!this.acceptNew) {
            return null;
        }

        const controller = new AbortController();
        this.activeControllers.set(fileId, controller);
        return controller;
    }

    unregister(fileId: string): void {
        this.activeControllers.delete(fileId);
    }

    abortAll(reason: AbortReason = DEFAULT_ABORT_REASON): void {
        this.allowConversions(false);
        for (const controller of this.activeControllers.values()) {
            if (!controller.signal.aborted) {
                controller.abort(reason);
            }
        }
        this.activeControllers.clear();
    }

    hasActive(): boolean {
        return this.activeControllers.size > 0;
    }
}

export const conversionManager = new ConversionManager();
