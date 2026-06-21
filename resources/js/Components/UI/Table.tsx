import { ReactNode } from 'react';
import { ChevronUpIcon, ChevronDownIcon, ChevronUpDownIcon } from '@heroicons/react/24/outline';

export interface Column<T> {
    key:        keyof T | string;
    label:      string;
    sortable?:  boolean;
    className?: string;
    render?:    (row: T, index: number) => ReactNode;
}

interface Props<T> {
    columns:       Column<T>[];
    data:          T[];
    rowKey:        (row: T) => string | number;
    loading?:      boolean;
    emptyMessage?: string;
    sortKey?:      string;
    sortDir?:      'asc' | 'desc';
    onSort?:       (key: string) => void;
    onRowClick?:   (row: T) => void;
}

export default function Table<T>({
    columns,
    data,
    rowKey,
    loading      = false,
    emptyMessage = 'No records found.',
    sortKey,
    sortDir,
    onSort,
    onRowClick,
}: Props<T>) {
    return (
        <div className="overflow-x-auto rounded-xl border border-[--color-border]">
            <table className="w-full text-sm">
                <thead>
                    <tr className="bg-[--color-bg] border-b border-[--color-border]">
                        {columns.map(col => (
                            <th
                                key={String(col.key)}
                                onClick={() => col.sortable && onSort?.(String(col.key))}
                                className={`px-4 py-3 text-left text-xs font-semibold text-[--color-text-muted] uppercase tracking-wider whitespace-nowrap ${col.sortable ? 'cursor-pointer select-none hover:text-[--color-text]' : ''} ${col.className ?? ''}`}
                            >
                                <span className="inline-flex items-center gap-1">
                                    {col.label}
                                    {col.sortable && (
                                        sortKey === String(col.key)
                                            ? sortDir === 'asc'
                                                ? <ChevronUpIcon className="w-3 h-3" />
                                                : <ChevronDownIcon className="w-3 h-3" />
                                            : <ChevronUpDownIcon className="w-3 h-3 opacity-40" />
                                    )}
                                </span>
                            </th>
                        ))}
                    </tr>
                </thead>

                <tbody>
                    {loading ? (
                        <tr>
                            <td colSpan={columns.length} className="px-4 py-12 text-center text-[--color-text-muted]">
                                <span className="inline-flex items-center gap-2">
                                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    Loading…
                                </span>
                            </td>
                        </tr>
                    ) : data.length === 0 ? (
                        <tr>
                            <td colSpan={columns.length} className="px-4 py-12 text-center text-[--color-text-muted]">
                                {emptyMessage}
                            </td>
                        </tr>
                    ) : (
                        data.map((row, i) => (
                            <tr
                                key={rowKey(row)}
                                onClick={() => onRowClick?.(row)}
                                className={`border-b border-[--color-border] last:border-0 transition-colors ${onRowClick ? 'cursor-pointer hover:bg-primary-50/40' : 'hover:bg-[--color-bg]/60'}`}
                            >
                                {columns.map(col => (
                                    <td key={String(col.key)} className={`px-4 py-3 text-[--color-text] ${col.className ?? ''}`}>
                                        {col.render
                                            ? col.render(row, i)
                                            : String((row as Record<string, unknown>)[String(col.key)] ?? '')}
                                    </td>
                                ))}
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}
