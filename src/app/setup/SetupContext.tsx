'use client';
import React, { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Tab } from '@/components/tables/DataTable';
import { SETUP_TABS, getAddButtonLabel, ROUTE_MAP } from './setupConfig';

interface SetupContextType {
  activeTab: string;
  tabs: Tab[];
  addButtonLabel: string;
  handleTabChange: (tabKey: string) => void;
  handleAddNew: () => void;
}

const SetupContext = React.createContext<SetupContextType | undefined>(undefined);

export const SetupProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<string>('cp-agent');
  const router = useRouter();

  useEffect(() => {
    const savedTab = localStorage.getItem('activeTab');
    if (savedTab) {
      setActiveTab(savedTab);
    }
  }, []);

  const handleTabChange = (tabKey: string) => {
    setActiveTab(tabKey);
    localStorage.setItem('activeTab', tabKey);
    router.push(`/setup/${tabKey}`);
  };

  const handleAddNew = () => {
    router.push(ROUTE_MAP[activeTab] || '/setup');
  };

  const value: SetupContextType = {
    activeTab,
    tabs: [],
    addButtonLabel: getAddButtonLabel(activeTab),
    handleTabChange,
    handleAddNew,
  };

  return <SetupContext.Provider value={value}>{children}</SetupContext.Provider>;
};

export const useSetup = () => {
  const context = React.useContext(SetupContext);
  if (!context) {
    throw new Error('useSetup must be used within SetupProvider');
  }
  return context;
};
