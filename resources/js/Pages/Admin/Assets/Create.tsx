import { Head } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import AssetForm from './Form';

interface Props {
    agents:      { id: number; name: string }[];
    asset_types: string[];
}

export default function AssetCreate({ agents, asset_types }: Props) {
    return (
        <AppLayout>
            <Head title="New Asset" />
            <AssetForm
                agents={agents}
                asset_types={asset_types}
                submitUrl="/admin/assets"
                method="post"
                title="New Asset"
            />
        </AppLayout>
    );
}
