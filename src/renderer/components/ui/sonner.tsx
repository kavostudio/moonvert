import { Toaster as Sonner, type ToasterProps } from 'sonner';
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from 'lucide-react';

const Toaster = ({ ...props }: ToasterProps) => {
    return (
        <Sonner
            className="!items-center"
            icons={{
                success: <CircleCheckIcon className="size-4" />,
                info: <InfoIcon className="size-4" />,
                warning: <TriangleAlertIcon className="size-4" />,
                error: <OctagonXIcon className="size-4" />,
                loading: <Loader2Icon className="size-4 animate-spin" />,
            }}
            position="top-center"
            toastOptions={{
                classNames: {
                    default: '!w-fit',
                    toast: 'grid grid-cols-[auto_1fr_auto] items-center !w-fit justify-self-center mx-auto gap-1 !px-4 !py-2 !bg-transparent text-foreground rounded-2xl shadow backdrop-blur-md',
                    title: 'text-sm font-medium tracking-tight !text-popover-foreground !text-base',
                    description: 'mt-0.5 !text-popover-foreground/90 !text-sm',
                    icon: '!text-popover-foreground',
                    actionButton: 'rounded-lg px-1.5 py-0.5 text-xs border border-border bg-background text-foreground',
                    cancelButton: 'rounded-lg px-1.5 py-0.5 text-xs border border-border bg-background text-foreground',
                    closeButton: 'size-4 rounded-full border border-border bg-background text-muted-foreground',
                },
            }}
            {...props}
        />
    );
};

export { Toaster };
