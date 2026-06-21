# RESOURCES & REFERENCES
> Official documentation and key references for the tech stack.

---

## OFFICIAL DOCS

| Technology | Documentation URL |
|---|---|
| Laravel 11 | https://laravel.com/docs/11.x |
| Inertia.js | https://inertiajs.com |
| React 18 | https://react.dev |
| TypeScript | https://www.typescriptlang.org/docs |
| Tailwind CSS | https://tailwindcss.com/docs |
| Recharts | https://recharts.org/en-US/api |
| Tiptap | https://tiptap.dev/docs |
| Headless UI | https://headlessui.com |
| Heroicons | https://heroicons.com |
| spatie/laravel-permission | https://spatie.be/docs/laravel-permission |
| spatie/laravel-activitylog | https://spatie.be/docs/laravel-activitylog |
| DomPDF | https://github.com/barryvdh/laravel-dompdf |
| Maatwebsite Excel | https://laravel-excel.com/docs |
| webklex/laravel-imap | https://github.com/Webklex/laravel-imap |
| pragmarx/google2fa | https://github.com/antonioribeiro/google2fa-laravel |
| Scribe | https://scribe.knuckles.wtf |
| Pest PHP | https://pestphp.com/docs |

---

## KEY PATTERNS REFERENCE

### Repository Pattern in Laravel
- Bind interface to implementation in `AppServiceProvider`
- Inject interface via constructor (not concrete class)
- Pattern: `RepositoryInterface` → `EloquentRepository`

### Inertia.js Shared Data
- Use `HandleInertiaRequests` middleware to share auth user, permissions, notifications to all pages
- Access via `usePage().props` in React

### Laravel Queues (database driver)
- Run `php artisan queue:table && php artisan migrate` to create jobs table
- Dispatch: `SendTicketEmail::dispatch($ticket)->onQueue('emails')`
- cPanel cron fallback: `php artisan queue:work --stop-when-empty` every minute

### Laravel Scheduler on cPanel
- Add one cron job in cPanel: `* * * * * php /path/to/artisan schedule:run`
- Define schedules in `app/Console/Kernel.php` or `routes/console.php` (Laravel 11)

### spatie/laravel-activitylog with Observers
```php
// In Observer
public function updated(Ticket $ticket): void {
    activity()->performedOn($ticket)->causedBy(auth()->user())
        ->withProperties(['old' => $ticket->getOriginal(), 'new' => $ticket->getChanges()])
        ->log('updated');
}
```

### Inertia Form Handling
```tsx
const { data, setData, post, processing, errors } = useForm({ subject: '', body: '' });
```

### Tiptap with @mention
- Use `@tiptap/extension-mention` with a custom suggestion component
- Filter agents list client-side as user types
