import { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import AuthLayout from '@/Layouts/AuthLayout';
import { Button, Input } from '@/Components/UI';

interface Props {
    status?: string;
}

export default function Login({ status }: Props) {
    const [showPassword, setShowPassword] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post('/login', { onFinish: () => reset('password') });
    }

    return (
        <AuthLayout title="Welcome back" subtitle="Sign in to your account">
            <Head title="Sign In" />

            {status && (
                <p className="mb-4 text-sm text-success-600 text-center">{status}</p>
            )}

            <form onSubmit={submit} className="space-y-4">
                <Input
                    label="Email address"
                    type="email"
                    id="email"
                    value={data.email}
                    onChange={e => setData('email', e.target.value)}
                    error={errors.email}
                    required
                    autoComplete="email"
                    autoFocus
                />

                {/* Password with show/hide toggle */}
                <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                        <label htmlFor="password" className="text-sm font-medium text-[--color-text]">
                            Password <span className="text-danger-500">*</span>
                        </label>
                        <Link
                            href="/forgot-password"
                            className="text-xs text-primary-600 hover:text-primary-700"
                        >
                            Forgot password?
                        </Link>
                    </div>
                    <div className="relative">
                        <input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            value={data.password}
                            onChange={e => setData('password', e.target.value)}
                            autoComplete="current-password"
                            required
                            className={`w-full h-9 rounded-lg border text-sm bg-white pl-3 pr-10 transition-colors placeholder:text-[--color-text-subtle] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${errors.password ? 'border-danger-400' : 'border-[--color-border]'}`}
                        />
                        <button
                            type="button"
                            tabIndex={-1}
                            onClick={() => setShowPassword(v => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[--color-text-muted] hover:text-[--color-text] transition-colors"
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                            {showPassword
                                ? <EyeSlashIcon className="w-4 h-4" />
                                : <EyeIcon className="w-4 h-4" />}
                        </button>
                    </div>
                    {errors.password && (
                        <p className="text-xs text-danger-500">{errors.password}</p>
                    )}
                </div>

                {/* Remember me */}
                <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                        id="remember"
                        type="checkbox"
                        checked={data.remember}
                        onChange={e => setData('remember', e.target.checked)}
                        className="w-4 h-4 rounded border-[--color-border] text-primary-600 focus:ring-primary-500 cursor-pointer"
                    />
                    <span className="text-sm text-[--color-text-muted]">Remember me for 30 days</span>
                </label>

                <Button type="submit" className="w-full" loading={processing}>
                    Sign in
                </Button>
            </form>

            <p className="mt-6 text-center text-sm text-[--color-text-muted]">
                New client?{' '}
                <Link href="/register" className="text-primary-600 hover:text-primary-700 font-medium">
                    Create an account
                </Link>
            </p>
        </AuthLayout>
    );
}
