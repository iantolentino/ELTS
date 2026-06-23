import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import ScheduledReportForm from './Form';

interface ScheduledReport {
    id:            number;
    name:          string;
    type:          'overview' | 'custom';
    format:        'pdf' | 'excel' | 'csv';
    schedule:      'daily' | 'weekly' | 'monthly';
    day_of_week:   number | null;
    day_of_month:  number | null;
    time_of_day:   string;
    recipients:    string[];
    params:        { metric?: string; group_by?: string } | null;
    is_active:     boolean;
}

interface Props { report: ScheduledReport; }

export default function EditScheduledReport({ report }: Props) {
    const form = useForm({
        name:         report.name,
        type:         report.type,
        format:       report.format,
        schedule:     report.schedule,
        day_of_week:  report.day_of_week  ?? 1,
        day_of_month: report.day_of_month ?? 1,
        time_of_day:  report.time_of_day.slice(0, 5),
        recipients:   report.recipients.join('\n'),
        params: {
            metric:   report.params?.metric   ?? 'volume',
            group_by: report.params?.group_by ?? 'day',
        },
        is_active: report.is_active,
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        form.put(`/admin/scheduled-reports/${report.id}`);
    }

    return (
        <AppLayout>
            <Head title="Edit Scheduled Report" />
            <div className="px-6 py-6 max-w-2xl">
                <h1 className="text-xl font-semibold text-[--color-text] mb-6">Edit Scheduled Report</h1>
                <ScheduledReportForm form={form} onSubmit={submit} submitLabel="Save Changes" />
            </div>
        </AppLayout>
    );
}
