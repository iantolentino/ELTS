import { useRef, useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { CameraIcon, ShieldCheckIcon, ShieldExclamationIcon } from '@heroicons/react/24/outline';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import AppLayout from '@/Layouts/AppLayout';
import { Button, Input, Card, Badge } from '@/Components/UI';

interface ProfileUser {
    name: string;
    email: string;
    phone: string | null;
    job_title: string | null;
    timezone: string;
    locale: string;
    avatar_url: string | null;
    two_factor_enabled: boolean;
}

interface Props {
    profileUser: ProfileUser;
}

const TIMEZONES = [
    'UTC',
    'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
    'America/Anchorage', 'Pacific/Honolulu',
    'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Europe/Moscow',
    'Asia/Dubai', 'Asia/Karachi', 'Asia/Kolkata', 'Asia/Dhaka',
    'Asia/Bangkok', 'Asia/Singapore', 'Asia/Manila', 'Asia/Shanghai',
    'Asia/Tokyo', 'Asia/Seoul',
    'Australia/Sydney', 'Pacific/Auckland',
];

function getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

export default function ProfileEdit({ profileUser }: Props) {
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [showNewPw, setShowNewPw]         = useState(false);
    const [showConfPw, setShowConfPw]       = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    const profileForm = useForm({
        name:      profileUser.name,
        phone:     profileUser.phone ?? '',
        job_title: profileUser.job_title ?? '',
        timezone:  profileUser.timezone,
        locale:    profileUser.locale,
        avatar:    null as File | null,
    });

    const passwordForm = useForm({
        current_password:      '',
        password:              '',
        password_confirmation: '',
    });

    function handleAvatar(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (file) {
            profileForm.setData('avatar', file);
            setAvatarPreview(URL.createObjectURL(file));
        }
    }

    function submitProfile(e: React.FormEvent) {
        e.preventDefault();
        profileForm.patch('/profile', { forceFormData: true });
    }

    function submitPassword(e: React.FormEvent) {
        e.preventDefault();
        passwordForm.patch('/profile/password', {
            onSuccess: () => passwordForm.reset(),
        });
    }

    return (
        <AppLayout>
            <Head title="My Profile" />

            <div className="max-w-2xl mx-auto py-8 px-4 space-y-6">
                <h1 className="text-xl font-semibold text-[--color-text]">My Profile</h1>

                {/* ── Profile Information ── */}
                <Card header={<span className="text-sm font-semibold">Profile Information</span>}>
                    <form onSubmit={submitProfile} className="space-y-5">
                        {/* Avatar */}
                        <div className="flex items-center gap-4">
                            <button
                                type="button"
                                onClick={() => fileRef.current?.click()}
                                className="relative group shrink-0"
                            >
                                {avatarPreview || profileUser.avatar_url ? (
                                    <img
                                        src={avatarPreview ?? profileUser.avatar_url!}
                                        alt="Avatar"
                                        className="w-20 h-20 rounded-full object-cover border-2 border-[--color-border]"
                                    />
                                ) : (
                                    <div className="w-20 h-20 rounded-full bg-primary-600 flex items-center justify-center text-white font-semibold text-xl border-2 border-[--color-border]">
                                        {getInitials(profileUser.name)}
                                    </div>
                                )}
                                <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                    <CameraIcon className="w-6 h-6 text-white" />
                                </div>
                            </button>
                            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleAvatar} />
                            <div className="text-sm text-[--color-text-muted]">
                                <p>Click to upload a new photo</p>
                                <p className="text-xs mt-0.5">JPEG, PNG or WebP · max 2 MB</p>
                                {profileForm.errors.avatar && (
                                    <p className="text-xs text-danger-500 mt-1">{profileForm.errors.avatar}</p>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Input
                                label="Full name"
                                value={profileForm.data.name}
                                onChange={e => profileForm.setData('name', e.target.value)}
                                error={profileForm.errors.name}
                                required
                            />
                            <Input
                                label="Email address"
                                type="email"
                                value={profileUser.email}
                                readOnly
                                className="bg-[--color-bg] cursor-not-allowed"
                                hint="Email cannot be changed here."
                            />
                            <Input
                                label="Phone"
                                type="tel"
                                value={profileForm.data.phone}
                                onChange={e => profileForm.setData('phone', e.target.value)}
                                error={profileForm.errors.phone}
                                placeholder="+1 555 000 0000"
                            />
                            <Input
                                label="Job title"
                                value={profileForm.data.job_title}
                                onChange={e => profileForm.setData('job_title', e.target.value)}
                                error={profileForm.errors.job_title}
                                placeholder="Support Agent"
                            />
                            <div className="flex flex-col gap-1">
                                <label className="text-sm font-medium text-[--color-text]">Timezone</label>
                                <select
                                    value={profileForm.data.timezone}
                                    onChange={e => profileForm.setData('timezone', e.target.value)}
                                    className="w-full h-9 rounded-lg border border-[--color-border] bg-white text-sm px-3 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                >
                                    {TIMEZONES.map(tz => (
                                        <option key={tz} value={tz}>{tz.replace('_', ' ')}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-sm font-medium text-[--color-text]">Language</label>
                                <select
                                    value={profileForm.data.locale}
                                    onChange={e => profileForm.setData('locale', e.target.value)}
                                    className="w-full h-9 rounded-lg border border-[--color-border] bg-white text-sm px-3 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                >
                                    <option value="en">English</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <Button type="submit" loading={profileForm.processing}>Save profile</Button>
                        </div>
                    </form>
                </Card>

                {/* ── Change Password ── */}
                <Card header={<span className="text-sm font-semibold">Change Password</span>}>
                    <form onSubmit={submitPassword} className="space-y-4">
                        <Input
                            label="Current password"
                            type="password"
                            value={passwordForm.data.current_password}
                            onChange={e => passwordForm.setData('current_password', e.target.value)}
                            error={passwordForm.errors.current_password}
                            required
                            autoComplete="current-password"
                        />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* New password */}
                            <div className="flex flex-col gap-1">
                                <label className="text-sm font-medium text-[--color-text]">New password <span className="text-danger-500">*</span></label>
                                <div className="relative">
                                    <input
                                        type={showNewPw ? 'text' : 'password'}
                                        value={passwordForm.data.password}
                                        onChange={e => passwordForm.setData('password', e.target.value)}
                                        autoComplete="new-password"
                                        required
                                        className={`w-full h-9 rounded-lg border text-sm bg-white pl-3 pr-10 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${passwordForm.errors.password ? 'border-danger-400' : 'border-[--color-border]'}`}
                                    />
                                    <button type="button" tabIndex={-1} onClick={() => setShowNewPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[--color-text-muted]">
                                        {showNewPw ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                                    </button>
                                </div>
                                {passwordForm.errors.password && <p className="text-xs text-danger-500">{passwordForm.errors.password}</p>}
                            </div>
                            {/* Confirm password */}
                            <div className="flex flex-col gap-1">
                                <label className="text-sm font-medium text-[--color-text]">Confirm password <span className="text-danger-500">*</span></label>
                                <div className="relative">
                                    <input
                                        type={showConfPw ? 'text' : 'password'}
                                        value={passwordForm.data.password_confirmation}
                                        onChange={e => passwordForm.setData('password_confirmation', e.target.value)}
                                        autoComplete="new-password"
                                        required
                                        className={`w-full h-9 rounded-lg border text-sm bg-white pl-3 pr-10 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${passwordForm.errors.password_confirmation ? 'border-danger-400' : 'border-[--color-border]'}`}
                                    />
                                    <button type="button" tabIndex={-1} onClick={() => setShowConfPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[--color-text-muted]">
                                        {showConfPw ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>
                        </div>
                        <p className="text-xs text-[--color-text-muted]">Minimum 8 characters with letters and numbers.</p>
                        <div className="flex justify-end">
                            <Button type="submit" loading={passwordForm.processing}>Update password</Button>
                        </div>
                    </form>
                </Card>

                {/* ── Security ── */}
                <Card header={<span className="text-sm font-semibold">Security</span>}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            {profileUser.two_factor_enabled
                                ? <ShieldCheckIcon className="w-5 h-5 text-success-500" />
                                : <ShieldExclamationIcon className="w-5 h-5 text-warning-500" />}
                            <div>
                                <p className="text-sm font-medium text-[--color-text]">Two-factor authentication</p>
                                <p className="text-xs text-[--color-text-muted]">
                                    {profileUser.two_factor_enabled
                                        ? 'Your account is protected with an authenticator app.'
                                        : 'Not enabled — your account is less secure.'}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                            <Badge variant={profileUser.two_factor_enabled ? 'success' : 'warning'}>
                                {profileUser.two_factor_enabled ? 'Enabled' : 'Disabled'}
                            </Badge>
                            <Link
                                href="/user/two-factor-setup"
                                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                            >
                                Manage →
                            </Link>
                        </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-[--color-border] flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-[--color-text]">Active sessions</p>
                            <p className="text-xs text-[--color-text-muted]">View and revoke devices signed into your account.</p>
                        </div>
                        <Link
                            href="/profile/sessions"
                            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                        >
                            Manage →
                        </Link>
                    </div>

                    <div className="mt-4 pt-4 border-t border-[--color-border] flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-[--color-text]">Login history</p>
                            <p className="text-xs text-[--color-text-muted]">Review recent sign-in activity on your account.</p>
                        </div>
                        <Link
                            href="/profile/login-history"
                            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                        >
                            View →
                        </Link>
                    </div>
                </Card>
            </div>
        </AppLayout>
    );
}
