'use client';

import { useSearchParams } from 'next/navigation';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import { useSetup } from '../SetupContext';
import CardManagementTable from './components/CardManagementTable';

export default function NewCardPage() {
  const searchParams = useSearchParams();
  const { tabs, activeTab, handleTabChange, handleAddNew, addButtonLabel } = useSetup();

  return (
    <DashboardLayout pageTitle="Card Management" showBackButton={false}>
      <CardManagementTable
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onAddNew={handleAddNew}
        addButtonLabel={addButtonLabel}
        searchParams={searchParams}
      />
    </DashboardLayout>
  );
}