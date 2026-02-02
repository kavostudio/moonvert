import { DialogTrigger } from '@radix-ui/react-dialog';
import { useUnit } from 'effector-react';
import { KeyRound, Loader2, PartyPopper, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { Button } from 'renderer/components/ui/button';
import { Dialog, DialogContent } from 'renderer/components/ui/dialog';
import { $$license } from 'renderer/entities/license/model';
import useMountedEvent from 'renderer/lib/hooks/use-mounted-event';
import { config } from 'shared/config/app-config';
import { TRIAL_CONVERSION_LIMIT } from 'shared/types/license.types';
import { Input } from './ui/input';
import { cn } from 'renderer/lib/utils';

function openExternalLink(url: string) {
    if (url.length === 0) return;
    window.open(url, '_blank', 'noopener,noreferrer');
}

export function LicenseDialog() {
    const open = useUnit($$license.$licenseDialogOpen);

    useMountedEvent($$license.initializeLicense);

    const [licenseKey, setLicenseKey] = useState('');
    const isPending = useUnit($$license.activateLicenseFx.pending);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const licenseState = useUnit($$license.$licenseState);

    if (!licenseState) {
        return null;
    }

    const isFreeTrialExpired = licenseState.status === 'trial' && (licenseState.conversionsRemaining ?? 0) <= 0;
    const isRevoked = licenseState.status === 'revoked';

    const remainingConversions = licenseState.status === 'trial' ? (licenseState.conversionsRemaining ?? 0) : 0;

    const handleActivate = async () => {
        if (!licenseKey.trim()) {
            setError('Please enter a license key');
            return;
        }

        setError(null);

        try {
            const result = await $$license.activateLicenseFx(licenseKey.trim());
            if (result.success) {
                setSuccess(true);
                setLicenseKey('');

                // setTimeout(() => {
                //     $$license.setLicenseDialogOpen(false);
                //     setSuccess(false);
                // }, 3.5 * 1000);
            } else {
                setError(result.error || 'Activation failed');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Activation failed');
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !isPending) {
            handleActivate();
        }
    };

    const handleStartConverting = () => {
        $$license.setLicenseDialogOpen(false);
        setSuccess(false);
    };

    const showTrigger = licenseState.status !== 'active';

    if (success) {
        return (
            <Dialog open={open} onOpenChange={$$license.setLicenseDialogOpen}>
                <DialogContent className="w-90" showCloseButton={true}>
                    <div className="flex flex-col items-center gap-4 py-4">
                        <div className="bg-primary flex size-12 items-center justify-center rounded-xl">
                            <PartyPopper className="text-popover-foreground size-6" />
                        </div>

                        <h2 className="text-popover text-lg font-bold">License activated successfully!</h2>

                        <p className="text-muted dark:text-decorative text-center text-base">
                            You can now convert unlimited files
                            <br />
                            without any restrictions
                        </p>

                        <p className="text-muted-softer text-center text-base">Thank you for supporting this project</p>

                        <Button onClick={handleStartConverting} size="lg" className="mt-2 w-full">
                            Start converting
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog open={open} onOpenChange={$$license.setLicenseDialogOpen}>
            {showTrigger && (
                <DialogTrigger asChild>
                    <Button className="h-full" tabIndex={-1} variant={isRevoked ? 'destructive-popover' : 'default'}>
                        <KeyRound className="size-4" />
                        {isRevoked ? <span>License Revoked</span> : isFreeTrialExpired ? <span>Trial Expired</span> : <span>{remainingConversions} free left</span>}
                    </Button>
                </DialogTrigger>
            )}
            <DialogContent className="w-180" showCloseButton={!isFreeTrialExpired && !isRevoked}>
                <div className="flex flex-col items-center gap-4 py-2">
                    <div className="bg-secondary-foreground flex size-12 items-center justify-center rounded-[12px] border p-3 dark:border-none">
                        <Sparkles className="text-popover fill-popover size-6 stroke-0" />
                    </div>

                    <div className="text-center">
                        {isFreeTrialExpired ? (
                            <h2 className="text-popover text-xl font-bold">You've used all {TRIAL_CONVERSION_LIMIT} free conversions</h2>
                        ) : (
                            <h2 className="text-popover text-xl font-bold">{remainingConversions} free conversions left</h2>
                        )}
                        <p className="text-decorative mt-1 text-base">Unlock unlimited conversions</p>
                    </div>

                    <Button onClick={() => openExternalLink(config.links.website)} size="lg" className="w-full">
                        Get a license
                    </Button>

                    <p className="text-muted text-sm">Already have a license? Enter it below</p>

                    <div className="flex w-full gap-2">
                        <Input
                            type="text"
                            placeholder="XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX"
                            value={licenseKey}
                            onChange={(e) => {
                                setLicenseKey(e.target.value);
                                setError(null);
                            }}
                            onKeyDown={handleKeyDown}
                            disabled={isPending}
                            autoComplete="off"
                            spellCheck={false}
                            className={`h-8 flex-1 ${error ? 'border-popover-destructive border' : ''}`}
                        />
                        <Button onClick={handleActivate} disabled={isPending || !licenseKey.trim()} variant="terciary" className="h-8 px-4">
                            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Activate'}
                        </Button>
                    </div>

                    {error && <p className={cn('text-popover-destructive mr-auto max-w-[40ch] truncate text-sm')}>{error}</p>}

                    {isRevoked && (
                        <div className="text-center">
                            <p className="text-popover-destructive text-sm font-medium">Your license has been revoked</p>
                            <p className="text-popover-destructive text-sm">Contact support or enter a new license key</p>
                        </div>
                    )}

                    <p className="text-muted text-sm">
                        Having trouble?{' '}
                        <a
                            href={config.links.contact}
                            onClick={(e) => {
                                e.preventDefault();
                                openExternalLink(config.links.contact);
                            }}
                            className="text-primary underline underline-offset-2 hover:brightness-125"
                        >
                            Contact support
                        </a>
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
}
