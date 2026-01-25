import type * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from 'renderer/lib/utils';

const buttonVariants = cva(
    'inline-flex items-center justify-center gap-[8px] whitespace-nowrap rounded-lg text-base font-normal leading-normal transition-all hover:brightness-120 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 outline-none no-drag',
    {
        variants: {
            variant: {
                default: 'bg-primary text-popover-foreground hover:bg-primary/90',
                secondary: 'bg-secondary hover:bg-secondary/90 text-popover',
                'accent-secondary-foreground': 'bg-accent-secondary-foreground text-popover-foreground',
                destructive: 'bg-destructive text-popover-foreground',
                'destructive-popover': 'bg-popover-destructive text-popover-foreground',
                icon: 'dark:text-muted-foreground-softer dark:bg-secondary bg-white/70 text-primary',
                'icon-ghost': 'dark:text-muted-softer bg-transparent text-primary',
            },
            size: {
                default: 'h-6 py-1 px-2.5',
                lg: 'h-7 py-1.5 px-3',
                icon: 'h-7 w-9.5 shrink-0',
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'default',
        },
    },
);

function Button({
    className,
    variant = 'default',
    size = 'default',
    asChild = false,
    ...props
}: React.ComponentProps<'button'> &
    VariantProps<typeof buttonVariants> & {
        asChild?: boolean;
    }) {
    const Comp = asChild ? Slot : 'button';

    return <Comp className={cn(buttonVariants({ variant, size, className }))} data-slot="button" data-variant={variant} tabIndex={-1} {...props} />;
}

export { Button, buttonVariants };
