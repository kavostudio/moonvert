import { Command as CommandPrimitive } from 'cmdk';
import type * as React from 'react';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from 'renderer/components/ui/dialog';
import { cn } from 'renderer/lib/utils';

function Command({ className, ...props }: React.ComponentProps<typeof CommandPrimitive>) {
    return (
        <CommandPrimitive
            className={cn('bg-gradient text-popover-foreground no-drag *:no-drag flex h-full w-full flex-col overflow-hidden rounded-md', className)}
            data-slot="command"
            {...props}
        />
    );
}

function CommandDialog({
    title = 'Command Palette',
    description = 'Search for a command to run...',
    children,
    className,
    showCloseButton = true,
    ...props
}: React.ComponentProps<typeof Dialog> & {
    title?: string;
    description?: string;
    className?: string;
    showCloseButton?: boolean;
}) {
    return (
        <Dialog {...props}>
            <DialogHeader className="sr-only">
                <DialogTitle>{title}</DialogTitle>
                <DialogDescription>{description}</DialogDescription>
            </DialogHeader>
            <DialogContent className={cn('overflow-hidden p-0', className)} showCloseButton={showCloseButton}>
                <Command className="[&_[cmdk-group-heading]]:text-muted-foreground **:data-[slot=command-input-wrapper]:h-12 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group]]:px-2 [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5">
                    {children}
                </Command>
            </DialogContent>
        </Dialog>
    );
}

function CommandInput({ className, ...props }: React.ComponentProps<typeof CommandPrimitive.Input>) {
    return (
        <div className="border-border-muted flex h-18 items-center border-b px-4.5" data-slot="command-input-wrapper">
            <CommandPrimitive.Input
                className={cn(
                    'placeholder:text-muted text-popover text flex h-14 w-full cursor-text rounded-md bg-transparent py-3 text-base outline-hidden disabled:cursor-not-allowed disabled:opacity-50',
                    className,
                )}
                data-slot="command-input"
                {...props}
            />
        </div>
    );
}

function CommandList({ className, ...props }: React.ComponentProps<typeof CommandPrimitive.List>) {
    return (
        <CommandPrimitive.List className={cn('h-full scroll-py-1 overflow-x-hidden overflow-y-scroll [scrollbar-gutter:stable]', className)} data-slot="command-list" {...props} />
    );
}

function CommandEmpty({ ...props }: React.ComponentProps<typeof CommandPrimitive.Empty>) {
    return <CommandPrimitive.Empty className="text-popover py-6 text-center text-sm" data-slot="command-empty" {...props} />;
}

function CommandGroup({ className, ...props }: React.ComponentProps<typeof CommandPrimitive.Group>) {
    return (
        <CommandPrimitive.Group
            className={cn(
                'text-foreground [&_[cmdk-group-heading]]:text-muted-foreground overflow-hidden p-1 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-sm [&_[cmdk-group-heading]]:font-medium',
                className,
            )}
            data-slot="command-group"
            {...props}
        />
    );
}

function CommandSeparator({ className, ...props }: React.ComponentProps<typeof CommandPrimitive.Separator>) {
    return <CommandPrimitive.Separator className={cn('bg-border -mx-1 h-px', className)} data-slot="command-separator" {...props} />;
}

function CommandItem({ className, ...props }: React.ComponentProps<typeof CommandPrimitive.Item>) {
    return (
        <CommandPrimitive.Item
            className={cn(
                "data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground [&_svg:not([class*='text-'])]:text-muted-foreground relative flex cursor-default! items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
                className,
            )}
            data-slot="command-item"
            {...props}
        />
    );
}

function CommandShortcut({ className, ...props }: React.ComponentProps<'span'>) {
    return <span className={cn('text-muted-foreground ml-auto text-sm tracking-widest', className)} data-slot="command-shortcut" {...props} />;
}

export { Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator, CommandShortcut };
