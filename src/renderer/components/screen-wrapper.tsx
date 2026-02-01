import { motion } from 'motion/react';
import { InformationDialog } from 'renderer/components/information-dialog';
import { cn } from 'renderer/lib/utils';
import { LicenseDialog } from './license-dialog';

type ScreenHeaderProps = {
    children?: React.ReactNode;
    className?: string;
};

function ScreenHeader({ children, className = '' }: ScreenHeaderProps) {
    return (
        <div className={cn('absolute top-11 right-0 left-0 z-20 flex w-full items-center justify-between gap-4 px-5', className)}>
            {children && <div className="flex w-full justify-between">{children}</div>}
            <div className="ml-auto flex items-center gap-2">
                <LicenseDialog />
                <InformationDialog />
            </div>
        </div>
    );
}

type ScreenWrapperProps = React.ComponentProps<'div'> & {
    headerChildren?: React.ReactNode;
    headerClassName?: string;
};

export function ScreenWrapper(props: ScreenWrapperProps) {
    const { children, className = '', key, ...rest } = props;

    return (
        <motion.div
            animate={{ opacity: 1 }}
            className="drag h-full w-full"
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
            key={key}
            transition={{ duration: 0.15, ease: 'easeOut' }}
        >
            <div className={cn('bg-background relative flex h-full w-full flex-col overflow-auto', className)} {...rest}>
                <ScreenHeader className={props.headerClassName}>{props.headerChildren}</ScreenHeader>
                {children}
            </div>
        </motion.div>
    );
}
