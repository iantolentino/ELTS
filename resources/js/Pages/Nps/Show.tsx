import { Head, useForm, usePage } from '@inertiajs/react';
import { CheckCircleIcon, ClockIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import PublicLayout from '@/Layouts/PublicLayout';
import type { SharedProps } from '@/types';

interface Survey {
    token:        string;
    score:        number | null;
    category:     'promoter' | 'passive' | 'detractor' | null;
    responded_at: string | null;
    is_expired:   boolean;
}

interface Props {
    survey:    Survey;
    pre_score: number | null;
}

const NPS_SCORES = Array.from({ length: 11 }, (_, i) => i); // 0–10

function scoreColor(score: number): string {
    if (score <= 6) return 'bg-red-100 border-red-300 text-red-700 hover:bg-red-200';
    if (score <= 8) return 'bg-yellow-100 border-yellow-300 text-yellow-700 hover:bg-yellow-200';
    return 'bg-green-100 border-green-300 text-green-700 hover:bg-green-200';
}

function scoreColorSelected(score: number): string {
    if (score <= 6) return 'bg-red-500 border-red-600 text-white scale-110 shadow-md';
    if (score <= 8) return 'bg-yellow-400 border-yellow-500 text-yellow-900 scale-110 shadow-md';
    return 'bg-green-500 border-green-600 text-white scale-110 shadow-md';
}

function categoryLabel(cat: string | null): string {
    if (cat === 'promoter') return 'Promoter (9–10) — Thank you for your enthusiasm!';
    if (cat === 'passive')  return 'Passive (7–8) — We appreciate your honest feedback.';
    if (cat === 'detractor') return 'Detractor (0–6) — We\'re sorry to hear that. We\'ll work to improve.';
    return '';
}

function categoryColor(cat: string | null): string {
    if (cat === 'promoter')  return 'text-green-700';
    if (cat === 'passive')   return 'text-yellow-700';
    if (cat === 'detractor') return 'text-red-700';
    return '';
}

function NpsScale({ value, onChange }: { value: number | null; onChange: (s: number) => void }) {
    return (
        <div className="my-6">
            <div className="flex items-center justify-between gap-1.5 flex-wrap">
                {NPS_SCORES.map(s => (
                    <button
                        key={s}
                        type="button"
                        onClick={() => onChange(s)}
                        className={`flex-1 min-w-[36px] max-w-[52px] py-3 rounded-lg border-2 font-bold text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary-500
                            ${value === s ? scoreColorSelected(s) : scoreColor(s)}`}
                    >
                        {s}
                    </button>
                ))}
            </div>
            <div className="flex justify-between mt-2 text-xs text-[--color-text-muted]">
                <span>Not at all likely</span>
                <span>Extremely likely</span>
            </div>
        </div>
    );
}

export default function NpsShow({ survey, pre_score }: Props) {
    const { props } = usePage<SharedProps>();
    const flash = props.flash;

    const { data, setData, post, processing, errors } = useForm({
        score:   pre_score ?? (null as number | null),
        comment: '',
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        post(route('nps.store', survey.token));
    }

    const alreadyResponded = survey.responded_at !== null;
    const isExpired        = survey.is_expired;

    return (
        <PublicLayout title="Quick Survey">
            <Head title="How likely are you to recommend us?" />

            <div className="min-h-[60vh] flex items-center justify-center px-4 py-12">
                <div className="w-full max-w-xl">

                    {/* Already responded / success */}
                    {(flash?.success || alreadyResponded) && !isExpired && (
                        <div className="bg-success-50 border border-success-200 rounded-xl p-6 text-center">
                            <CheckCircleIcon className="w-10 h-10 text-success-500 mx-auto mb-3" />
                            <h2 className="text-lg font-semibold text-success-700 mb-1">
                                {flash?.success ?? 'Response already submitted'}
                            </h2>
                            {survey.score !== null && (
                                <>
                                    <p className="text-success-600 text-sm mb-1">
                                        You gave us a score of <strong>{survey.score} / 10</strong>
                                    </p>
                                    <p className={`text-sm font-medium ${categoryColor(survey.category)}`}>
                                        {categoryLabel(survey.category)}
                                    </p>
                                </>
                            )}
                            <p className="text-xs text-success-500 mt-3">Your feedback helps us grow.</p>
                        </div>
                    )}

                    {/* Expired */}
                    {isExpired && !alreadyResponded && (
                        <div className="bg-warning-50 border border-warning-200 rounded-xl p-6 text-center">
                            <ClockIcon className="w-10 h-10 text-warning-500 mx-auto mb-3" />
                            <h2 className="text-lg font-semibold text-warning-700 mb-1">Survey Expired</h2>
                            <p className="text-sm text-warning-600">This survey link has expired. Thank you for your time.</p>
                        </div>
                    )}

                    {/* Survey form */}
                    {!alreadyResponded && !isExpired && !flash?.success && (
                        <div className="bg-[--color-card] border border-[--color-border] rounded-xl p-6">
                            <h1 className="text-xl font-bold text-[--color-text] text-center mb-1">
                                How likely are you to recommend us?
                            </h1>
                            <p className="text-sm text-[--color-text-muted] text-center mb-2">
                                Rate on a scale from 0 (not at all) to 10 (extremely likely).
                            </p>

                            <form onSubmit={handleSubmit}>
                                <NpsScale
                                    value={data.score}
                                    onChange={s => setData('score', s)}
                                />

                                {data.score !== null && (
                                    <p className={`text-xs font-medium text-center mb-4 ${categoryColor(data.score <= 6 ? 'detractor' : data.score <= 8 ? 'passive' : 'promoter')}`}>
                                        {data.score <= 6
                                            ? 'Detractor — We\'re sorry you feel this way.'
                                            : data.score <= 8
                                            ? 'Passive — Thank you for your honest feedback.'
                                            : 'Promoter — Glad you love what we do!'}
                                    </p>
                                )}

                                {errors.score && (
                                    <div className="flex items-center gap-1.5 text-danger-500 text-xs mb-3 justify-center">
                                        <ExclamationCircleIcon className="w-4 h-4" />
                                        {errors.score}
                                    </div>
                                )}

                                <div className="mt-2">
                                    <label className="block text-sm font-medium text-[--color-text] mb-1.5">
                                        What's the main reason for your score?{' '}
                                        <span className="text-[--color-text-subtle] font-normal">(optional)</span>
                                    </label>
                                    <textarea
                                        value={data.comment}
                                        onChange={e => setData('comment', e.target.value)}
                                        rows={3}
                                        placeholder="Tell us what we could do better, or what you love about our service…"
                                        className="w-full rounded-lg border border-[--color-border] bg-[--color-bg] px-3 py-2 text-sm text-[--color-text] focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={processing || data.score === null}
                                    className="mt-5 w-full py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg text-sm disabled:opacity-50 transition-colors"
                                >
                                    {processing ? 'Submitting…' : 'Submit Score'}
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </PublicLayout>
    );
}
