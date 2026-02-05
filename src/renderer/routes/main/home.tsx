import { useUnit } from 'effector-react';
import { Plus } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';
import { DecorativeBackground } from 'renderer/components/decorative-background';
import { ScreenWrapper } from 'renderer/components/screen-wrapper';
import { Button } from 'renderer/components/ui/button';
import { $$theme } from 'renderer/entities/theme/model';
import { toast } from 'sonner';
import { toFileWithMetadata } from './file-utils';
import { $$main, type FileWithMetadata } from './model';

export type DroppedFile = {
    path: string;
    name: string;
    size: number;
    isBundle?: boolean; // True for shapefiles
    bundleFiles?: string[]; // List of component extensions: ['.shp', '.shx', '.dbf', '.prj']
};

export function HomeScreen() {
    const theme = useUnit($$theme.$theme);
    const [isDragging, setIsDragging] = useState(false);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX;
        const y = e.clientY;

        if (x <= rect.left || x >= rect.right || y <= rect.top || y >= rect.bottom) {
            setIsDragging(false);
        }
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();

        setIsDragging(false);

        const files = e.dataTransfer.files;
        if (!files || files.length === 0) {
            console.warn('No files in drop event');
            return;
        }

        try {
            const droppedFiles: DroppedFile[] = [];
            const filesArray = Array.from(files);

            const shapefileGroups = new Map<string, File[]>();
            const otherFiles: File[] = [];

            for (const file of filesArray) {
                if (file.name.match(/\.(shp|shx|dbf|prj|cpg|sbn|sbx)$/i)) {
                    const baseName = file.name.replace(/\.[^.]+$/, '');
                    if (!shapefileGroups.has(baseName)) {
                        shapefileGroups.set(baseName, []);
                    }
                    shapefileGroups.get(baseName)!.push(file);
                } else {
                    otherFiles.push(file);
                }
            }

            for (const [baseName, shapefiles] of shapefileGroups) {
                const mainShp = shapefiles.find((f) => f.name.endsWith('.shp') || f.name.endsWith('.SHP'));

                if (!mainShp) {
                    console.warn(`No .shp file found for ${baseName}`);
                    continue;
                }

                const hasShx = shapefiles.some((f) => /\.shx$/i.test(f.name));
                const hasDbf = shapefiles.some((f) => /\.dbf$/i.test(f.name));

                if (!hasShx || !hasDbf) {
                    const missing = [];
                    if (!hasShx) missing.push('.shx');
                    if (!hasDbf) missing.push('.dbf');

                    console.error(`❌ Incomplete shapefile: ${baseName}\n` + `Missing required files: ${missing.join(', ')}\n` + `Please drag all shapefile files together.`);

                    alert(
                        `Incomplete shapefile: ${baseName}\n\n` +
                            `Missing required files: ${missing.join(', ')}\n\n` +
                            `Please drag all shapefile files together (.shp, .shx, .dbf are required).`,
                    );
                    continue;
                }

                const savedFiles: DroppedFile[] = [];
                for (const file of shapefiles) {
                    const arrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onload = () => resolve(reader.result as ArrayBuffer);
                        reader.onerror = () => reject(reader.error);
                        reader.readAsArrayBuffer(file);
                    });

                    const result = await window.App.file.saveDroppedFile(file.name, arrayBuffer);

                    if (result.success && result.file) {
                        savedFiles.push(result.file);
                    }
                }

                const mainSavedFile = savedFiles.find((f) => f.name.endsWith('.shp') || f.name.endsWith('.SHP'));
                if (mainSavedFile) {
                    const totalSize = savedFiles.reduce((sum, f) => sum + f.size, 0);
                    const bundleExtensions = savedFiles.map((f) => f.name.match(/\.[^.]+$/)?.[0]).filter(Boolean) as string[];

                    droppedFiles.push({
                        ...mainSavedFile,
                        size: totalSize,
                        isBundle: true,
                        bundleFiles: bundleExtensions,
                    });
                }
            }

            for (const file of otherFiles) {
                const arrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result as ArrayBuffer);
                    reader.onerror = () => reject(reader.error);
                    reader.readAsArrayBuffer(file);
                });

                const result = await window.App.file.saveDroppedFile(file.name, arrayBuffer);

                if (result.success && result.file) {
                    droppedFiles.push(result.file);
                } else {
                    console.error(`Failed to process ${file.name}:`, result.error);
                }
            }

            if (droppedFiles.length > 0) {
                const conversionResults = droppedFiles.map((file) => ({
                    file,
                    converted: toFileWithMetadata(file),
                }));
                const filesWithMetadata = conversionResults.map((result) => result.converted).filter((file): file is FileWithMetadata => file !== null);
                const rejectedFiles = conversionResults.filter((result) => !result.converted).map((result) => result.file.name);

                if (rejectedFiles.length > 0) {
                    const preview = rejectedFiles.slice(0, 3).join(', ');
                    const suffix = rejectedFiles.length > 3 ? '…' : '';
                    toast.error('File type not supported', {
                        description: `${preview}${suffix}`,
                    });
                }

                if (filesWithMetadata.length > 0) {
                    $$main.addFiles(filesWithMetadata);
                    $$main.navigateTo($$main.Screens.Configuration);
                } else {
                    console.warn('No valid files with recognized formats');
                }
            } else {
                console.warn('No valid files were processed');
            }
        } catch (error) {
            console.error('Error processing dropped files:', error);
        }
    };

    const handleUploadClick = async () => {
        const result = await window.App.file.selectFiles();
        if (!result.canceled && result.files.length > 0) {
            const conversionResults = result.files.map((file) => ({
                file,
                converted: toFileWithMetadata(file),
            }));
            const filesWithMetadata = conversionResults.map((item) => item.converted).filter((file): file is FileWithMetadata => file !== null);
            const rejectedFiles = conversionResults.filter((item) => !item.converted).map((item) => item.file.name);

            if (rejectedFiles.length > 0) {
                const preview = rejectedFiles.slice(0, 3).join(', ');
                const suffix = rejectedFiles.length > 3 ? '…' : '';
                toast.error('File type not supported', {
                    description: `${preview}${suffix}`,
                });
            }

            if (filesWithMetadata.length > 0) {
                $$main.addFiles(filesWithMetadata);
                $$main.navigateTo($$main.Screens.Configuration);
            }
        }
    };

    return (
        <ScreenWrapper className="gradient-bg" onDragLeave={handleDragLeave} onDragOver={handleDragOver} onDrop={handleDrop}>
            <DecorativeBackground topCloudOffset={-50} />

            <motion.div
                animate={{
                    scale: isDragging ? 1.05 : 1,
                }}
                className="absolute top-1/2 left-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-10 p-10"
                transition={{
                    duration: 0.3,
                    ease: 'easeOut',
                }}
            >
                <motion.div
                    animate={{
                        scale: isDragging ? 1.1 : 1,
                        opacity: 1,
                    }}
                    className="relative inline-grid h-20 w-20"
                    initial={{ scale: 0.8, opacity: 0 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                >
                    {/* Background dashed border square - offset 10px left and 10px down */}
                    <motion.div
                        animate={{
                            scale: isDragging ? 1.05 : 1,
                        }}
                        className="absolute top-2.5 -left-2.5 size-20"
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                    >
                        <svg fill="none" height="80" viewBox="0 0 80 80" width="80" xmlns="http://www.w3.org/2000/svg">
                            <rect
                                className="transition-all duration-300"
                                height="78.6"
                                rx="15.3"
                                stroke={theme === 'light' ? '#FFFFFF' : 'var(--muted-foreground-softer)'}
                                strokeDasharray="6 5"
                                strokeLinecap="round"
                                strokeWidth={isDragging ? '2.0' : '1.4'}
                                width="78.6"
                                x="0.7"
                                y="0.7"
                            />
                        </svg>
                    </motion.div>

                    <motion.div
                        animate={{
                            backgroundColor:
                                isDragging && theme === 'light'
                                    ? '#E0F4FF'
                                    : isDragging && theme === 'dark'
                                      ? 'color-mix(in srgb, var(--muted-foreground) 80%, white)'
                                      : theme === 'dark'
                                        ? 'color-mix(in srgb, var(--muted-foreground) 70%, white)'
                                        : '#FFFFFF',
                            boxShadow: isDragging
                                ? theme === 'light'
                                    ? '0 0 0 3px rgba(119, 214, 255, 0.3)'
                                    : '0 0 0 3px rgba(255, 255, 255, 0.2)'
                                : '0 0 0 0px rgba(0, 0, 0, 0)',
                        }}
                        className="no-drag absolute top-0 left-0 flex items-center justify-center rounded-2xl"
                        style={{
                            width: '80px',
                            height: '80px',
                            backgroundColor: theme === 'dark' ? 'color-mix(in srgb, var(--muted-foreground) 70%, white)' : '#FFFFFF',
                        }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                        onClick={() => {
                            handleUploadClick();
                        }}
                    >
                        <motion.div
                            animate={{
                                scale: isDragging ? 1.1 : 1,
                            }}
                            transition={{ duration: 0.3, ease: 'easeOut' }}
                        >
                            <Plus
                                className="size-9"
                                strokeWidth={3}
                                style={{
                                    color: theme === 'light' ? '#8C6FC5' : '#020111',
                                }}
                            />
                        </motion.div>
                    </motion.div>
                </motion.div>

                <motion.div
                    animate={{
                        opacity: isDragging ? 0.7 : 1,
                        y: 0,
                    }}
                    className="flex flex-col items-center gap-3"
                    initial={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                >
                    <p className="text-muted-foreground-softer text-base font-medium">Drag and drop files</p>

                    <p className="text-muted-foreground text-center text-sm">or</p>

                    <Button onClick={handleUploadClick} variant={'secondary'}>
                        Select files
                    </Button>
                </motion.div>
            </motion.div>
        </ScreenWrapper>
    );
}
