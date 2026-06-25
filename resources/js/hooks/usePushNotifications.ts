import { router } from '@inertiajs/react';
import { useEffect, useState } from 'react';

const VAPID_PUBLIC_KEY = (import.meta.env.VITE_VAPID_PUBLIC_KEY as string) ?? '';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64  = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const raw     = atob(base64);
    return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
}

export type PushState = 'unsupported' | 'denied' | 'prompt' | 'subscribed' | 'loading';

export function usePushNotifications() {
    const [state, setState] = useState<PushState>('loading');

    useEffect(() => {
        if (!('serviceWorker' in navigator) || !('PushManager' in window) || !VAPID_PUBLIC_KEY) {
            setState('unsupported');
            return;
        }
        if (Notification.permission === 'denied') {
            setState('denied');
            return;
        }
        navigator.serviceWorker.register('/sw.js').then(reg =>
            reg.pushManager.getSubscription()
        ).then(sub => {
            setState(sub ? 'subscribed' : 'prompt');
        }).catch(() => setState('prompt'));
    }, []);

    async function subscribe(): Promise<void> {
        if (!VAPID_PUBLIC_KEY) return;
        setState('loading');
        try {
            const reg = await navigator.serviceWorker.register('/sw.js');
            const sub = await reg.pushManager.subscribe({
                userVisibleOnly:      true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
            });
            const json = sub.toJSON();
            router.post('/push/subscriptions', {
                endpoint:         json.endpoint         ?? '',
                public_key:       json.keys?.p256dh     ?? '',
                auth_token:       json.keys?.auth        ?? '',
                content_encoding: 'aesgcm',
            }, {
                preserveScroll: true,
                preserveState:  true,
                onSuccess:      () => setState('subscribed'),
                onError:        () => setState('prompt'),
            });
        } catch {
            setState(Notification.permission === 'denied' ? 'denied' : 'prompt');
        }
    }

    async function unsubscribe(): Promise<void> {
        setState('loading');
        try {
            const reg = await navigator.serviceWorker.ready;
            const sub = await reg.pushManager.getSubscription();
            if (sub) {
                const endpoint = sub.endpoint;
                await sub.unsubscribe();
                router.delete('/push/subscriptions', {
                    data:          { endpoint },
                    preserveScroll: true,
                    preserveState:  true,
                    onSuccess:      () => setState('prompt'),
                    onError:        () => setState('subscribed'),
                });
            } else {
                setState('prompt');
            }
        } catch {
            setState('subscribed');
        }
    }

    return { state, subscribe, unsubscribe };
}