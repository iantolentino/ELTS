import { Head } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import AssetForm from './Form';

interface AssetData {
    id:                   number;
    name:                 string;
    asset_tag:            string;
    type:                 string;
    status:               string;
    serial_number:        string | null;
    make:                 string | null;
    model:                string | null;
    purchase_date:        string | null;
    purchase_price:       string | null;
    warranty_expires_at:  string | null;
    location:             string | null;
    notes:                string | null;
    assigned_to:          number | null;
}

interface Props {
    asset:       AssetData;
    agents:      { id: number; name: string }[];
    asset_types: string[];
}

export default function AssetEdit({ asset, agents, asset_types }: Props) {
    return (
        <AppLayout>
            <Head title={`Edit — ${asset.name}`} />
            <AssetForm
                initialData={{
                    name:                asset.name,
                    asset_tag:           asset.asset_tag,
                    type:                asset.type,
                    status:              asset.status,
                    serial_number:       asset.serial_number ?? '',
                    make:                asset.make ?? '',
                    model:               asset.model ?? '',
                    purchase_date:       asset.purchase_date ?? '',
                    purchase_price:      asset.purchase_price ?? '',
                    warranty_expires_at: asset.warranty_expires_at ?? '',
                    location:            asset.location ?? '',
                    notes:               asset.notes ?? '',
                    assigned_to:         asset.assigned_to ? String(asset.assigned_to) : '',
                }}
                agents={agents}
                asset_types={asset_types}
                submitUrl={`/admin/assets/${asset.id}`}
                method="put"
                title={`Edit — ${asset.name}`}
                assetId={asset.id}
            />
        </AppLayout>
    );
}
