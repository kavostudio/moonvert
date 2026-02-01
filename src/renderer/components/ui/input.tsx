import * as React from 'react';

import { cn } from 'renderer/lib/utils';

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
    return (
        <input
            type={type}
            data-slot="input"
            className={cn(
                // Base styles - compact macOS-style input
                'h-[26px] w-full min-w-0 rounded-lg border px-2 py-0.5 text-base leading-normal',
                'bg-accent border-border-muted shadow-xs',
                // Dark mode
                'dark:bg-accent dark:border-border-muted',
                // Text and placeholder
                'text-popover placeholder:text-muted/60',
                'selection:bg-primary selection:text-primary-foreground',
                // Focus state
                'transition-shadow outline-none',
                'focus:ring-primary/30 focus:border-primary/60 focus:ring-[3px]',
                // File input
                'file:text-popover file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium',
                // Invalid state
                'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
                // Disabled state
                'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
                'no-drag',
                className,
            )}
            {...props}
        />
    );
}

export { Input };
