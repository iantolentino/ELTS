<?php

declare(strict_types=1);

beforeEach(fn () => seedRoles());

// ── Page access ──────────────────────────────────────────────────────────────

it('admin can access the reports overview page', function () {
    $this->actingAs(actingAsRole('admin'))
        ->get('/reports')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('Reports/Index'));
});

it('supervisor can access the reports overview page', function () {
    $this->actingAs(actingAsRole('supervisor'))
        ->get('/reports')
        ->assertOk();
});

it('client is forbidden from the reports overview page', function () {
    $this->actingAs(actingAsRole('client'))
        ->get('/reports')
        ->assertForbidden();
});

it('admin can access the custom report builder', function () {
    $this->actingAs(actingAsRole('admin'))
        ->get('/reports/custom')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('Reports/Custom'));
});

// ── PDF exports ───────────────────────────────────────────────────────────────

it('admin can download the overview report as PDF', function () {
    $this->actingAs(actingAsRole('admin'))
        ->get('/reports/export/pdf')
        ->assertOk()
        ->assertDownload();
});

it('admin can download the custom report as PDF', function () {
    $this->actingAs(actingAsRole('admin'))
        ->get('/reports/custom/export/pdf')
        ->assertOk()
        ->assertDownload();
});

// ── Excel/CSV exports ────────────────────────────────────────────────────────

it('admin can download the overview report as Excel', function () {
    $this->actingAs(actingAsRole('admin'))
        ->get('/reports/export/excel')
        ->assertOk()
        ->assertDownload();
});

it('admin can download the custom report as Excel', function () {
    $this->actingAs(actingAsRole('admin'))
        ->get('/reports/custom/export/excel')
        ->assertOk()
        ->assertDownload();
});

it('admin can download the custom report as CSV', function () {
    $this->actingAs(actingAsRole('admin'))
        ->get('/reports/custom/export/csv')
        ->assertOk()
        ->assertDownload();
});

// ── Guest is redirected ───────────────────────────────────────────────────────

it('unauthenticated user is redirected from reports page', function () {
    $this->get('/reports')->assertRedirect('/login');
});

it('unauthenticated user is redirected from export endpoints', function () {
    $this->get('/reports/export/pdf')->assertRedirect('/login');
    $this->get('/reports/export/excel')->assertRedirect('/login');
    $this->get('/reports/custom/export/csv')->assertRedirect('/login');
});
