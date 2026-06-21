import { Head, router, useForm, usePage } from '@inertiajs/react';
import { EnvelopeIcon } from '@heroicons/react/24/outline';
import AuthLayout from '@/Layouts/AuthLayout';
import { Button } from '@/Components/UI';
import type { SharedProps } from '@/types';

interface Props {
    email: string;
}

export default function VerifyEmail({ email }: Props) {
    const { props } = usePage<SharedProps>();
    const status = props.flash?.success;

    const { post, processing } = useForm({});

    function resend(e: React.FormEvent) {
        e.preventDefault();
        post('/email/verification-notification');
    }

    return (
        <AuthLayout title="Verify your email" subtitle="One more step before you get started">
            <Head title="Verify Email" />

            <div className="flex flex-col items-center gap-4 py-2">
                <div className="w-14 h-14 rounded-full bg-primary-50 flex items-center justify-center">
                    <EnvelopeIcon className="w-7 h-7 text-primary-600" />
                </div>

                <div className="text-center">
                    <p className="text-sm text-[--color-text-muted]">
                        We sent a verification link to
                    </p>
                    <p className="text-sm font-medium text-[--color-text] mt-0.5">{email}</p>
                </div>

                <p className="text-xs text-[--color-text-subtle] text-center">
                    Click the link in the email to activate your account.
                    Check your spam folder if you don't see it within a few minutes.
                </p>

                {status && (
                    <p className="text-xs text-success-600 text-center">{status}</p>
                )}

                <form onSubmit={resend} className="w-full">
                    <Button
                        type="submit"
                        variant="secondary"
                        className="w-full"
                        loading={processing}
                    >
                        Resend verification email
                    </Button>
                </form>

                <button
                    type="button"
                    onClick={() => router.post('/logout')}
                    className="w-full text-sm text-[--color-text-muted] hover:text-[--color-text] transition-colors"
                >
                    Sign out and use a different account
                </button>
            </div>
        </AuthLayout>
    );
}
