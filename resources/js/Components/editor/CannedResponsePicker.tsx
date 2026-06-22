import { useState, useEffect, useRef } from 'react';
import { ChatBubbleLeftEllipsisIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

export interface CannedItem {
    id: number;
    title: string;
    body: string;
    scope: 'global' | 'team' | 'personal';
}

interface Props {
    ticketId?: number;
    onInsert: (html: string) => void;
    onClose: () => void;
}

const SCOPE_COLORS: Record<string, string> = {
    global:   'text-indigo-600 bg-indigo-50',
    team:     'text-amber-600 bg-amber-50',
    personal: 'text-green-600 bg-green-50',
};

export default function CannedResponsePicker({ ticketId, onInsert, onClose }: Props) {
    const [query, setQuery]       = useState('');
    const [items, setItems]       = useState<CannedItem[]>([]);
    const [loading, setLoading]   = useState(false);
    const [active, setActive]     = useState(0);
    const inputRef                = useRef<HTMLInputElement>(null);
    const listRef                 = useRef<HTMLDivElement>(null);

    useEffect(() => { inputRef.current?.focus(); }, []);

    useEffect(() => {
        const ctrl = new AbortController();
        setLoading(true);

        const params = new URLSearchParams({ q: query });
        if (ticketId) params.set('ticket_id', String(ticketId));

        window.axios
            .get(`/canned-responses/search?${params}`, { signal: ctrl.signal })
            .then(res => { setItems(res.data); setActive(0); })
            .catch(() => {})
            .finally(() => setLoading(false));

        return () => ctrl.abort();
    }, [query, ticketId]);

    const insert = (item: CannedItem) => {
        onInsert(item.body);
        onClose();
    };

    const onKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') { onClose(); return; }
        if (e.key === 'ArrowDown') { e.preventDefault(); setActive(i => Math.min(i + 1, items.length - 1)); }
        if (e.key === 'ArrowUp')   { e.preventDefault(); setActive(i => Math.max(i - 1, 0)); }
        if (e.key === 'Enter' && items[active]) { e.preventDefault(); insert(items[active]); }
    };

    useEffect(() => {
        const el = listRef.current?.querySelector(`[data-idx="${active}"]`) as HTMLElement | null;
        el?.scrollIntoView({ block: 'nearest' });
    }, [active]);

    return (
        <div className="absolute z-50 bottom-full mb-1 left-0 w-80 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden">
            <div className="p-2 border-b border-gray-100">
                <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        onKeyDown={onKeyDown}
                        placeholder="Search canned responses…"
                        className="w-full pl-7 pr-3 py-1.5 text-xs rounded border border-gray-200 focus:outline-none focus:border-indigo-400"
                    />
                </div>
            </div>

            <div ref={listRef} className="max-h-64 overflow-y-auto">
                {loading && (
                    <p className="text-xs text-gray-400 text-center py-4">Loading…</p>
                )}
                {!loading && items.length === 0 && (
                    <div className="text-center py-6">
                        <ChatBubbleLeftEllipsisIcon className="mx-auto w-7 h-7 text-gray-300 mb-1" />
                        <p className="text-xs text-gray-400">{query ? 'No matches.' : 'No canned responses.'}</p>
                    </div>
                )}
                {items.map((item, i) => (
                    <button
                        key={item.id}
                        data-idx={i}
                        onClick={() => insert(item)}
                        onMouseEnter={() => setActive(i)}
                        className={`w-full text-left px-3 py-2.5 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 ${i === active ? 'bg-indigo-50' : ''}`}
                    >
                        <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="text-xs font-medium text-gray-900 truncate flex-1">{item.title}</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${SCOPE_COLORS[item.scope]}`}>
                                {item.scope}
                            </span>
                        </div>
                        <p
                            className="text-[11px] text-gray-400 line-clamp-2 leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: item.body }}
                        />
                    </button>
                ))}
            </div>
        </div>
    );
}
