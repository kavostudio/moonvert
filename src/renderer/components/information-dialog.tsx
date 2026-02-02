import { useUnit } from 'effector-react';
import { Copy, Globe, Headset, Scale, Settings } from 'lucide-react';
import logoPng from 'renderer/assets/logo.png';
import { Badge } from 'renderer/components/ui/badge';
import { Button } from 'renderer/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle, DialogTrigger } from 'renderer/components/ui/dialog';
import { $$license } from 'renderer/entities/license/model';
import { cn } from 'renderer/lib/utils';
import { config } from 'shared/config/app-config';
import { TRIAL_CONVERSION_LIMIT, type LicenseState } from 'shared/types/license.types';
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
        key: 'support',
        label: 'Support',
        href: config.links.contact,
        icon: Headset,
    },
    {
        key: 'github',
        label: 'GitHub',
        href: config.links.github.repository,
        icon: GithubIcon,
    },
    {
        key: 'credits',
        label: 'Credits',
        href: config.links.credits,
        icon: Scale,
    },
] as const;

function openExternalLink(url: string) {
    if (!url) return;
    window.open(url, '_blank', 'noopener,noreferrer');
}

type LicenseSectionProps = {
    licenseState: LicenseState | null;
    licenseKey?: string;
};

function LicenseSection({ licenseState, licenseKey }: LicenseSectionProps) {
    if (!licenseState) {
        return null;
    }

    const handleCopyKey = async () => {
        if (!licenseKey) return;
        await navigator.clipboard.writeText(licenseKey);
    };

    if (licenseState.status === 'active') {
        return (
            <div className="flex flex-col gap-2.5">
                <div className="flex items-center gap-2.5">
                    <p className="text-popover text-base font-medium">License</p>
                    <Badge variant={'success'}>Active</Badge>
                </div>
                {licenseKey && (
                    <div className="flex items-center gap-2.5">
                        <div className="bg-muted/20 flex items-center gap-2 rounded-md px-3 py-2">
                            <code className="text-popover font-mono text-sm">{licenseKey}</code>
                            <Button variant="icon-ghost" size="icon" className="size-6 shrink-0" onClick={handleCopyKey}>
                                <Copy className="size-3.5" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    if (licenseState.status === 'trial') {
        return (
            <div className="flex flex-col gap-2.5">
                <div className="flex items-center gap-2.5">
                    <p className="text-popover text-base font-medium">License</p>
                    <Badge variant="default">{TRIAL_CONVERSION_LIMIT}-convert Trial</Badge>
                </div>
                <p className="text-muted text-base">
                    You have {licenseState.conversionsRemaining} conversion{licenseState.conversionsRemaining !== 1 ? 's' : ''} left in your trial
                </p>
            </div>
        );
    }

    if (licenseState.status === 'revoked') {
        return (
            <div className="flex flex-col gap-2.5">
                <div className="flex items-center gap-2.5">
                    <p className="text-popover text-base font-medium">License</p>
                    <Badge variant="destructive">Revoked</Badge>
                </div>
                {licenseKey && (
                    <div className="flex items-center gap-2.5">
                        <div className="bg-muted/20 flex items-center gap-2.5 rounded-md px-3 py-2">
                            <code className="text-muted font-mono text-sm line-through">{licenseKey}</code>
                            <Button variant="icon-ghost" size="icon" className="size-6 shrink-0" onClick={handleCopyKey}>
                                <Copy className="size-3.5" />
                            </Button>
                        </div>
                    </div>
                )}
                <a
                    className="text-popover text-base underline underline-offset-2"
                    href={config.links.contact}
                    onClick={(event) => {
                        event.preventDefault();
                        openExternalLink(config.links.contact);
                    }}
                    rel="noopener noreferrer"
                    target="_blank"
                    tabIndex={-1}
                >
                    Contact support for more information
                </a>
            </div>
        );
    }

    return null;
}

type InformationDialogProps = {
    className?: string;
};

export function InformationDialog({ className }: InformationDialogProps) {
    const licenseState = useUnit($$license.$licenseState);

    const licenseKey = licenseState?.status === 'active' || licenseState?.status === 'revoked' ? licenseState.licenseKey : undefined;

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button aria-label="Open information" className={cn('', className)} size="icon" variant="icon">
                    <Settings className="size-5 stroke-[1.8px]" />
                </Button>
            </DialogTrigger>
            <DialogContent className="h-full max-h-[374px] w-full justify-between gap-0 p-0" showCloseButton={true}>
                <div className="flex h-full w-full flex-col gap-5 p-5">
                    <div className="flex items-center gap-4">
                        <div className="flex h-full w-auto items-center justify-center rounded-2xl">
                            <img alt="Moonvert" className="size-12.5 object-contain" src={logoPng} />
                        </div>
                        <div className="flex flex-col justify-center gap-1">
                            <DialogTitle className="text-popover">
                                <Logo className="fill-popover-foreground" />
                            </DialogTitle>
                            <DialogDescription className="text-decorative text-base leading-none">
                                Version: {config.version.codename} {config.version.number}
                            </DialogDescription>
                        </div>
                    </div>
                    <div className="flex flex-1 flex-col items-start justify-between">
                        <LicenseSection licenseState={licenseState} licenseKey={licenseKey} />

                        <div className="flex flex-col gap-2">
                            <Button
                                onClick={async () => {
                                    await window.App.window.openDebugLog();
                                }}
                                type="button"
                                variant={'terciary'}
                                className="w-fit"
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
                                    tabIndex={-1}
                                >
                                    <Icon className="size-3" />
                                    {link.label}
                                </a>
                            );
                        })}
                    </div>
                    <p className="text-decorative text-sm font-medium">Powered by Kavo Studio</p>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
