import { CircleQuestionMark, Globe, Heart, Info } from 'lucide-react';
import logoPng from 'renderer/assets/logo.png';
import { Button } from 'renderer/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle, DialogTrigger } from 'renderer/components/ui/dialog';
import { cn } from 'renderer/lib/utils';
import { config } from 'shared/config/app-config';
import { GithubIcon } from './icons/icons';
import { Logo } from './logo';

const infoLinks = [
    {
        key: 'website',
        label: 'Website',
        href: config.links.website,
        icon: Globe,
    },
    {
        key: 'donate',
        label: 'Donate',
        href: config.links.donate,
        icon: Heart,
    },
    {
        key: 'github',
        label: 'GitHub',
        href: config.links.github.repository,
        icon: GithubIcon,
    },
] as const;

type InformationDialogProps = {
    className?: string;
};

function openExternalLink(url: string) {
    if (!url) return;
    window.open(url, '_blank', 'noopener,noreferrer');
}

export function InformationDialog({ className }: InformationDialogProps) {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button aria-label="Open information" className={cn('', className)} size="icon" variant="icon">
                    <CircleQuestionMark className="size-5 stroke-[2.8px]" />
                </Button>
            </DialogTrigger>
            <DialogContent className="max- h-full max-h-[374px] w-full justify-between gap-0 p-0" showCloseButton={false}>
                <div className="flex h-full w-full flex-col gap-5 p-5">
                    <div className="flex items-center gap-4">
                        <div className="flex h-full w-auto items-center justify-center rounded-2xl">
                            <img alt="Moonvert" className="size-12.5 object-contain" src={logoPng} />
                        </div>
                        <div className="flex flex-col justify-center gap-1">
                            <DialogTitle className="text-popover">
                                <Logo className="fill-popover-foreground" />
                            </DialogTitle>
                            <DialogDescription className="text-muted-softer text-base leading-none">
                                Version: v{config.version.number} {config.version.codename}
                            </DialogDescription>
                        </div>
                    </div>
                    <div className="flex flex-1 flex-col items-start justify-between">
                        <div className="mt-5 flex flex-col gap-1">
                            <p className="text-muted text-sm">Support</p>
                            <p className="text-popover text-base">
                                Need help or found a bug?{' '}
                                <a
                                    className="text-popover underline underline-offset-2"
                                    href={config.links.contact}
                                    onClick={(event) => {
                                        event.preventDefault();
                                        openExternalLink(config.links.contact);
                                    }}
                                    rel="noopener noreferrer"
                                    target="_blank"
                                >
                                    Contact us
                                </a>
                            </p>
                        </div>

                        <div className="flex flex-col gap-2">
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
                            <p className="text-muted text-sm">If something goes wrong, this report helps us understand the issue</p>
                        </div>
                    </div>
                </div>
                <DialogFooter className="gap-2.5">
                    <div className="flex w-full items-center justify-start gap-8">
                        {infoLinks.map((link) => {
                            const Icon = link.icon;
                            const isDisabled = !link.href;

                            return (
                                <a
                                    className={cn('text-popover hover:text-primary flex items-center gap-1 text-sm transition')}
                                    href={link.href}
                                    key={link.key}
                                    onClick={(event) => {
                                        if (isDisabled) return;
                                        event.preventDefault();
                                        openExternalLink(link.href);
                                    }}
                                    rel="noopener noreferrer"
                                    target="_blank"
                                >
                                    <Icon className="size-3" />
                                    {link.label}
                                </a>
                            );
                        })}
                    </div>
                    <p className="text-muted-softer text-sm">Powered by Kavo Studio</p>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
