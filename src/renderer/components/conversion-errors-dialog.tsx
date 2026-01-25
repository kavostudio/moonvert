import { Copy, X } from 'lucide-react';
import { Button } from 'renderer/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from 'renderer/components/ui/dialog';
import type { FailedFile } from 'renderer/routes/main/model';

type ConversionErrorsDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    failedFiles: FailedFile[];
    totalProcessed: number;
};

export function ConversionErrorsDialog({ open, onOpenChange, failedFiles, totalProcessed }: ConversionErrorsDialogProps) {
    const handleCopyAllDetails = () => {
        const details = failedFiles.map((file) => `${file.name}\n${file.message}`).join('\n\n');
        navigator.clipboard.writeText(details);
    };

    const handleCopyFileError = (file: FailedFile) => {
        navigator.clipboard.writeText(`${file.name}\n${file.message}`);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="h-full max-h-105 w-full justify-between gap-0 p-0" showCloseButton={false}>
                <div className="flex h-full w-full flex-col gap-5 p-5">
                    <div className="flex flex-col items-start">
                        <DialogTitle className="text-popover-foreground text-lg font-bold">Conversion issues</DialogTitle>
                        <DialogDescription className="text-muted-softer text-sm">
                            {totalProcessed} files processed • <span className="text-popover-destructive">{failedFiles.length} failed</span>
                        </DialogDescription>
                    </div>

                    <div className="max-h-76 overflow-y-auto pr-2">
                        <div className="flex flex-col gap-3">
                            {failedFiles.map((file) => (
                                <div key={file.id} className="border-border-muted flex flex-col gap-1 pb-3 last:border-b-0">
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2">
                                            <div className="bg-popover-destructive size-2 shrink-0 rounded-full" />
                                            <span className="text-popover-foreground truncate text-base font-medium">{file.name}</span>
                                        </div>
                                        <Button variant="icon-ghost" size="icon" onClick={() => handleCopyFileError(file)} className="size-6 shrink-0">
                                            <Copy className="size-3.5" />
                                        </Button>
                                    </div>
                                    <p className="text-muted pl-4 text-sm">{file.message}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <DialogFooter className="items-end justify-center">
                    <div className="flex gap-3">
                        <Button
                            onClick={async () => {
                                await window.App.window.openDebugLog();
                            }}
                            type="button"
                            variant={'default'}
                            className="text-popover-foreground/80 w-fit brightness-90"
                        >
                            Open debug log
                        </Button>
                        <Button variant="default" onClick={handleCopyAllDetails}>
                            Copy all details
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
