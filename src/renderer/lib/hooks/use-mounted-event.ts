import type { EventCallable } from 'effector';
import { useEffect } from 'react';

export default function useMountedEvent(event: EventCallable<boolean>) {
    useEffect(() => {
        event(true);
        return () => {
            event(false);
        };
    }, [event]);
}
