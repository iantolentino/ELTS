import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { ArrowLeftIcon, BellAlertIcon } from '@heroicons/react/24/outline';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import type { NotificationPreference } from '@/types';

interface Props {
    preferences: NotificationPreference[];
}

type PrefChannels = { in_app: boolean; email: boolean };
type PrefsMap     = Record<string, PrefChannels>;

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            role="switch"
            aria-checked={on}
            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${on ? 'bg-primary-600' : 'bg-[--color-border]'}`}
        >
            <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition-transform ${on ? 'translate-x-4' : 'translate-x-0'}`}
            />
        </button>
    );
}

function PushSection() {
    const { state, subscribe, unsubscribe } = usePushNotifications();

    const label = {
        loading:     'Checking…',
        unsupported: 'Not supported by your browser.',
        denied:      'Blocked — allow notifications in browser settings.',
        prompt:      'Get notified even when the app is closed.',
        subscribed:  'Enabled on this device.',
    }[state];

    return (
        <div className="bg-[--color-surface] border border-[--color-border] rounded-xl p-5">
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center flex-shrink-0">
                        <BellAlertIcon className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-[--color-text]">Browser Notifications</p>
                        <p className="text-xs text-[--color-text-muted] mt-0.5">{label}</p>
                    </div>
                </div>
                {state === 'prompt' && (
                    <button
                        type="button"
                        onClick={subscribe}
                        className="shrink-0 px-4 h-8 text-xs font-medium bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                    >
                        Enable
                    </button>
                )}
                {state === 'subscribed' && (
                    <button
                        type="button"
                        onClick={unsubscribe}
                        className="shrink-0 px-4 h-8 text-xs font-medium bg-[--color-surface] border border-[--color-border] text-[--color-text] rounded-lg hover:bg-[--color-bg] transition-colors"
                    >
                        Disable
                    </button>
                )}
            </div>
        </div>
    );
}

export default function NotificationPreferences({ preferences }: Props) {
    const { data, setData, put, processing, recentlySuccessful } = useForm<{ preferences: PrefsMap }>({
        preferences: Object.fromEntries(
            preferences.map(p => [p.event, { in_app: p.in_app, email: p.email }])
        ),
    });

    function toggle(event: string, channel: 'in_app' | 'email') {
        setData('preferences', {
            ...data.preferences,
            [event]: {
                ...data.preferences[event],
                [channel]: !data.preferences[event]?.[channel],
            },
        });
    }

    function submit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        put('/notifications/preferences');
    }

    return (
        <AppLayout>
            <Head title="Notification Preferences" />
            <div className="px-6 py-6 space-y-6 max-w-2xl">

                <div className="flex items-center gap-3">
                    <Link
                        href="/notifications"
                        className="p-1.5 rounded-lg text-[--color-text-muted] hover:bg-[--color-bg] transition-colors"
                    >
                        <ArrowLeftIcon className="w-4 h-4" />
                    </Link>
                    <div>
                        <h1 className="text-xl font-semibold text-[--color-text]">Notification Preferences</h1>
                        <p className="mt-0.5 text-sm text-[--color-text-muted]">Choose which notifications you receive and where.</p>
                    </div>
                </div>

                <PushSection />

                <form onSubmit={submit}>
                    <div className="bg-[--color-surface] border border-[--color-border] rounded-xl overflow-hidden">

                        {/* Header row */}
                        <div className="grid grid-cols-[1fr_auto_auto] gap-x-8 px-5 py-3 border-b border-[--color-border] bg-[--color-bg]">
                            <span className="text-xs font-medium text-[--color-text-muted] uppercase tracking-wide">Event</span>
                            <span className="text-xs font-medium text-[--color-text-muted] uppercase tracking-wide w-16 text-center">In-App</span>
                            <span className="text-xs font-medium text-[--color-text-muted] uppercase tracking-wide w-16 text-center">Email</span>
                        </div>

                        {/* Preference rows */}
                        <div className="divide-y divide-[--color-border]">
                            {preferences.map(pref => (
                                <div
                                    key={pref.event}
                                    className="grid grid-cols-[1fr_auto_auto] gap-x-8 items-center px-5 py-4"
                                >
                                    <span className="text-sm text-[--color-text]">{pref.label}</span>
                                    <div className="w-16 flex justify-center">
                                        <Toggle
                                            on={data.preferences[pref.event]?.in_app ?? true}
                                            onClick={() => toggle(pref.event, 'in_app')}
                                        />
                                    </div>
                                    <div className="w-16 flex justify-center">
                                        <Toggle
                                            on={data.preferences[pref.event]?.email ?? true}
                                            onClick={() => toggle(pref.event, 'email')}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between px-5 py-4 border-t border-[--color-border] bg-[--color-bg]">
                            {recentlySuccessful ? (
                                <span className="text-sm text-green-600 font-medium">Preferences saved.</span>
                            ) : (
                                <span />
                            )}
                            <button
                                type="submit"
                                disabled={processing}
                                className="px-5 h-9 text-sm font-medium bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
                            >
                                {processing ? 'Saving…' : 'Save preferences'}
                            </button>
                        </div>
                    </div>
                </form>

            </div>
        </AppLayout>
    );
}