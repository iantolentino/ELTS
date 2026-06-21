import { ReactNode } from 'react';

type Variant  = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple';
type Priority = 'critical' | 'high' | 'medium' | 'low';
type Size     = 'sm' | 'md';

interface Props {
    children:  ReactNode;
    variant?:  Variant;
    priority?: Priority;
    size?:     Size;
    dot?:      boolean;
}

const variantCls: Record<Variant, string> = {
    default: 'bg-[--color-bg] text-[--color-text-muted] border border-[--color-border]',
    success: 'bg-success-50 text-success-700',
    warning: 'bg-warning-50 text-warning-700',
    danger:  'bg-danger-50 text-danger-600',
    info:    'bg-primary-50 text-primary-700',
    purple:  'bg-purple-50 text-purple-700',
};

const priorityCls: Record<Priority, string> = {
    critical: 'bg-danger-50 text-danger-600',
    high:     'bg-warning-50 text-warning-700',
    medium:   'bg-primary-50 text-primary-700',
    low:      'bg-success-50 text-success-700',
};

const dotCls: Record<Priority, string> = {
    critical: 'bg-danger-500',
    high:     'bg-warning-500',
    medium:   'bg-primary-600',
    low:      'bg-success-500',
};

const sizeCls: Record<Size, string> = {
    sm: 'px-1.5 py-0.5 text-[10px]',
    md: 'px-2 py-0.5 text-xs',
};

export default function Badge({ children, variant = 'default', priority, size = 'md', dot = false }: Props) {
    const cls = priority ? priorityCls[priority] : variantCls[variant];
    return (
        <span className={`inline-flex items-center gap-1 rounded-full font-medium ${cls} ${sizeCls[size]}`}>
            {dot && priority && (
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotCls[priority]}`} />
            )}
            {children}
        </span>
    );
}
