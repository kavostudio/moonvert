import { DialogTrigger } from '@radix-ui/react-dialog';
import { useUnit } from 'effector-react';
import { AlertCircle, CheckCircle, KeyRound, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from 'renderer/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from 'renderer/components/ui/dialog';
import { $$license } from 'renderer/entities/license/model';
import useMountedEvent from 'renderer/lib/hooks/use-mounted-event';
import { config } from 'shared/config/app-config';
import { TRIAL_CONVERSION_LIMIT } from 'shared/types/license.types';
import { Input } from './ui/input';

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

    const isExpired = licenseState.status === 'trial' && (licenseState.conversionsRemaining ?? 0) <= 0;
    const isRevoked = licenseState.status === 'revoked';

    const remainingConversions = licenseState.status === 'trial' ? (licenseState.conversionsRemaining ?? 0) : 0;
    const isTrialExpired = licenseState.status === 'trial' && remainingConversions <= 0;

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

                setTimeout(() => {
                    $$license.setLicenseDialogOpen(false);
                    setSuccess(false);
                }, 3.5 * 1000);
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

    // Don't show the trigger button when license is active
    const showTrigger = licenseState.status !== 'active';

    return (
        <Dialog open={open} onOpenChange={$$license.setLicenseDialogOpen}>
            {showTrigger && (
                <DialogTrigger asChild>
                    <Button className="h-full" tabIndex={-1} variant={isRevoked ? 'destructive' : 'default'}>
                        <KeyRound className="size-4" />
                        {isRevoked ? <span>License Revoked</span> : isExpired ? <span>Trial Expired</span> : <span>{remainingConversions} free left</span>}
                    </Button>
                </DialogTrigger>
            )}
            <DialogContent className="max-w-md" showCloseButton={false}>
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full">
                            <KeyRound className="text-primary size-5" />
                        </div>
                        <div>
                            <DialogTitle>{licenseState.status === 'active' ? 'License Active' : 'Activate License'}</DialogTitle>
                            <DialogDescription>
                                {licenseState.status === 'active'
                                    ? 'Your license is active and valid.'
                                    : isTrialExpired
                                      ? 'Your free trial has ended.'
                                      : `${remainingConversions} free conversions remaining.`}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                {licenseState.status === 'active' ? (
                    <div className="bg-success text-popover-success flex items-center gap-2 rounded-lg">
                        <CheckCircle className="size-5" />
                        <span className="text-sm font-medium">License activated successfully</span>
                    </div>
                ) : (
                    <>
                        {isTrialExpired && (
                            <div className="bg-primary text-popover flex items-center gap-2 rounded-lg">
                                <AlertCircle className="size-5" />
                                <span className="text-sm">You've used all {TRIAL_CONVERSION_LIMIT} free conversions. Enter a license key to continue.</span>
                            </div>
                        )}

                        <div className="flex flex-col gap-2">
                            <label htmlFor="license-key" className="text-popover text-sm font-medium">
                                License Key
                            </label>
                            <Input
                                type="text"
                                placeholder="XXXX-XXXX-XXXX-XXXX"
                                value={licenseKey}
                                onChange={(e) => {
                                    setLicenseKey(e.target.value);
                                    setError(null);
                                }}
                                onKeyDown={handleKeyDown}
                                disabled={isPending || success}
                                autoComplete="off"
                                spellCheck={false}
                                autoFocus
                            />
                            {error && <p className="text-popover-destructive flex items-center gap-1 text-sm">{error}</p>}
                        </div>

                        {success ? (
                            <div className="bg-success bg-popover-success flex items-center gap-2 rounded-lg">
                                <CheckCircle className="h-5 w-5" />
                                <span className="text-sm font-medium">License active</span>
                            </div>
                        ) : (
                            <Button onClick={handleActivate} disabled={isPending || !licenseKey.trim()} size={'lg'}>
                                {isPending ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Activating...
                                    </>
                                ) : (
                                    'Activate License'
                                )}
                            </Button>
                        )}

                        <p className="text-muted-foreground text-center text-sm">
                            Don't have a license?{' '}
                            <a
                                href={config.links.website}
                                onClick={(e) => {
                                    e.preventDefault();
                                    openExternalLink(config.links.website);
                                }}
                                className="text-primary hover:text-primary/80 underline underline-offset-2 brightness-120"
                            >
                                Get one here
                            </a>
                        </p>
                    </>
                )}

                {licenseState.status === 'revoked' && (
                    <div className="bg-destructive/10 text-popover-destructive flex items-center gap-2 rounded-lg p-3">
                        <AlertCircle className="h-5 w-5" />
                        <span className="text-sm">Your license has been revoked. Please contact support or enter a new license key.</span>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
