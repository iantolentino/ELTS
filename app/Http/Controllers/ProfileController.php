<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\Profile\ProfileRequest;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    public function edit(): Response
    {
        /** @var User $user */
        $user = Auth::user();

        return Inertia::render('Profile/Edit', [
            'profileUser' => [
                'name'               => $user->name,
                'email'              => $user->email,
                'phone'              => $user->phone,
                'job_title'          => $user->job_title,
                'timezone'           => $user->timezone ?? 'UTC',
                'locale'             => $user->locale ?? 'en',
                'avatar_url'         => $user->avatar
                    ? Storage::disk('public')->url($user->avatar)
                    : null,
                'two_factor_enabled' => !is_null($user->two_factor_confirmed_at),
            ],
        ]);
    }

    public function update(ProfileRequest $request): RedirectResponse
    {
        /** @var User $user */
        $user = Auth::user();

        $data = $request->only('name', 'phone', 'job_title', 'timezone', 'locale');

        if ($request->hasFile('avatar')) {
            if ($user->avatar) {
                Storage::disk('public')->delete($user->avatar);
            }
            $data['avatar'] = $request->file('avatar')->store("avatars/{$user->id}", 'public');
        }

        $user->update($data);

        return back()->with('success', 'Profile updated successfully.');
    }
}
