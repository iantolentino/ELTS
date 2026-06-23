import { useEffect, useRef, useState } from 'react';
import { BookOpenIcon, XMarkIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';

interface Suggestion {
    id:            number;
    title:         string;
    slug:          string;
    excerpt:       string | null;
    category_name: string | null;
}

interface Props {
    query: string;
}

export default function KbSuggestions({ query }: Props) {
    const [results, setResults]   = useState<Suggestion[]>([]);
    const [loading, setLoading]   = useState(false);
    const [dismissed, setDismissed] = useState(false);
    const abortRef = useRef<AbortController | null>(null);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Reset dismissed state when query changes meaningfully
    useEffect(() => {
        setDismissed(false);
    }, [query.slice(0, 20)]);

    useEffect(() => {
        if (timerRef.current) clearTimeout(timerRef.current);
        if (abortRef.current) abortRef.current.abort();

        const trimmed = query.trim();

        if (trimmed.length < 3) {
            setResults([]);
            return;
        }

        timerRef.current = setTimeout(async () => {
            const controller = new AbortController();
            abortRef.current = controller;
            setLoading(true);

            try {
                const res = await fetch(
                    `/kb/search?q=${encodeURIComponent(trimmed)}`,
                    { signal: controller.signal }
                );
                if (res.ok) {
                    const data: Suggestion[] = await res.json();
                    setResults(data.slice(0, 5));
                }
            } catch {
                // aborted or network error — silently ignore
            } finally {
                setLoading(false);
            }
        }, 400);

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [query]);

    if (dismissed || (results.length === 0 && !loading)) return null;

    return (
        <div className="mt-2 rounded-lg border border-primary-200 bg-primary-50 text-sm overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 border-b border-primary-200">
                <div className="flex items-center gap-1.5 text-primary-700 font-medium text-xs">
                    <BookOpenIcon className="w-3.5 h-3.5" />
                    {loading ? 'Searching Help Center…' : 'These articles might help before you submit:'}
                </div>
                <button
                    type="button"
                    onClick={() => setDismissed(true)}
                    className="p-0.5 rounded text-primary-400 hover:text-primary-700 transition-colors"
                    aria-label="Dismiss suggestions"
                >
                    <XMarkIcon className="w-3.5 h-3.5" />
                </button>
            </div>

            {!loading && results.length > 0 && (
                <ul className="divide-y divide-primary-100">
                    {results.map(r => (
                        <li key={r.id}>
                            <a
                                href={`/kb/articles/${r.slug}`}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-start gap-2 px-3 py-2 hover:bg-primary-100 transition-colors group"
                            >
                                <div className="flex-1 min-w-0">
                                    <span className="font-medium text-primary-800 group-hover:underline line-clamp-1">
                                        {r.title}
                                    </span>
                                    {r.category_name && (
                                        <span className="ml-1.5 text-[10px] text-primary-500">{r.category_name}</span>
                                    )}
                                    {r.excerpt && (
                                        <p className="text-xs text-primary-600 line-clamp-1 mt-0.5">{r.excerpt}</p>
                                    )}
                                </div>
                                <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5 text-primary-400 flex-shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </a>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
