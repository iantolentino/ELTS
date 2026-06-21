<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\CustomFields\CreateCustomFieldRequest;
use App\Http\Requests\Admin\CustomFields\UpdateCustomFieldRequest;
use App\Models\CustomField;
use App\Models\TicketCategory;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CustomFieldController extends Controller
{
    public function index(Request $request): Response
    {
        abort_unless($request->user()?->hasRole(['super_admin', 'admin']), 403);

        return Inertia::render('Admin/CustomFields/Index', [
            'fields'     => CustomField::with('category:id,name')->withCount('values')->orderBy('sort_order')->get(),
            'categories' => TicketCategory::where('is_active', true)->orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function store(CreateCustomFieldRequest $request): RedirectResponse
    {
        CustomField::create(array_merge(['sort_order' => 0, 'is_active' => true, 'is_required' => false], $request->validated()));

        return back()->with('success', 'Custom field created.');
    }

    public function update(UpdateCustomFieldRequest $request, CustomField $customField): RedirectResponse
    {
        $customField->update($request->validated());

        return back()->with('success', 'Custom field updated.');
    }

    public function destroy(Request $request, CustomField $customField): RedirectResponse
    {
        abort_unless($request->user()?->hasRole(['super_admin', 'admin']), 403);

        $customField->values()->delete();
        $customField->delete();

        return back()->with('success', 'Custom field deleted.');
    }
}
