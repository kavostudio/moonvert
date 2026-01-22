import { useUnit } from 'effector-react';
import { Button } from 'renderer/components/ui/button';
import { $$main } from '../model';
import { getGroupDisplayName } from './helpers';
import { $$configuration } from './model';

export function SummaryScreenContent() {
    const { steps, selectedTargetFormats } = useUnit($$configuration.$configState);
    const groupedFiles = useUnit($$configuration.$groupedFiles);

    return (
        <>
            <p className="text-popover-foreground relative z-10 mt-8 text-right text-2xl font-bold">Summary</p>

            <div className="relative z-30 mt-8 flex w-full flex-col items-center gap-8 px-5">
                {steps.map((group) => {
                    const groupFiles = groupedFiles[group];
                    const targetFormat = selectedTargetFormats[group];
                    const uniqueFormats = [...new Set(groupFiles.map((f) => f.format))];
                    const visibleFormats = uniqueFormats.slice(0, 2);
                    const remainingCount = Math.max(0, uniqueFormats.length - 2);

                    return (
                        <div className="flex flex-col items-center gap-3" key={group}>
                            <div className="flex items-center gap-2 self-start">
                                <p className="text-popover-foreground text-base">{getGroupDisplayName(group)}</p>
                                <span className="text-muted-foreground-softer text-sm">{groupFiles.length} files</span>
                            </div>

                            <div className="flex items-center gap-6">
                                <div className="border-border-accent flex h-7 w-32 items-center gap-2.5 overflow-hidden rounded-[6px] border bg-transparent px-3 py-1.5">
                                    {visibleFormats.map((f, index, array) => {
                                        return (
                                            <span className="text-popover-foreground overflow-hidden text-base text-ellipsis whitespace-nowrap">
                                                .{f}
                                                {index !== array.length - 1 ? ', ' : ''}
                                            </span>
                                        );
                                    })}
                                    {remainingCount > 0 ? <span className="text-popover-foreground text-base">+{remainingCount}</span> : null}
                                </div>

                                <div className="text-border-accent flex justify-center">
                                    <div className="relative h-0 w-15 shrink-0">
                                        <svg className="absolute inset-[-4.42px_-1%_-4.42px_0] block max-w-none" fill="none" viewBox="0 0 60 9">
                                            <path
                                                className="stroke-border-accent"
                                                d="M0 4.5H58M58 4.5L54 0.5M58 4.5L54 8.5"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth="1"
                                            />
                                        </svg>
                                    </div>
                                </div>

                                <div className="border-border-accent flex h-7 w-32 items-center gap-2.5 overflow-hidden rounded-[6px] border bg-transparent px-3 py-1.5">
                                    <p className="text-popover-foreground overflow-hidden text-base text-ellipsis">{targetFormat ?? 'Select'}</p>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </>
    );
}

export function SummaryScreenFooter() {
    return (
        <div className="border-border flex items-center justify-between border-t px-4.25 pt-4.25 pb-5">
            <Button onClick={() => $$configuration.previousStep()} variant="accent-secondary-foreground">
                Back
            </Button>

            <Button
                onClick={() => {
                    $$main.startConversion();
                    $$main.navigateTo($$main.Screens.Processing);
                }}
                variant="default"
            >
                Convert all
            </Button>
        </div>
    );
}
