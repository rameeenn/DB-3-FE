// CardManagementTable.tsx (updated version)
'use client';

import { useMemo, useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import html2canvas from 'html2canvas';

import DataTable, { Column, Tab } from '../../../../components/tables/DataTable';
import CircularButton from '../../../../components/ui/CircularButton';
import FormModal from '../../../../components/popup/FormModal';
import { useGetCardManagementListing } from '../../../../hooks/newcard/useGetCardManagementListing';
import ResidentNonMemberCard from './cards/ResidentNonMemberCard';
import EmployeeCard from './cards/EmployeeCard';
import CreekClubCard from './cards/CreekClubCard';
import { CardData } from './cards/types';

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
  const frontCardRef = useRef<HTMLDivElement>(null);
  const backCardRef = useRef<HTMLDivElement>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUserType, setSelectedUserType] = useState('All');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewRow, setPreviewRow] = useState<CardData | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const { data, isLoading } = useGetCardManagementListing();

  // Helper function to determine which card component to use
  const getCardComponent = (row: CardData) => {
    if (row.userType === 'NonMember' && row.category === 'Resident') {
      return ResidentNonMemberCard;
    }
    if (row.userType === 'Employee') {
      return EmployeeCard;
    }
     if (row.category === 'Club Member' || row.category === 'DA Creek Club') {
    return CreekClubCard;
  }
    // if (row.userType === 'Member' && row.category === 'Resident') {
    //   return ResidentMemberCard;
    // }
    
    // Default fallback
    return ResidentNonMemberCard;
  };

  const handlePreview = (row: CardData) => {
    setPreviewRow(row);
    setPreviewOpen(true);
  };

  const downloadAsJPG = async (element: HTMLElement, filename: string) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const canvas = await html2canvas(element, {
        scale: 4,
        backgroundColor: '#ffffff',
        useCORS: true,
        allowTaint: false,
        logging: false,
        imageTimeout: 0,
        onclone: (clonedDoc) => {
          const images = clonedDoc.querySelectorAll('img');
          images.forEach((img: HTMLImageElement) => {
            if (img.src && img.src.includes('gwp.dhakarachi.org')) {
              img.crossOrigin = 'anonymous';
              img.onerror = () => {
                img.src = '/fallback-profile.png';
              };
            }
          });
        }
      });
      
      const link = document.createElement('a');
      link.download = `${filename}.jpg`;
      link.href = canvas.toDataURL('image/jpeg', 1.0);
      link.click();
    } catch (error) {
      console.error('Error downloading image:', error);
    }
  };

  const handleDownloadFront = async () => {
    if (frontCardRef.current) {
      setIsDownloading(true);
      const fileName = `${previewRow?.userName || 'Card'}_${previewRow?.id?.slice(0, 8) || 'UID'}_FRONT`;
      await downloadAsJPG(frontCardRef.current, fileName);
      setIsDownloading(false);
    }
  };

  const handleDownloadBack = async () => {
    if (backCardRef.current) {
      setIsDownloading(true);
      const fileName = `${previewRow?.userName || 'Card'}_${previewRow?.id?.slice(0, 8) || 'UID'}_BACK`;
      await downloadAsJPG(backCardRef.current, fileName);
      setIsDownloading(false);
    }
  };

  const handleDownloadBoth = async () => {
    await handleDownloadFront();
    setTimeout(async () => {
      await handleDownloadBack();
    }, 1000);
  };

  const userTypeOptions = useMemo(() => {
    const items = data?.data?.items?.items ?? [];
    const uniqueTypes = Array.from(
      new Set(items.map((item: any) => item.entityDetails?.externalUser?.userType))
    );
    return ['All', ...uniqueTypes.filter(Boolean)];
  }, [data]);

  const tableData: CardData[] = useMemo(() => {
    const items = data?.data?.items?.items ?? [];

    return items.map((item: any) => {
      const externalUser = item.entityDetails?.externalUser;
      const clubMember = item.entityDetails?.externalClubMember;
      const parentUser = item.entityDetails?.parentUser;

      const formatFullDate = (dateString: string): string => {
        if (!dateString || dateString === '0001-01-01T00:00:00') return '-';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '-';
        return date.toLocaleDateString();
      };

      return {
        id: item.id,
        userName: externalUser?.name || clubMember?.username || parentUser?.name || item.userName || '-',
        cnic: externalUser?.cnic || clubMember?.cnic || parentUser?.cnic || '-',
        userType: externalUser?.userType || parentUser?.userType || item.entityName || '-',
        category: clubMember?.category || parentUser?.category || externalUser?.category || '-',
        subCategory: clubMember?.subCategory || parentUser?.subCategory || externalUser?.subCategory || '-',
        cardIssueDate: formatFullDate(externalUser?.cardIssueDate || parentUser?.cardIssueDate || clubMember?.validFrom || item.validFrom),
        cardExpiryDate: formatFullDate(externalUser?.cardExpiryDate || parentUser?.cardExpiryDate || clubMember?.validTo || item.validTo),
        address: externalUser?.address || parentUser?.address || '-',
        profilePictureUrl: externalUser?.profilePictureUrl || clubMember?.profilePictureUrl || parentUser?.profilePictureUrl || null,
        staffNo: externalUser?.staffNo || clubMember?.staffNo || parentUser?.staffNo || '-',
        hierarchicalId: externalUser?.hierarchicalId || clubMember?.hierarchicalId || parentUser?.hierarchicalId || item.hierarchicalId || '-',
        memberNo: clubMember?.memberNo || '-',
      };
    });
  }, [data]);

  const columns: Column<CardData>[] = [
    { key: 'profilePictureUrl', header: 'Profile', render: (value) => value ? <img src={value} alt="Profile" style={{ width: 32, height: 32, borderRadius: '50%' }} /> : '-' },
    { key: 'userName', header: 'User Name' },
    { key: 'cnic', header: 'CNIC' },
    { key: 'userType', header: 'User Type' },
    { key: 'category', header: 'Category' },
    { key: 'subCategory', header: 'Sub Category' },
    { key: 'staffNo', header: 'Staff No' },
    { key: 'hierarchicalId', header: 'Hierarchical ID' },
    { key: 'memberNo', header: 'Membership No' },
    { key: 'cardIssueDate', header: 'Issue Date' },
    { key: 'cardExpiryDate', header: 'Expiry Date' },
    { key: 'address', header: 'Address' },
    {
      key: 'action',
      header: 'Action',
      render: (_, row) => (
        <div style={{ display: 'flex', gap: '6px' }}>
          <CircularButton
            imagePath="/icons/Edit Button.svg"
            imageAlt="Preview"
            width={32}
            height={32}
            onClick={() => handlePreview(row)}
          />
        </div>
      ),
    },
  ];

  // Get the appropriate card component for the selected row
  const CardComponent = previewRow ? getCardComponent(previewRow) : null;

  return (
    <>
      <DataTable<CardData>
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
        userTypeOptions={userTypeOptions}
        selectedUserType={selectedUserType}
        onUserTypeChange={setSelectedUserType}
      />

      <FormModal
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title="Card Preview"
      >
        {previewRow && CardComponent && (
          <div style={{ maxHeight: '70vh', overflowY: 'auto', padding: '20px' }}>
            {/* Hidden cards for download */}
            <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
              <div ref={frontCardRef}>
                <CardComponent data={previewRow} side="front" isDownload={true} />
              </div>
              <div ref={backCardRef} style={{ marginTop: '20px' }}>
                <CardComponent data={previewRow} side="back" isDownload={true} />
              </div>
            </div>

            {/* Visible preview for screen */}
            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'flex-start', marginBottom: '30px' }}>
              <div style={{ borderRadius: '12px', overflow: 'hidden', boxShadow: '0 6px 18px rgba(0,0,0,0.18)' }}>
                <CardComponent data={previewRow} side="front" />
              </div>
              <div style={{ borderRadius: '12px', overflow: 'hidden', boxShadow: '0 6px 18px rgba(0,0,0,0.18)' }}>
                <CardComponent data={previewRow} side="back" />
              </div>
            </div>

            {/* BUTTONS */}
            <div style={{ 
              display: 'flex', 
              gap: '12px', 
              justifyContent: 'center',
              position: 'sticky',
              bottom: 0,
              background: 'white',
              padding: '15px 0',
              borderTop: '1px solid #e5e7eb',
              marginTop: '10px'
            }}>
              <button
                onClick={handleDownloadBoth}
                disabled={isDownloading}
                style={{
                  padding: '10px 18px',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#10B981',
                  color: '#fff',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                {isDownloading ? 'Downloading...' : 'Download Card'}
              </button>
            </div>
          </div>
        )}
      </FormModal>
    </>
  );
}