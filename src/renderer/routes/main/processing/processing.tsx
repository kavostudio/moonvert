import { useUnit } from 'effector-react';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { $$main } from '../model';
import { $$theme } from 'renderer/entities/theme/model';
import { ScreenWrapper } from 'renderer/components/screen-wrapper';
import { DecorativeBackground } from 'renderer/components/decorative-background';
import { RenderMoon } from './render-moon';
import { Button } from 'renderer/components/ui/button';
import { XIcon } from 'lucide-react';

export function ProcessingScreen() {
    const { files } = useUnit($$main.$appState);
    const theme = useUnit($$theme.$theme);
    const allFilesProcessed = useUnit($$main.$allFilesProcessed);
    const [animationComplete, setAnimationComplete] = useState(false);

    const totalFiles = files.length;
    const completedFiles = files.filter((f) => f.state === 'completed' || (f.state === 'converting' && f.progress === 100)).length;
    const failedFiles = files.filter((f) => f.state === 'failed');

    const currentFilesProgress = files.reduce((acc, file) => {
        if (file.state === 'completed') {
            return acc + 100;
        }
        if (file.state === 'failed') {
            return acc + 100;
        }
        if (file.state === 'converting') {
            return acc + file.progress;
        }
        return acc;
    }, 0);

    const totalPossibleProgress = totalFiles * 100;

    const overallProgress = totalPossibleProgress === 0 ? 0 : (currentFilesProgress / totalPossibleProgress) * 100;

    const formatedProgress = Math.floor(overallProgress).toFixed(0);

    const processedFiles = completedFiles + failedFiles.length;

    useEffect(() => {
        if (allFilesProcessed) {
            const timer = setTimeout(() => {
                setAnimationComplete(true);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [allFilesProcessed, formatedProgress]);

    useEffect(() => {
        if (animationComplete) {
            $$main.navigateTo($$main.Screens.Complete);
        }
    }, [animationComplete]);

    return (
        <ScreenWrapper
            headerChildren={
                <Button variant={'destructive'} onClick={() => $$main.cancelAllConversions()} disabled={allFilesProcessed}>
                    <XIcon className="text-muted-foreground text-popover-destructive size-5" />
                </Button>
            }
        >
            <div className="gradient-bg relative flex size-full overflow-hidden">
                <motion.div
                    animate={{
                        scale: allFilesProcessed ? 1 : [1, 1.03, 1],
                    }}
                    className="absolute top-[25%] left-[25%] z-50 -translate-x-1/2 -translate-y-1/2"
                    transition={
                        allFilesProcessed
                            ? { duration: 0.5, ease: 'easeOut' }
                            : {
                                  duration: 2,
                                  repeat: Number.POSITIVE_INFINITY,
                                  ease: 'easeInOut',
                              }
                    }
                >
                    {theme === 'dark' ? <RenderMoon /> : <></>}
                </motion.div>

                <DecorativeBackground topCloudOffset={-50} />

                <div className="absolute top-[calc(50%+15px)] left-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-2 text-center">
                    <p className="text-popover-foreground text-[78px] leading-normal transition-all">{formatedProgress}%</p>

                    <p className="text-muted-foreground-softer dark:text-muted-foreground-softer text-base whitespace-pre-wrap">
                        {processedFiles}/{totalFiles} files
                    </p>
                </div>
            </div>
        </ScreenWrapper>
    );
}
