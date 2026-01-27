import { AnimatePresence, motion } from 'motion/react';
import { OctagonX, X } from 'lucide-react';
import { cn } from 'renderer/lib/utils';
import { FileGroup, getGroupDisplayName } from 'renderer/routes/main/configuration/helpers';
import type { FileWithMetadata } from 'renderer/routes/main/model';
import type { FileFormat } from 'shared/types/conversion.types';

type FileListTableProps = {
    files: FileWithMetadata[];
    onSort?: (column: string) => void;
    targetFormat?: FileFormat | null;
    onRemoveFile: (fileId: string) => void;
    group: FileGroup;
};

export function FileListTable({ files, targetFormat, onRemoveFile, group }: FileListTableProps) {
    const anyWarning = files.some((f) => f.state === 'ready' && f.convertible === false);

    return (
        <div className="flex w-full flex-1 flex-col gap-3">
            <div className="flex items-center justify-between gap-1.5 px-5 py-0">
                <div className="flex items-end gap-2">
                    <p className="text-popover text-lg leading-none font-bold">Your {getGroupDisplayName(group).toLowerCase()} files</p>
                    <p className="text-muted-softer text-xs leading-none">{files.length} files</p>
                </div>
                {anyWarning && targetFormat && (
                    <div className="text-popover-destructive flex items-center gap-1.5">
                        <OctagonX className="size-3.5" />
                        <p className="leading-nont">Selected format is not supported for some files</p>
                    </div>
                )}
            </div>

            <div className="flex flex-1 flex-col gap-1">
                <div className="border-border flex h-7 items-center gap-1 border-b px-5 py-1.25">
                    <div className="flex flex-1 items-center gap-0.5">
                        <p className="text-muted text-sm">Name</p>
                    </div>
                    <div className="flex h-full w-20 shrink-0 items-center">
                        <p className="text-muted text-sm">Format</p>
                    </div>
                    <div className="flex h-full w-20 shrink-0 items-center">
                        <p className="text-muted text-sm">Size</p>
                    </div>
                    <div className="flex h-full w-8 shrink-0 items-center" />
                </div>

                <div className="no-drag flex max-h-72 w-full flex-col gap-1 overflow-y-auto">
                    <AnimatePresence initial={false} mode="popLayout">
                        {files.map((file) => {
                            const hasWarning = Boolean(targetFormat && file.state === 'ready' && file.convertible === false);

                            return (
                                <motion.div
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className={cn(`flex items-center gap-1 px-5 py-0`, {
                                        'bg-destructive': hasWarning,
                                    })}
                                    exit={{ opacity: 0, height: 0 }}
                                    initial={{ opacity: 1, height: 'auto' }}
                                    key={file.id}
                                    layout
                                    transition={{ duration: 0.15, ease: 'easeOut' }}
                                >
                                    <div className="flex min-h-0 min-w-0 flex-1 items-center gap-1.5 pt-1">
                                        <p className="text-popover flex-1 overflow-hidden text-base overflow-ellipsis whitespace-nowrap">{file.name}</p>
                                    </div>
                                    <p className="text-muted w-20 shrink-0 overflow-hidden text-base overflow-ellipsis whitespace-nowrap">{file.format}</p>
                                    <p className="text-muted w-20 shrink-0 overflow-hidden text-base overflow-ellipsis whitespace-nowrap">{formatFileSize(file.size)}</p>

                                    <button
                                        className={cn(
                                            'flex size-4.5 shrink-0 items-center justify-center',
                                            hasWarning ? 'bg-popover-destructive text-popover-foreground rounded-md' : 'text-muted',
                                        )}
                                        onClick={() => onRemoveFile(file.id)}
                                        type="button"
                                        tabIndex={-1}
                                    >
                                        <X className={cn('size-3.25')} />
                                    </button>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}

function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / k ** i).toFixed(1)} ${sizes[i]}`;
}
