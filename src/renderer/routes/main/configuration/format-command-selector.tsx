import { Check, ChevronDown } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from 'renderer/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from 'renderer/components/ui/command';
import { Dialog, DialogContent } from 'renderer/components/ui/dialog';
import { cn } from 'renderer/lib/utils';
import { config } from 'shared/config/app-config';
import { getFormatMetadata } from 'shared/config/format-metadata';
import type { FileFormat } from 'shared/types/conversion.types';

type FormatCommandSelectorProps = {
    targetFormat: string;
    availableTargets: FileFormat[];
    onTargetChange: (format: FileFormat) => void;
};

export function FormatCommandSelector({ targetFormat, availableTargets, onTargetChange }: FormatCommandSelectorProps) {
    const [open, setOpen] = useState(false);

    const selectedMetadata = targetFormat ? getFormatMetadata(targetFormat as FileFormat) : null;

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            const isShortcut = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k';
            if (!isShortcut) return;

            event.preventDefault();
            setOpen(true);
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    return (
        <div className="mt-8 flex items-center justify-center">
            <Button onClick={() => setOpen(true)} size="lg" className="min-w-40 justify-between" variant={'secondary'}>
                <span className="truncate">{selectedMetadata?.name || 'Choose format...'}</span>
                <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
            </Button>

            <Dialog onOpenChange={setOpen} open={open}>
                <DialogContent showCloseButton={false} className="flex h-[calc(100vh-4rem)] max-w-[calc(100vw-4rem)] flex-col gap-0 p-0">
                    <Command className="h-full rounded-lg">
                        <CommandInput placeholder="Search formats..." />
                        <CommandList className="flex-1 overflow-y-scroll">
                            <CommandEmpty>No format found.</CommandEmpty>
                            <CommandGroup>
                                {availableTargets.map((format) => {
                                    const metadata = getFormatMetadata(format);
                                    const isSelected = targetFormat === format;

                                    return (
                                        <CommandItem
                                            className="flex cursor-pointer items-start gap-3 px-4 py-4"
                                            key={format}
                                            onSelect={() => {
                                                onTargetChange(format);
                                                setOpen(false);
                                            }}
                                            value={`${format} ${metadata.name}`}
                                        >
                                            <Check className={cn('mt-1 h-5 w-5 shrink-0', isSelected ? 'opacity-100' : 'opacity-0')} />
                                            <div className="flex min-w-0 flex-1 flex-col gap-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-popover text-base font-semibold">{metadata.name}</span>
                                                    <span className="text-muted text-sm">{metadata.extension}</span>
                                                </div>
                                                <span className="text-muted text-sm leading-relaxed">{metadata.description}</span>
                                            </div>
                                        </CommandItem>
                                    );
                                })}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                    <div className="border-border-muted flex h-20 items-center justify-start border-t px-4.5">
                        <p className="text-muted text-sm">
                            Missing a format?{' '}
                            <a
                                href={config.links.github.issues}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-popover font-bold hover:underline"
                                onClick={(e) => {
                                    e.preventDefault();
                                    window.open(config.links.github.issues, '_blank');
                                }}
                            >
                                Write us
                            </a>
                        </p>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
