<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\UpdateAvailabilityRequest;
use App\Services\UserService;
use Illuminate\Http\RedirectResponse;

class AvailabilityController extends Controller
{
    public function __construct(
        private readonly UserService $userService,
    ) {}

    public function update(UpdateAvailabilityRequest $request): RedirectResponse
    {
        $this->userService->updateAvailability(
            $request->user(),
            $request->string('status')->toString(),
        );

        return back();
    }
}
