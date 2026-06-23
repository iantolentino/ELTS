<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\KnowledgeCategoryRequest;
use App\Models\KnowledgeCategory;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class KnowledgeCategoryController extends Controller
{
    public function index(): Response
    {
        Gate::authorize('viewAny', KnowledgeCategory::class);

        $categories = KnowledgeCategory::with('parent:id,name')
            ->withCount([
                'articles as published_count' => fn ($q) => $q->where('status', 'published'),
                'articles as total_count',
            ])
            ->orderByRaw('COALESCE(parent_id, id)')
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get()
            ->map(fn (KnowledgeCategory $c) => [
                'id'              => $c->id,
                'name'            => $c->name,
                'slug'            => $c->slug,
                'description'     => $c->description,
                'icon'            => $c->icon,
                'parent_id'       => $c->parent_id,
                'parent'          => $c->parent ? ['id' => $c->parent->id, 'name' => $c->parent->name] : null,
                'sort_order'      => $c->sort_order,
                'is_active'       => $c->is_active,
                'published_count' => $c->published_count,
                'total_count'     => $c->total_count,
                'can_edit'        => Gate::allows('update', KnowledgeCategory::class),
                'can_delete'      => Gate::allows('delete', KnowledgeCategory::class),
            ]);

        return Inertia::render('Admin/KnowledgeBase/Categories/Index', [
            'categories' => $categories,
            'can_create' => Gate::allows('create', KnowledgeCategory::class),
        ]);
    }

    public function store(KnowledgeCategoryRequest $request): RedirectResponse
    {
        Gate::authorize('create', KnowledgeCategory::class);

        KnowledgeCategory::create(array_merge(
            $request->validated(),
            ['created_by' => Auth::id()]
        ));

        return back()->with('success', 'Category created.');
    }

    public function update(KnowledgeCategoryRequest $request, KnowledgeCategory $knowledgeCategory): RedirectResponse
    {
        Gate::authorize('update', KnowledgeCategory::class);

        $knowledgeCategory->update($request->validated());

        return back()->with('success', 'Category updated.');
    }

    public function destroy(KnowledgeCategory $knowledgeCategory): RedirectResponse
    {
        Gate::authorize('delete', KnowledgeCategory::class);

        // Promote children to top-level before deleting
        $knowledgeCategory->children()->update(['parent_id' => null]);
        $knowledgeCategory->delete();

        return back()->with('success', 'Category deleted.');
    }
}
