'use client';
import DashboardLayout from 'components/layout/DashboardLayout';
import InvoiceTable from './components/InvoiceTable';
import { useState } from 'react';

export default function InvoicePage() {
  const [activeTab, setActiveTab] = useState('invoice'); // Fixed: using array destructuring
  const tabs = [
    { key: 'invoice', label: 'Invoice' }
  ];

  return (
    <DashboardLayout pageTitle="Invoice" showBackButton={false}>
      <InvoiceTable
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onAddNew={() => {}}
        addButtonLabel="Add Invoice"
      />
    </DashboardLayout>
  );
}