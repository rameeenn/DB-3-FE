// app/setup/tag-approval/page.tsx
'use client';
import { useState } from 'react';
import DashboardLayout from 'components/layout/DashboardLayout';
import ApprovedTagsTable from './components/ApprovedTagsTable';

export default function TagApprovalPage() {
  const [activeTab, setActiveTab] = useState('pending');

  return (
    <DashboardLayout pageTitle="Approved Tags">
      <div style={{ padding: '20px' }}>
        <ApprovedTagsTable
          tabs={[]}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onAddNew={() => {}}
          addButtonLabel="Add New Tag"
        />
      </div>
    </DashboardLayout>
  );
}