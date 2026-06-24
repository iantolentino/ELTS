import { Head, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { CheckCircleIcon, ClockIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import PublicLayout from '@/Layouts/PublicLayout';
import type { SharedProps } from '@/types';

interface Survey {
    token:          string;
    ticket_number:  string;
    ticket_subject: string;
    score:          number | null;
    responded_at:   string | null;
    is_expired:     boolean;
}

interface Props {
    survey:    Survey;
    pre_score: number | null;
}

const RATINGS = [
    { score: 1, emoji: '😞', label: 'Very dissatisfied' },
    { score: 2, emoji: '😕', label: 'Dissatisfied' },
    { score: 3, emoji: '😐', label: 'Neutral' },
    { score: 4, emoji: '🙂', label: 'Satisfied' },
    { score: 5, emoji: '😄', label: 'Very satisfied' },
];

function StarRating({ value, onChange }: { value: number | null; onChange: (s: number) => void }) {
    const [hovered, setHovered] = useState<number | null>(null);
    const active = hovered ?? value;

    return (
        <div className="flex items-center justify-center gap-3 my-6">
            {RATINGS.map(r => (
                <button
                    key={r.score}
                    type="button"
                    onClick={() => onChange(r.score)}
                    onMouseEnter={() => setHovered(r.score)}
                    onMouseLeave={() => setHovered(null)}
                    title={r.label}
                    className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all focus:outline-none focus:ring-2 focus:ring-primary-500
                        ${active === r.score
                            ? 'border-primary-500 bg-primary-50 scale-110 shadow-sm'
                            : 'border-[--color-border] bg-[--color-card] hover:border-primary-300 hover:scale-105'}`}
                >
                    <span className="text-3xl leading-none">{r.emoji}</span>
                    <span className="text-[10px] font-medium text-[--color-text-muted] w-16 text-center leading-tight">{r.label}</span>
                </button>
            ))}
        </div>
    );
}

export default function CsatShow({ survey, pre_score }: Props) {
    const { props } = usePage<SharedProps>();
    const flash = props.flash;

    const { data, setData, post, processing, errors } = useForm({
        score:   pre_score ?? (null as number | null),
        comment: '',
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        post(route('csat.store', survey.token));
    }

    const alreadyResponded = survey.responded_at !== null;
    const isExpired        = survey.is_expired;

    return (
        <PublicLayout title="Rate Your Experience">
            <Head title="Rate Your Experience" />

            <div className="min-h-[60vh] flex items-center justify-center px-4 py-12">
                <div className="w-full max-w-lg">

                    {/* Ticket context */}
                    <div className="bg-[--color-card] border border-[--color-border] rounded-xl p-5 mb-6">
                        <p className="text-xs font-semibold text-[--color-text-subtle] uppercase tracking-wider mb-1">
                            Ticket #{survey.ticket_number}
                        </p>
                        <p className="font-medium text-[--color-text]">{survey.ticket_subject}</p>
                    </div>

                    {/* Already responded */}
                    {(flash?.success || alreadyResponded) && !isExpired && (
                        <div className="bg-success-50 border border-success-200 rounded-xl p-6 text-center">
                            <CheckCircleIcon className="w-10 h-10 text-success-500 mx-auto mb-3" />
                            <h2 className="text-lg font-semibold text-success-700 mb-1">
                                {flash?.success ?? 'Feedback already submitted'}
                            </h2>
                            {survey.score && (
                                <p className="text-success-600 text-sm">
                                    You rated us {RATINGS.find(r => r.score === survey.score)?.emoji}{' '}
                                    <strong>{RATINGS.find(r => r.score === survey.score)?.label}</strong>
                                </p>
                            )}
                            <p className="text-xs text-success-500 mt-3">Your feedback helps us improve our support.</p>
                        </div>
                    )}

                    {/* Expired */}
                    {isExpired && !alreadyResponded && (
                        <div className="bg-warning-50 border border-warning-200 rounded-xl p-6 text-center">
                            <ClockIcon className="w-10 h-10 text-warning-500 mx-auto mb-3" />
                            <h2 className="text-lg font-semibold text-warning-700 mb-1">Survey Expired</h2>
                            <p className="text-sm text-warning-600">This feedback link has expired. Thank you for your time.</p>
                        </div>
                    )}

                    {/* Rating form */}
                    {!alreadyResponded && !isExpired && !flash?.success && (
                        <div className="bg-[--color-card] border border-[--color-border] rounded-xl p-6">
                            <h1 className="text-xl font-bold text-[--color-text] text-center mb-1">How did we do?</h1>
                            <p className="text-sm text-[--color-text-muted] text-center">Rate your experience with our support team.</p>

                            <form onSubmit={handleSubmit}>
                                <StarRating
                                    value={data.score}
                                    onChange={s => setData('score', s)}
                                />
                                {errors.score && (
                                    <div className="flex items-center gap-1.5 text-danger-500 text-xs mb-3 justify-center">
                                        <ExclamationCircleIcon className="w-4 h-4" />
                                        {errors.score}
                                    </div>
                                )}

                                <div className="mt-4">
                                    <label className="block text-sm font-medium text-[--color-text] mb-1.5">
                                        Additional comments <span className="text-[--color-text-subtle] font-normal">(optional)</span>
                                    </label>
                                    <textarea
                                        value={data.comment}
                                        onChange={e => setData('comment', e.target.value)}
                                        rows={3}
                                        placeholder="Tell us what went well or what we could improve…"
                                        className="w-full rounded-lg border border-[--color-border] bg-[--color-bg] px-3 py-2 text-sm text-[--color-text] focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={processing || data.score === null}
                                    className="mt-5 w-full py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg text-sm disabled:opacity-50 transition-colors"
                                >
                                    {processing ? 'Submitting…' : 'Submit Feedback'}
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </PublicLayout>
    );
}
