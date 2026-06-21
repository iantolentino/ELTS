<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Tags\CreateTagRequest;
use App\Http\Requests\Admin\Tags\UpdateTagRequest;
use App\Models\TicketTag;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TagController extends Controller
{
    public function index(Request $request): Response
    {
        abort_unless($request->user()?->hasRole(['super_admin', 'admin', 'supervisor']), 403);

        $tags = TicketTag::withCount('tickets')->orderBy('name')->get();

        return Inertia::render('Admin/Tags/Index', ['tags' => $tags]);
    }

    public function store(CreateTagRequest $request): RedirectResponse
    {
        TicketTag::create($request->validated());

        return back()->with('success', 'Tag created.');
    }

    public function update(UpdateTagRequest $request, TicketTag $tag): RedirectResponse
    {
        $tag->update($request->validated());

        return back()->with('success', 'Tag updated.');
    }

    public function destroy(Request $request, TicketTag $tag): RedirectResponse
    {
        abort_unless($request->user()?->hasRole(['super_admin', 'admin', 'supervisor']), 403);

        $tag->tickets()->detach();
        $tag->delete();

        return back()->with('success', 'Tag deleted.');
    }
}
