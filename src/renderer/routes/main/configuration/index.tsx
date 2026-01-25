import { useUnit } from 'effector-react';
import { Plus } from 'lucide-react';
import { useCallback, useEffect } from 'react';
import { DecorativeBackground } from 'renderer/components/decorative-background';
import { FileListTable } from 'renderer/components/file-list-table';
import { GroupIcon } from 'renderer/components/group-icon';
import { ProgressIndicator } from 'renderer/components/progress-indicator';
import { ScreenWrapper } from 'renderer/components/screen-wrapper';
import { Button } from 'renderer/components/ui/button';
import { Kbd, KbdGroup } from 'renderer/components/ui/kbd';
import { cn } from 'renderer/lib/utils';
import { FormatCommandSelector } from 'renderer/routes/main/configuration/format-command-selector';
import { $$main } from '../model';
import { getScreenDimensions, Screens } from '../utils';
import { canConvertFileToFormat, getAvailableTargetFormats, getGroupDisplayName } from './helpers';
import { $$configuration } from './model';
import { SummaryScreenContent, SummaryScreenFooter } from './summary';

export function ConfigurationScreen() {
    const { steps, currentStepIndex, selectedTargetFormats } = useUnit($$configuration.$configState);
    const groupedFiles = useUnit($$configuration.$groupedFiles);
    const initialized = useUnit($$configuration.$initialized);
    const canProceed = useUnit($$configuration.$canProceedToNextStep);

    useEffect(() => {
        $$configuration.initialize();
    }, []);

    const currentGroup = steps[currentStepIndex] ?? null;
    const currentGroupFiles = currentGroup ? groupedFiles[currentGroup] : [];
    const totalSteps = steps.length + 1;
    const currentStepNumber = currentStepIndex + 1;
    const isOnSummary = initialized && currentStepIndex === steps.length;
    const isSingleStep = steps.length === 1;

    // Cmd+Enter hotkey to proceed
    const handleProceed = useCallback(() => {
        if (!canProceed && !isOnSummary) return;

        if (isOnSummary || (currentStepIndex === 0 && isSingleStep)) {
            $$main.startConversion();
            $$main.navigateTo($$main.Screens.Processing);
        } else {
            $$configuration.nextStep();
        }
    }, [canProceed, isOnSummary, currentStepIndex, isSingleStep]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.metaKey && e.key === 'Enter') {
                e.preventDefault();
                handleProceed();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleProceed]);

    useEffect(() => {
        (async () => {
            const { height: defaultHeight, width: defaultWidth } = getScreenDimensions(Screens.Configuration);
            const windowSize = await window.App.window.getSize();
            if (isOnSummary) {
                window.App.window.setSize(defaultWidth, 600);
            } else if (windowSize.width !== defaultWidth || windowSize.height !== defaultHeight) {
                $$main.updateScreenDimensions(Screens.Configuration);
            }
        })();
    }, [currentStepIndex]);

    if (!currentGroup && !isOnSummary) {
        return null;
    }

    const availableTargets = getAvailableTargetFormats(currentGroup);

    const selectedFormat = selectedTargetFormats[currentGroup];

    const conversionAdjustedFiles = currentGroupFiles.map((file) => {
        return {
            ...file,
            convertible: selectedFormat ? canConvertFileToFormat(file, selectedFormat) : true,
        };
    });

    return (
        <ScreenWrapper className="justify-between">
            <div className={cn('flex flex-1 flex-col gap-6', isOnSummary ? 'relative h-full w-full' : '')}>
                <div className={cn('gradient-bg relative flex w-full flex-col items-center px-0 pt-6.25', isOnSummary ? 'h-full' : 'h-[320px] gap-6 rounded-b-[20px] pb-6')}>
                    <div className="absolute top-0 left-0 size-full">
                        <DecorativeBackground className={cn(isOnSummary ? '' : 'rounded-b-3xl shadow')} topCloudOffset={20} />
                    </div>
                    <div className="z-10 flex flex-col items-center">
                        <ProgressIndicator currentStep={currentStepNumber} totalSteps={totalSteps} />

                        {isOnSummary ? (
                            <SummaryScreenContent />
                        ) : (
                            <>
                                <div className="mt-8 flex flex-col items-center gap-4">
                                    <GroupIcon group={currentGroup} />
                                    <p className="text-popover-foreground text-2xl font-bold">Configure {getGroupDisplayName(currentGroup)}</p>
                                </div>
                                <FormatCommandSelector
                                    availableTargets={availableTargets}
                                    onTargetChange={(format) =>
                                        $$configuration.setTargetFormat({
                                            group: currentGroup,
                                            format,
                                        })
                                    }
                                    targetFormat={selectedFormat || ''}
                                />
                            </>
                        )}
                    </div>
                    {!isOnSummary && (
                        <div className="absolute right-0 bottom-6 left-0 z-10 flex items-center justify-center">
                            <div className="dark:text-muted-foreground-softer flex items-center gap-1.5 text-sm text-[#C16783]">
                                <span>Press</span>
                                <KbdGroup>
                                    <Kbd className="bg-secondary dark:text-muted-foreground text-[#C16783]">⌘</Kbd>
                                    <Plus className="dark:text-muted-foreground text-[#C16 size-2.5" />
                                    <Kbd className="bg-secondary dark:text-muted-foreground text-[#C16">K</Kbd>
                                </KbdGroup>
                                <span>to change format</span>
                            </div>
                        </div>
                    )}
                </div>

                {!isOnSummary && (
                    <FileListTable files={conversionAdjustedFiles} onRemoveFile={(fileId) => $$main.removeFile(fileId)} targetFormat={selectedFormat} group={currentGroup} />
                )}
            </div>

            {isOnSummary ? (
                <SummaryScreenFooter />
            ) : (
                <div className="bg-secondary-foreground border-border flex items-center justify-between border-t px-4.25 pt-4.25 pb-5">
                    {currentStepIndex === 0 ? (
                        <Button
                            onClick={() => {
                                $$main.navigateTo('home');
                            }}
                            disabled={false}
                            variant="destructive-popover"
                        >
                            Cancel
                        </Button>
                    ) : (
                        <Button onClick={() => $$configuration.previousStep()} variant="accent-secondary-foreground">
                            Back
                        </Button>
                    )}
                    {currentStepIndex === 0 && steps.length === 1 ? (
                        <Button
                            disabled={!canProceed}
                            onClick={() => {
                                $$main.startConversion();
                                $$main.navigateTo($$main.Screens.Processing);
                            }}
                            variant="default"
                        >
                            Convert
                        </Button>
                    ) : (
                        <Button disabled={!canProceed} onClick={() => $$configuration.nextStep()} variant="default">
                            Continue
                        </Button>
                    )}
                </div>
            )}
        </ScreenWrapper>
    );
}
