import { PageProps as InertiaPageProps } from '@inertiajs/core';

export interface AuthUser {
    id: number;
    name: string;
    email: string;
    roles: string[];
    permissions: string[];
    availability: 'online' | 'busy' | 'away' | 'offline';
}

export interface Flash {
    success: string | null;
    error: string | null;
}

export interface SharedProps {
    auth: {
        user: AuthUser | null;
    };
    flash: Flash;
}

declare module '@inertiajs/core' {
    interface PageProps extends InertiaPageProps, SharedProps {}
}
