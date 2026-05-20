'use client';

import DashboardLayout from 'components/layout/DashboardLayout';
import DhaXHalconTable from './components/DhaXHalconTable';

export default function DhaXHalconPage() {
  return (
    <DashboardLayout pageTitle="DHA x Halcon" showBackButton={false}>
      <DhaXHalconTable />
    </DashboardLayout>
  );
}