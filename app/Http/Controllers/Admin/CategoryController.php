<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Categories\CreateCategoryRequest;
use App\Http\Requests\Admin\Categories\UpdateCategoryRequest;
use App\Models\TicketCategory;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CategoryController extends Controller
{
    public function index(Request $request): Response
    {
        abort_unless($request->user()?->hasRole(['super_admin', 'admin', 'supervisor']), 403);

        $categories = TicketCategory::withCount(['tickets', 'children'])
            ->with('parent:id,name')
            ->orderBy('parent_id')
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();

        return Inertia::render('Admin/Categories/Index', ['categories' => $categories]);
    }

    public function store(CreateCategoryRequest $request): RedirectResponse
    {
        TicketCategory::create(array_merge(['sort_order' => 0, 'is_active' => true], $request->validated()));

        return back()->with('success', 'Category created.');
    }

    public function update(UpdateCategoryRequest $request, TicketCategory $category): RedirectResponse
    {
        $category->update($request->validated());

        return back()->with('success', 'Category updated.');
    }

    public function destroy(Request $request, TicketCategory $category): RedirectResponse
    {
        abort_unless($request->user()?->hasRole(['super_admin', 'admin', 'supervisor']), 403);

        $category->children()->update(['parent_id' => null]);
        $category->tickets()->update(['category_id' => null]);
        $category->delete();

        return back()->with('success', 'Category deleted.');
    }
}
