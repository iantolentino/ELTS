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

export interface PaginationLink {
    url:    string | null;
    label:  string;
    active: boolean;
}

export interface PaginatedData<T> {
    data:      T[];
    links:     PaginationLink[];
    from:      number;
    to:        number;
    total:     number;
    per_page:  number;
    current_page: number;
    last_page: number;
}

declare module '@inertiajs/core' {
    interface PageProps extends InertiaPageProps, SharedProps {}
}
