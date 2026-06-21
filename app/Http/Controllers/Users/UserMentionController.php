<?php

declare(strict_types=1);

namespace App\Http\Controllers\Users;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserMentionController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $q = (string) $request->string('q')->trim();

        if (strlen($q) < 1) {
            return response()->json([]);
        }

        $users = User::role(['super_admin', 'admin', 'supervisor', 'agent'])
            ->where(fn ($query) => $query
                ->where('name', 'like', "%{$q}%")
                ->orWhere('email', 'like', "%{$q}%")
            )
            ->where('is_active', true)
            ->limit(8)
            ->get(['id', 'name', 'email']);

        return response()->json($users->map(fn ($u) => [
            'id'    => $u->id,
            'label' => $u->name,
            'email' => $u->email,
        ]));
    }
}
