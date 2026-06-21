import { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import AuthLayout from '@/Layouts/AuthLayout';
import { Button, Input } from '@/Components/UI';

interface Props {
    token: string;
    email: string;
}

export default function ResetPassword({ token, email }: Props) {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        token,
        email,
        password: '',
        password_confirmation: '',
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post('/reset-password', { onFinish: () => reset('password', 'password_confirmation') });
    }

    return (
        <AuthLayout title="Set new password" subtitle="Choose a strong password for your account">
            <Head title="Reset Password" />

            <form onSubmit={submit} className="space-y-4">
                {/* Email shown read-only so the user knows which account */}
                <Input
                    label="Email address"
                    type="email"
                    id="email"
                    value={data.email}
                    onChange={e => setData('email', e.target.value)}
                    error={errors.email}
                    required
                    autoComplete="email"
                    readOnly
                    className="bg-[--color-bg] cursor-not-allowed"
                />

                {/* New password */}
                <div className="flex flex-col gap-1">
                    <label htmlFor="password" className="text-sm font-medium text-[--color-text]">
                        New password <span className="text-danger-500">*</span>
                    </label>
                    <div className="relative">
                        <input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            value={data.password}
                            onChange={e => setData('password', e.target.value)}
                            autoComplete="new-password"
                            autoFocus
                            required
                            className={`w-full h-9 rounded-lg border text-sm bg-white pl-3 pr-10 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${errors.password ? 'border-danger-400' : 'border-[--color-border]'}`}
                        />
                        <button
                            type="button"
                            tabIndex={-1}
                            onClick={() => setShowPassword(v => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[--color-text-muted] hover:text-[--color-text] transition-colors"
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                            {showPassword ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                        </button>
                    </div>
                    {errors.password && <p className="text-xs text-danger-500">{errors.password}</p>}
                    <p className="text-xs text-[--color-text-muted]">Minimum 8 characters with letters and numbers.</p>
                </div>

                {/* Confirm password */}
                <div className="flex flex-col gap-1">
                    <label htmlFor="password_confirmation" className="text-sm font-medium text-[--color-text]">
                        Confirm new password <span className="text-danger-500">*</span>
                    </label>
                    <div className="relative">
                        <input
                            id="password_confirmation"
                            type={showConfirm ? 'text' : 'password'}
                            value={data.password_confirmation}
                            onChange={e => setData('password_confirmation', e.target.value)}
                            autoComplete="new-password"
                            required
                            className={`w-full h-9 rounded-lg border text-sm bg-white pl-3 pr-10 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${errors.password_confirmation ? 'border-danger-400' : 'border-[--color-border]'}`}
                        />
                        <button
                            type="button"
                            tabIndex={-1}
                            onClick={() => setShowConfirm(v => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[--color-text-muted] hover:text-[--color-text] transition-colors"
                            aria-label={showConfirm ? 'Hide password' : 'Show password'}
                        >
                            {showConfirm ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                        </button>
                    </div>
                    {errors.password_confirmation && (
                        <p className="text-xs text-danger-500">{errors.password_confirmation}</p>
                    )}
                </div>

                <Button type="submit" className="w-full" loading={processing}>
                    Reset password
                </Button>
            </form>
        </AuthLayout>
    );
}
