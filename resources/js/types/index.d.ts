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

export interface AppNotificationData {
    title?:  string;
    body?:   string;
    url?:    string;
    event?:  string;
}

export interface AppNotification {
    id:         string;
    type:       string;
    data:       AppNotificationData;
    read_at:    string | null;
    created_at: string;
}

export interface SharedProps {
    auth: {
        user: AuthUser | null;
    };
    flash: Flash;
    notifications: {
        unread_count: number;
        recent:       AppNotification[];
    };
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

export interface TicketStatus {
    id:         number;
    name:       string;
    color:      string;
    sort_order: number;
    is_default: boolean;
    is_closed:  boolean;
}

export interface TicketCategory {
    id:          number;
    name:        string;
    parent_id:   number | null;
    description: string | null;
    is_active:   boolean;
    sort_order:  number;
    parent?:     TicketCategory;
    children?:   TicketCategory[];
}

export interface TicketTag {
    id:    number;
    name:  string;
    color: string | null;
}

export interface TicketUserMinimal {
    id:         number;
    name:       string;
    avatar_url: string | null;
}

export interface Ticket {
    id:                number;
    ticket_number:     string;
    subject:           string;
    description:       string;
    priority:          'low' | 'medium' | 'high' | 'critical';
    source:            'web' | 'email' | 'phone' | 'api' | 'portal';
    is_vip:            boolean;
    due_at:            string | null;
    first_response_at: string | null;
    resolved_at:       string | null;
    closed_at:         string | null;
    created_at:        string;
    updated_at:        string;
    status:            TicketStatus;
    category:          TicketCategory | null;
    requester:         TicketUserMinimal;
    assignee:          TicketUserMinimal | null;
    team:              { id: number; name: string } | null;
    tags:              TicketTag[];
}

export interface TicketReply {
    id:         number;
    user:       TicketUserMinimal;
    body:       string;
    is_html:    boolean;
    cc:         string[] | null;
    bcc:        string[] | null;
    created_at: string;
}

export interface TicketNote {
    id:         number;
    user:       TicketUserMinimal;
    body:       string;
    is_html:    boolean;
    created_at: string;
}

export interface ActivityEntry {
    id:          number;
    description: string;
    causer:      { name: string } | null;
    changes:     Record<string, unknown>;
    old:         Record<string, unknown>;
    created_at:  string;
}

export interface CustomFieldValue {
    field: { id: number; label: string; type: string };
    value: string | null;
}

export interface TicketDetail extends Ticket {
    replies:             TicketReply[];
    notes:               TicketNote[];
    activity:            ActivityEntry[];
    watchers:            TicketUserMinimal[];
    custom_field_values: CustomFieldValue[];
}

declare module '@inertiajs/core' {
    interface PageProps extends InertiaPageProps, SharedProps {}
}
