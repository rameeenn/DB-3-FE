// app/setup/tag-approval/components/ApprovedTagsTable.tsx

'use client';
import { useEffect, useState } from 'react';
import { useGetAllRequestedTags } from 'hooks/approve-tags/useGetAllRequestedTags';
import { useApproveTag } from 'hooks/approve-tags/useApproveTag';
import { useRejectTag } from 'hooks/approve-tags/useRejectTag';
import { useCancelTag } from 'hooks/approve-tags/useCancelTag';
import DataTable from 'components/tables/DataTable';
import type { Column, Tab } from 'components/tables/DataTable';
import { StatusBadge } from 'components/tables/DataTable';
import { formatDateDisplay } from '../../../../lib/dateUtils';
import FormModal from 'components/popup/FormModal';
import WarningModal from 'components/popup/WarningModal';
import CommonEntityForm, { ProfileField, ProfileFormData } from 'components/forms/CommonEntityForm';
import { getEnumMetadata } from 'services/enum.service';
import { useFeeScales } from 'hooks/fees/useFeeScales';
import type { FeeScale } from 'types/fees.types';
import { useGetAllTagTypes } from 'hooks/tagtype/useGetAllTagTypes';

interface ApprovedTagsTableProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  onAddNew: () => void;
  addButtonLabel: string;
}

export default function ApprovedTagsTable({
  tabs,
  activeTab,
  onTabChange,
  onAddNew,
  addButtonLabel,
}: ApprovedTagsTableProps) {
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [qrApproveModalOpen, setQrApproveModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [selectedTag, setSelectedTag] = useState<any>(null);
  const [planTypeOptions, setPlanTypeOptions] = useState([{ value: '', label: 'Select Plan Type' }]);
  
  const { data, isLoading, isError, refetch } = useGetAllRequestedTags(currentPage, pageSize);
  const { mutateAsync: approveTag, isPending: isApprovePending } = useApproveTag();
  const { mutateAsync: rejectTag, isPending: isRejectPending } = useRejectTag();
  const { mutateAsync: cancelTag, isPending: isCancelPending } = useCancelTag();
  const { data: feeScaleData } = useFeeScales();
  const { data: tagTypeData } = useGetAllTagTypes();

  // Fetch plan type options
  useEffect(() => {
    async function fetchPlanTypeOptions() {
      try {
        const res = await getEnumMetadata({ EnumType: 'PlanType' });
        const planTypeEnum = res.data.enums.find((e: any) => e.name === 'PlanType');
        if (planTypeEnum) {
          setPlanTypeOptions([
            { value: '', label: 'Select Plan Type' },
            ...planTypeEnum.members.map((m: any) => ({ value: m.value.toString(), label: m.name }))
          ]);
        }
      } catch {
        // fallback
      }
    }
    fetchPlanTypeOptions();
  }, []);

  const tags = data?.data?.items ?? [];
  const totalPages = data?.data?.totalPages ?? 1;

  const isQrTag = (tagType: string) => tagType?.toLowerCase().includes('qr');

  // Get tag type ID
  const getTagTypeId = (tagType: string) => {
    const found = tagTypeData?.data?.find(
      (tt: any) => tt.name?.toLowerCase() === tagType?.toLowerCase()
    );
    return found?.id || '';
  };

  // Show QR Approve confirmation
  const showQrApproveConfirmation = (row: any) => {
    setSelectedTag(row);
    setQrApproveModalOpen(true);
  };

  // Show Reject confirmation
  const showRejectConfirmation = (row: any) => {
    setSelectedTag(row);
    setRejectModalOpen(true);
  };

  // Show Cancel confirmation
  const showCancelConfirmation = (row: any) => {
    setSelectedTag(row);
    setCancelModalOpen(true);
  };
const CustomConfirmModal = ({ isOpen, onClose, onConfirm, title, message, confirmText, confirmColor }: any) => {
  if (!isOpen) return null;
  
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '24px',
        maxWidth: '400px',
        width: '90%'
      }}>
        <h3 style={{ marginBottom: '16px' }}>{title}</h3>
        <p style={{ marginBottom: '24px' }}>{message}</p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              backgroundColor: 'white',
              color: '#374151',
              border: '1px solid #D1D5DB',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: '8px 16px',
              backgroundColor: confirmColor || '#10B981',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
  // Handle QR Approve after confirmation
  const handleQrApprove = async () => {
    if (!selectedTag) return;
    
    const tagTypeId = getTagTypeId(selectedTag.tagType);
    const payload = {
      tagApprovalRequestId: selectedTag.id,
      entityName: selectedTag.subjectName,
      entityId: selectedTag.subjectId,
      tagNumber: selectedTag.tagNumber,
      tagTypeId: tagTypeId,
      validFrom: new Date().toISOString(),
      validTo: new Date().toISOString(),
      planType: 'unknown',
      status: 0,
    };
    
    try {
      await approveTag(payload);
      setQrApproveModalOpen(false);
      setSelectedTag(null);
      refetch();
    } catch (error) {
      console.error('Approval failed:', error);
    }
  };

  // Handle Reject after confirmation
  const handleReject = async () => {
    if (!selectedTag) return;
    
    try {
      await rejectTag(selectedTag.id);
      setRejectModalOpen(false);
      setSelectedTag(null);
      refetch();
    } catch (error) {
      console.error('Reject failed:', error);
    }
  };

  // Handle Cancel after confirmation
  const handleCancel = async () => {
    if (!selectedTag) return;
    
    try {
      await cancelTag(selectedTag.id);
      setCancelModalOpen(false);
      setSelectedTag(null);
      refetch();
    } catch (error) {
      console.error('Cancel failed:', error);
    }
  };

  // Handle Approve for RFID/UHF tags (show modal)
  const handleRfidApprove = (row: any) => {
    setSelectedTag(row);
    setApproveModalOpen(true);
  };

  // Handle Approve from modal
  const handleApproveSubmit = async (formData: ProfileFormData) => {
    if (!selectedTag) return;
    
    const tagTypeId = getTagTypeId(selectedTag.tagType);
    
    const payload: any = {
      tagApprovalRequestId: selectedTag.id,
      entityName: selectedTag.subjectName,
      entityId: selectedTag.subjectId,
      tagNumber: formData.tagNumber || selectedTag.tagNumber,
      tagTypeId: tagTypeId,
      validFrom: new Date().toISOString(),
      validTo: new Date().toISOString(),
      planType: formData.planType || 'unknown',
      status: 0,
      feeScaleId: formData.feeScaleId,
      trialPeriod: formData.trialPeriod || 'Unknown',
    };

    try {
      await approveTag(payload);
      setApproveModalOpen(false);
      setSelectedTag(null);
      refetch();
    } catch (error) {
      console.error('Approval failed:', error);
      throw error;
    }
  };

  // Fee scale options
  const feeScaleOptions = [
    { value: '', label: 'Select Fee Scale' },
    ...((feeScaleData?.data?.map((fee: FeeScale) => ({ value: fee.id, label: fee.name })) || [])),
  ];

  // Modal fields for RFID/UHF
  const approveFields: ProfileField[] = [
    { 
      name: 'tagNumber', 
      label: 'Tag Number', 
      type: 'text', 
      required: true, 
      placeholder: 'Enter Tag Number'
    },
    {
      name: 'feeScaleId',
      label: 'Fee Scale',
      type: 'select',
      required: true,
      placeholder: 'Select Fee Scale',
      options: feeScaleOptions,
    },
    {
      name: 'planType',
      label: 'Plan Type',
      type: 'select',
      required: true,
      placeholder: 'Select Plan Type',
      options: planTypeOptions,
    },
    {
      name: 'trialPeriod',
      label: 'Trial Period',
      type: 'select',
      required: true,
      placeholder: 'Select Trial Period',
      options: [
        { value: 'Unknown', label: 'Unknown' },
        { value: 'SevenDays', label: '7 Days' },
        { value: 'FifteenDays', label: '15 Days' },
        { value: 'ThirtyDays', label: '30 Days' },
      ],
    },
  ];

  const columns: Column<any>[] = [
    { key: 'hierarchicalId', header: 'User ID', render: (_: any, row: any) => row?.hierarchicalId || '-' },
    { key: 'parentUserName', header: 'Username', render: (value: string) => value || '-' },
    { key: 'subjectName', header: 'Entity Name', render: (value: string) => value || '-' },
    { key: 'subjectType', header: 'Entity Type', render: (value: string) => value || '-' },
    { key: 'tagType', header: 'Tag Type', render: (value: string) => value || '-' },
    { key: 'tagNumber', header: 'Tag Number', render: (value: string) => value || '-' },
    { key: 'feeScale', header: 'Fee Scale', render: (value: string) => value || '-' },
    { key: 'planType', header: 'Plan Type', render: (value: string) => value || '-' },
    { key: 'category', header: 'Category', render: (value: string) => value || '-' },
    { key: 'subCategory', header: 'Sub Category', render: (value: string) => value || '-' },
    { key: 'validFrom', header: 'Valid From', render: (value: string) => formatDateDisplay(value) },
    { key: 'validTo', header: 'Valid To', render: (value: string) => formatDateDisplay(value) },
    { key: 'notes', header: 'Notes', render: (value: string) => value || '-' },
    { key: 'status', header: 'Status', render: (value: string) => <StatusBadge status={value} /> },
    {
      key: 'actions',
      header: 'Actions',
      render: (_: any, row: any) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => isQrTag(row.tagType) ? showQrApproveConfirmation(row) : handleRfidApprove(row)}
            style={{
              background: '#10B981',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              padding: '4px 12px',
              cursor: 'pointer'
            }}
          >
            Approve
          </button>
          <button
            onClick={() => showRejectConfirmation(row)}
            style={{
              background: '#EF4444',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              padding: '4px 12px',
              cursor: 'pointer'
            }}
          >
            Reject
          </button>
          <button
            onClick={() => showCancelConfirmation(row)}
            style={{
              background: '#6B7280',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              padding: '4px 12px',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
        </div>
      ),
    },
  ];

  if (isError) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: 'red' }}>
        Failed to load approved tags.
      </div>
    );
  }

  return (
    <>
      <DataTable
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={onTabChange}
        columns={columns}
        data={tags}
        loading={isLoading}
        showAddButton={true}
        onAddClick={onAddNew}
        addButtonLabel={addButtonLabel}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        rowsPerPage={pageSize}
        onRowsPerPageChange={(size) => {
          setPageSize(size);
          setCurrentPage(1);
        }}
        serverSidePagination={true}
        columnFilterKeys={['tagType', 'category', 'status']}
        getRowStatus={(row) => row?.status as 'Active' | 'Inactive' | 'Pending' | undefined}
        enableSorting={true}
        enableFiltering={true}
      />


{/* QR Approve Confirmation Modal */}
<CustomConfirmModal
  isOpen={qrApproveModalOpen}
  onClose={() => {
    setQrApproveModalOpen(false);
    setSelectedTag(null);
  }}
  onConfirm={handleQrApprove}
  title="Approve QR Tag"
  message={`Are you sure you want to approve the QR tag for "${selectedTag?.subjectName}"?`}
  confirmText="Approve"
  confirmColor="#10B981"  // Green
/>

{/* Reject Confirmation Modal */}
<WarningModal
  isOpen={rejectModalOpen}
  onClose={() => {
    setRejectModalOpen(false);
    setSelectedTag(null);
  }}
  onConfirm={handleReject}
  title="Reject Tag"
  message={`Are you sure you want to reject the tag for "${selectedTag?.subjectName}"?`}
  confirmText="Reject"
/>

{/* Cancel Confirmation Modal */}
<CustomConfirmModal
  isOpen={cancelModalOpen}
  onClose={() => {
    setCancelModalOpen(false);
    setSelectedTag(null);
  }}
  onConfirm={handleCancel}
  title="Cancel Tag"
  message={`Are you sure you want to cancel the tag for "${selectedTag?.subjectName}"?`}
  confirmText="Cancel"
  confirmColor="#6B7280"  // Gray
/>

      {/* Approval Modal for RFID/UHF tags */}
      <FormModal
        isOpen={approveModalOpen}
        onClose={() => {
          setApproveModalOpen(false);
          setSelectedTag(null);
        }}
        title="Approve Tag"
      >
        <CommonEntityForm
          title="Please provide approval details"
          onSave={handleApproveSubmit}
          onCancel={() => {
            setApproveModalOpen(false);
            setSelectedTag(null);
          }}
          fields={approveFields}
          saveButtonText="Approve"
          initialValues={{
            tagNumber: selectedTag?.tagNumber || '',
            feeScaleId: '',
            planType: '',
            trialPeriod: 'Unknown',
          }}
          loading={isApprovePending}
          successTitle="Tag Approved"
          successMessage="The tag has been approved successfully."
        />
      </FormModal>
    </>
  );
}