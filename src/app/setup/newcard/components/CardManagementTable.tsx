'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import DataTable, { Column, Tab, StatusBadge } from '../../../../components/tables/DataTable';
import CircularButton from '../../../../components/ui/CircularButton';
import WarningModal from '../../../../components/popup/WarningModal';

// 🔹 API Hook (you will create this)
import { useGetCardManagementListing } from '../../../../hooks/newcard/useGetCardManagementListing';

interface CardRow {
  id: string;
  userName: string;
  cnic: string;
  userType: string;
  category: string;
  subCategory: string;
  cardIssueDate: string;
  cardExpiryDate: string;
  status: 'Active' | 'Inactive';
}

interface Props {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  onAddNew: () => void;
  addButtonLabel: string;
  searchParams?: any;
}

export default function CardManagementTable({
  tabs,
  activeTab,
  onTabChange,
  addButtonLabel,
}: Props) {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<CardRow | null>(null);
  const [selectedUserType, setSelectedUserType] = useState('All');
  // 🔹 API CALL
  const { data, isLoading } = useGetCardManagementListing();
  const userTypeOptions = useMemo(() => {
  const items = data?.data?.users?.items || [];

  const uniqueTypes = Array.from(
    new Set(items.map((item: any) => item.userType))
  );

  return ['All', ...uniqueTypes];
}, [data]);
  // 🔹 MAP API → TABLE FORMAT
  const tableData: CardRow[] = useMemo(() => {
  const items = data?.data?.users?.items || [];

  let mappedData = items.map((item: any) => ({
    id: item.id,
    userName: item.userName,
    cnic: item.cnic,
    userType: item.userType,
    category: item.category ?? '-',
    subCategory: item.subCategory ?? '-',
    cardIssueDate: item.cardIssueDate
      ? new Date(item.cardIssueDate).toLocaleDateString()
      : '-',
    cardExpiryDate: item.cardExpiryDate
      ? new Date(item.cardExpiryDate).toLocaleDateString()
      : '-',
    status: 'Active' as const,
  }));

  if (selectedUserType !== 'All') {
    mappedData = mappedData.filter(
      (item) => item.userType === selectedUserType
    );
  }

  return mappedData;
}, [data, selectedUserType]);

  const handleEdit = (row: CardRow) => {
    router.push(`/setup/card-management?modal=edit&id=${row.id}`);
  };

  const handleDelete = (row: CardRow) => {
    setSelectedRow(row);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    // call delete API later
    setDeleteModalOpen(false);
    setSelectedRow(null);
  };

  const columns: Column<CardRow>[] = [
    { key: 'userName', header: 'User Name' },
    { key: 'cnic', header: 'CNIC' },
    { key: 'userType', header: 'User Type' },
    { key: 'category', header: 'Category' },
    { key: 'subCategory', header: 'Sub Category' },
    { key: 'cardIssueDate', header: 'Issue Date' },
    { key: 'cardExpiryDate', header: 'Expiry Date' },

    {
      key: 'status',
      header: 'Status',
      render: (value) => <StatusBadge status={value} />,
    },

    {
      key: 'action',
      header: 'Action',
      render: (_, row) => (
        <div style={{ display: 'flex', gap: '6px' }}>
          <CircularButton
            imagePath="/icons/Edit Button.svg"
            imageAlt="Edit"
            width={32}
            height={32}
            onClick={() => handleEdit(row)}
          />
          <CircularButton
            imagePath="/icons/DeleteButton.svg"
            imageAlt="Delete"
            width={32}
            height={32}
            onClick={() => handleDelete(row)}
          />
        </div>
      ),
    },
  ];

  return (
    <>
      <DataTable<CardRow>
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={onTabChange}
        columns={columns}
        data={tableData}
        loading={isLoading}
        showAddButton={true}
        addButtonLabel={addButtonLabel}
        onAddClick={() => router.push('/setup/card-management?modal=add')}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        getRowStatus={(row) => row.status}
        userTypeOptions={userTypeOptions}
        selectedUserType={selectedUserType}
        onUserTypeChange={setSelectedUserType}
      />

      <WarningModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Card"
        message={`Are you sure you want to delete ${selectedRow?.userName}?`}
      />
    </>
  );
}