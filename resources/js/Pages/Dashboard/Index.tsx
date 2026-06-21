import { Head } from '@inertiajs/react';
import { usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import type { SharedProps } from '@/types';

export default function Dashboard() {
    const { props } = usePage<SharedProps>();
    const user = props.auth.user;

    return (
        <AppLayout>
            <Head title="Dashboard" />
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <h1 className="text-2xl font-semibold text-[--color-text]">
                        Welcome back, {user?.name}
                    </h1>
                    <p className="mt-2 text-[--color-text-muted]">
                        Dashboard coming in Phase 7.
                    </p>
                </div>
            </div>
        </AppLayout>
    );
}
