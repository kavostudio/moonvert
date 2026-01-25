import { useState } from 'react';
import { useUnit } from 'effector-react';
import { FolderCheck, ArrowLeft, Plus } from 'lucide-react';
import { $$main, type FailedFile } from './model';
import { ScreenWrapper } from 'renderer/components/screen-wrapper';
import { DecorativeBackground } from 'renderer/components/decorative-background';
import { Button } from 'renderer/components/ui/button';
import { ConversionErrorsDialog } from 'renderer/components/conversion-errors-dialog';

function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / k ** i).toFixed(2)) + ' ' + sizes[i];
}

export function CompleteScreen() {
    const { files } = useUnit($$main.$appState);
    const [errorDialogOpen, setErrorDialogOpen] = useState(false);

    const completedFiles = files.filter((f) => f.state === 'completed');
    const failedFiles = files.filter((f): f is FailedFile => f.state === 'failed');
    const totalProcessed = completedFiles.length + failedFiles.length;

    const totalSizeBytes = completedFiles.reduce((sum, file) => sum + file.convertedSize, 0);
    const handleCopy = async () => {
        const filesToCopy = completedFiles.map((f) => ({
            fileId: f.id,
            data: f.resultData,
            suggestedFileName: f.suggestedFileName!,
        }));

        if (filesToCopy.length === 0) return;

        const result = await window.App.file.copyToClipboard(filesToCopy);

        if (result.success) {
        } else {
            console.error('Failed to copy to clipboard:', result.error);
        }
    };

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: 'Converted Files',
                text: `${completedFiles.length} files converted`,
            });
        }
    };

    const handleSaveAs = async () => {
        const filesToSave = completedFiles
            .filter((f) => f.resultData && f.suggestedFileName && f.state === 'completed')
            .map((f) => ({
                fileId: f.id,
                data: f.resultData,
                suggestedFileName: f.suggestedFileName!,
            }));

        if (filesToSave.length > 0) {
            await window.App.file.saveAllToFolder(filesToSave);
        }
    };

    const handleNewConversion = () => {
        $$main.resetWizard();
    };

    const handleBack = () => {
        $$main.navigateTo($$main.Screens.Configuration);
    };

    return (
        <ScreenWrapper
            headerChildren={
                <>
                    <Button onClick={handleBack} variant="icon" size="icon">
                        <ArrowLeft className="size-4 stroke-[2.8px]" />
                    </Button>
                    <Button onClick={handleNewConversion} variant="icon" size="icon">
                        <Plus className="size-4" />
                    </Button>
                </>
            }
        >
            <div className="gradient-bg relative flex h-full w-full flex-col items-center justify-center rounded-b-[20px]">
                <div className="absolute top-0 left-0 size-full">
                    <DecorativeBackground topCloudOffset={-25} />
                </div>

                <div className="relative z-10 flex flex-col items-center justify-center">
                    <div className="mb-2">
                        <FolderCheck className="text-popover-foreground size-20" strokeWidth={1.5} />
                    </div>

                    <h2 className="text-popover-foreground mb-0.5 text-lg font-medium">Converted files</h2>
                    <p className="text-muted-foreground-softer mb-9 text-base">{formatBytes(totalSizeBytes)}</p>

                    <div className="flex items-center gap-3">
                        <Button onClick={handleCopy} variant="secondary">
                            Copy
                        </Button>

                        {/* <Button onClick={handleShare} variant="default">
              Share
            </Button> */}

                        <Button onClick={handleSaveAs} variant="default">
                            Save As...
                        </Button>
                    </div>

                    {failedFiles.length > 0 && (
                        <div className="mt-3 flex items-center gap-1">
                            <p className="text-popover-destructive text-sm">
                                {failedFiles.length} file{failedFiles.length > 1 ? 's' : ''} failed to convert.
                            </p>
                            <button
                                type="button"
                                onClick={() => setErrorDialogOpen(true)}
                                className="text-popover-destructive text-sm underline underline-offset-2 transition-colors hover:brightness-125"
                                tabIndex={-1}
                            >
                                See details
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <ConversionErrorsDialog open={errorDialogOpen} onOpenChange={setErrorDialogOpen} failedFiles={failedFiles} totalProcessed={totalProcessed} />
        </ScreenWrapper>
    );
}
