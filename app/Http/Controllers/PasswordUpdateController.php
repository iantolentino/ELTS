<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\Profile\PasswordUpdateRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;

class PasswordUpdateController extends Controller
{
    public function update(PasswordUpdateRequest $request): RedirectResponse
    {
        Auth::user()->update([
            'password' => $request->string('password'),
        ]);

        return back()->with('success', 'Password updated successfully.');
    }
}
