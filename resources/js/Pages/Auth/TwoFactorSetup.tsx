import { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import { ShieldCheckIcon, ShieldExclamationIcon } from '@heroicons/react/24/outline';
import AppLayout from '@/Layouts/AppLayout';
import { Button, Input } from '@/Components/UI';

interface Props {
    isEnabled: boolean;
    qrCodeSvg: string | null;
    secretKey: string | null;
}

export default function TwoFactorSetup({ isEnabled, qrCodeSvg, secretKey }: Props) {
    const [showDisable, setShowDisable] = useState(false);

    const enableForm = useForm({ code: '' });
    const disableForm = useForm({ password: '' });

    function handleEnable(e: React.FormEvent) {
        e.preventDefault();
        enableForm.post('/user/two-factor-setup');
    }

    function handleDisable(e: React.FormEvent) {
        e.preventDefault();
        disableForm.delete('/user/two-factor-setup', {
            onSuccess: () => setShowDisable(false),
        });
    }

    // Format secret key into groups of 4 (e.g. ABCD EFGH IJKL MNOP)
    const formattedSecret = secretKey?.match(/.{1,4}/g)?.join(' ') ?? '';

    return (
        <AppLayout>
            <Head title="Two-Factor Authentication" />

            <div className="max-w-lg mx-auto py-8 px-4">
                <div className="flex items-center gap-3 mb-6">
                    {isEnabled
                        ? <ShieldCheckIcon className="w-7 h-7 text-success-500" />
                        : <ShieldExclamationIcon className="w-7 h-7 text-warning-500" />}
                    <div>
                        <h1 className="text-xl font-semibold text-[--color-text]">
                            Two-Factor Authentication
                        </h1>
                        <p className="text-sm text-[--color-text-muted]">
                            {isEnabled
                                ? 'Your account is protected with 2FA.'
                                : 'Add an extra layer of security to your account.'}
                        </p>
                    </div>
                </div>

                {isEnabled ? (
                    /* Enabled state */
                    <div className="bg-success-50 border border-success-200 rounded-xl p-5 space-y-4">
                        <p className="text-sm text-success-700">
                            Two-factor authentication is <strong>enabled</strong>. You will be asked for a
                            code from your authenticator app each time you sign in.
                        </p>

                        {!showDisable ? (
                            <button
                                type="button"
                                onClick={() => setShowDisable(true)}
                                className="text-sm text-danger-600 hover:text-danger-700 font-medium transition-colors"
                            >
                                Disable two-factor authentication →
                            </button>
                        ) : (
                            <form onSubmit={handleDisable} className="space-y-3 pt-3 border-t border-success-200">
                                <p className="text-sm text-[--color-text-muted]">
                                    Enter your current password to confirm disabling 2FA.
                                </p>
                                <Input
                                    label="Current password"
                                    type="password"
                                    id="disable-password"
                                    value={disableForm.data.password}
                                    onChange={e => disableForm.setData('password', e.target.value)}
                                    error={disableForm.errors.password}
                                    required
                                    autoFocus
                                />
                                <div className="flex gap-2">
                                    <Button type="submit" variant="danger" loading={disableForm.processing}>
                                        Disable 2FA
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={() => setShowDisable(false)}
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </form>
                        )}
                    </div>
                ) : (
                    /* Setup state */
                    <div className="space-y-4">
                        <div className="bg-white border border-[--color-border] rounded-xl p-5 space-y-4">
                            <h2 className="text-sm font-semibold text-[--color-text]">
                                Step 1 — Scan the QR code
                            </h2>
                            <p className="text-sm text-[--color-text-muted]">
                                Open your authenticator app (Google Authenticator, Authy, 1Password, etc.)
                                and scan the code below.
                            </p>

                            {qrCodeSvg && (
                                <div className="flex justify-center py-2">
                                    <img
                                        src={qrCodeSvg}
                                        alt="2FA QR Code"
                                        className="w-44 h-44 rounded-lg border border-[--color-border] p-2 bg-white"
                                    />
                                </div>
                            )}

                            <div>
                                <p className="text-xs text-[--color-text-muted] mb-1.5">
                                    Can't scan? Enter this key manually in your app:
                                </p>
                                <code className="block text-xs font-mono bg-[--color-bg] border border-[--color-border] rounded-lg px-3 py-2.5 tracking-widest text-[--color-text] select-all break-all">
                                    {formattedSecret}
                                </code>
                            </div>
                        </div>

                        <div className="bg-white border border-[--color-border] rounded-xl p-5">
                            <h2 className="text-sm font-semibold text-[--color-text] mb-1">
                                Step 2 — Confirm with a code
                            </h2>
                            <p className="text-sm text-[--color-text-muted] mb-4">
                                Enter the 6-digit code shown in your authenticator app to complete setup.
                            </p>
                            <form onSubmit={handleEnable} className="space-y-4">
                                <Input
                                    label="6-digit code"
                                    type="text"
                                    id="code"
                                    value={enableForm.data.code}
                                    onChange={e =>
                                        enableForm.setData('code', e.target.value.replace(/\D/g, '').slice(0, 6))
                                    }
                                    error={enableForm.errors.code}
                                    placeholder="000000"
                                    required
                                    autoFocus
                                    autoComplete="one-time-code"
                                    inputMode="numeric"
                                />
                                <Button
                                    type="submit"
                                    className="w-full"
                                    loading={enableForm.processing}
                                    disabled={enableForm.data.code.length !== 6}
                                >
                                    Enable two-factor authentication
                                </Button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
