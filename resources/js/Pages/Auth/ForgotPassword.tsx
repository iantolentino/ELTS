import { Head, Link, useForm } from '@inertiajs/react';
import AuthLayout from '@/Layouts/AuthLayout';
import { Button, Input } from '@/Components/UI';

interface Props {
    status?: string;
}

export default function ForgotPassword({ status }: Props) {
    const { data, setData, post, processing, errors } = useForm({ email: '' });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post('/forgot-password');
    }

    return (
        <AuthLayout title="Reset your password" subtitle="Enter your email and we'll send you a reset link">
            <Head title="Forgot Password" />

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

                <Button type="submit" className="w-full" loading={processing}>
                    Send reset link
                </Button>
            </form>

            <p className="mt-6 text-center text-sm text-[--color-text-muted]">
                <Link href="/login" className="text-primary-600 hover:text-primary-700 font-medium">
                    Back to sign in
                </Link>
            </p>
        </AuthLayout>
    );
}
