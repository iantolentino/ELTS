import { Head, router, useForm } from '@inertiajs/react';
import { LockClosedIcon } from '@heroicons/react/24/outline';
import AuthLayout from '@/Layouts/AuthLayout';
import { Button } from '@/Components/UI';

export default function TwoFactorChallenge() {
    const { data, setData, post, processing, errors } = useForm({ code: '' });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post('/two-factor-challenge');
    }

    return (
        <AuthLayout title="Two-factor authentication" subtitle="Enter the code from your authenticator app">
            <Head title="Two-Factor Challenge" />

            <form onSubmit={submit} className="space-y-5">
                <div className="flex justify-center py-2">
                    <div className="w-14 h-14 rounded-full bg-primary-50 flex items-center justify-center">
                        <LockClosedIcon className="w-7 h-7 text-primary-600" />
                    </div>
                </div>

                <div className="flex flex-col gap-1">
                    <label htmlFor="code" className="text-sm font-medium text-[--color-text]">
                        6-digit code <span className="text-danger-500">*</span>
                    </label>
                    <input
                        id="code"
                        type="text"
                        value={data.code}
                        onChange={e => setData('code', e.target.value.replace(/\D/g, '').slice(0, 6))}
                        autoComplete="one-time-code"
                        inputMode="numeric"
                        autoFocus
                        required
                        placeholder="000000"
                        className={`w-full h-11 rounded-lg border text-center text-xl font-mono tracking-[0.5em] bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${errors.code ? 'border-danger-400' : 'border-[--color-border]'}`}
                    />
                    {errors.code && (
                        <p className="text-xs text-danger-500">{errors.code}</p>
                    )}
                </div>

                <Button
                    type="submit"
                    className="w-full"
                    loading={processing}
                    disabled={data.code.length !== 6}
                >
                    Verify and sign in
                </Button>
            </form>

            <div className="mt-6 text-center">
                <button
                    type="button"
                    onClick={() => router.post('/logout')}
                    className="text-sm text-[--color-text-muted] hover:text-[--color-text] transition-colors"
                >
                    Use a different account
                </button>
            </div>
        </AuthLayout>
    );
}
