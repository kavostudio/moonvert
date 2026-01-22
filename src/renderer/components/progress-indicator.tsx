import { motion } from 'motion/react';

type ProgressIndicatorProps = {
    totalSteps: number;
    currentStep: number;
};

export function ProgressIndicator({ totalSteps, currentStep }: ProgressIndicatorProps) {
    const dots = totalSteps;

    // Hide stepper visually when there's only one configuration step (totalSteps includes summary, so <= 2)
    const shouldHide = totalSteps <= 2;

    return (
        <motion.div
            animate={{ opacity: 1, y: 0 }}
            className={`relative z-50 flex items-center gap-1.5 ${shouldHide ? 'invisible' : ''}`}
            initial={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
        >
            {Array.from({ length: dots }).map((_, index) => {
                const stepNumber = index + 1;
                const isActive = stepNumber === currentStep;

                const isCompleted = stepNumber < currentStep;

                if (isCompleted) {
                    return (
                        <motion.div
                            animate={{ scale: 1 }}
                            className="bg-popover-foreground flex size-2.5 items-center justify-center rounded-full"
                            initial={{ scale: 0 }}
                            key={index}
                            transition={{
                                duration: 0.3,
                                delay: index * 0.1,
                                ease: 'backOut',
                            }}
                        ></motion.div>
                    );
                }

                if (isActive) {
                    return (
                        <motion.div
                            animate={{ scale: 1 }}
                            className="border-popover-foreground flex size-3.75 items-center justify-center rounded-full border-[1.5px] p-px"
                            initial={{ scale: 0 }}
                            key={index}
                            transition={{
                                duration: 0.3,
                                delay: index * 0.1,
                                ease: 'backOut',
                            }}
                        >
                            <motion.div
                                animate={{ scale: 1 }}
                                className="bg-popover-foreground size-2 rounded-full"
                                initial={{ scale: 0 }}
                                transition={{
                                    duration: 0.1,
                                    delay: index * 0.1 + 0.15,
                                    ease: 'backOut',
                                }}
                            />
                        </motion.div>
                    );
                }

                return (
                    <motion.div
                        animate={{ scale: 1 }}
                        className="dark:bg-secondary bg-secondary/80 flex size-2.5 items-center justify-center rounded-full"
                        initial={{ scale: 0 }}
                        key={index}
                        transition={{
                            duration: 0.3,
                            delay: index * 0.1,
                            ease: 'backOut',
                        }}
                    />
                );
            })}
        </motion.div>
    );
}
