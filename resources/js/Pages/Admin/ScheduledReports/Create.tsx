import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import ScheduledReportForm from './Form';

export default function CreateScheduledReport() {
    const form = useForm({
        name:         '',
        type:         'overview' as 'overview' | 'custom',
        format:       'excel' as 'pdf' | 'excel' | 'csv',
        schedule:     'weekly' as 'daily' | 'weekly' | 'monthly',
        day_of_week:  1,
        day_of_month: 1,
        time_of_day:  '08:00',
        recipients:   '',
        params: {
            metric:   'volume',
            group_by: 'day',
        },
        is_active: true,
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        form.post('/admin/scheduled-reports');
    }

    return (
        <AppLayout>
            <Head title="New Scheduled Report" />
            <div className="px-6 py-6 max-w-2xl">
                <h1 className="text-xl font-semibold text-[--color-text] mb-6">New Scheduled Report</h1>
                <ScheduledReportForm form={form} onSubmit={submit} submitLabel="Create Schedule" />
            </div>
        </AppLayout>
    );
}
