'use client';

import { useState } from 'react';
import DashboardLayout from 'components/layout/DashboardLayout';
import DhaXHalconTable from './components/DhaXHalconTable';

export default function DhaXHalconPage() {
  const [activeTab, setActiveTab] = useState('dha-x-halcon');
  
  const tabs = [
    { key: 'dha-x-halcon', label: 'DHA x Halcon' }
  ];

  return (
    <DashboardLayout pageTitle="DHA x Halcon" showBackButton={false}>
      <DhaXHalconTable 
        tabs={[]}
        activeTab={""}
        onTabChange={() => {}}
      />
    </DashboardLayout>
  );
}