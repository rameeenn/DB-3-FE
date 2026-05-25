// CardManagementTable.tsx
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
import VisitorCard from './cards/VisitorCard';
import DefenceAuthorityClubCard from './cards/DefenceAuthorityClubCard';
import SportsClubCard from './cards/SportsClubCard';
import MarinaClubCard from './cards/MarinaClub.Card';
import ZamzamaClubCard from './cards/ZamzamaClubCard';
import BeachViewClubCard from './cards/BeachViewClub';
import SunsetClubCard from './cards/SunsetClub';
import CountryGolfClubCard from './cards/CountryGolfClub';
import StaffMemberCard from './cards/StaffMemberCard';

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
  const [pageSize, setPageSize] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);
  const { data, isLoading } = useGetCardManagementListing(currentPage, pageSize);
  const [selectedUserType, setSelectedUserType] = useState('All');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewRow, setPreviewRow] = useState<CardData | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadStage, setDownloadStage] = useState<'front' | 'back' | null>(null);

  // Helper function to determine which card component to use
  const getCardComponent = (row: CardData) => {
     if (row.category === 'Club Member' && row.subCategory === 'DA Creek Club') {
      return CreekClubCard;
    }
    if (row.category === 'Club Member' && row.subCategory === 'Defence Authority Club') {
      return DefenceAuthorityClubCard;
    }
    if (row.category === 'Club Member' && row.subCategory === 'Sports Club') {
      return SportsClubCard;
    }
    if (row.category === 'Club Member' && row.subCategory === 'DA Marina Club') {
      return MarinaClubCard;
    }
    if (row.category === 'Club Member' && row.subCategory === 'DA Zamzama Club') {
      return ZamzamaClubCard;
    }
    if (row.category === 'Club Member' && row.subCategory === 'DA Beach View Club') {
      return BeachViewClubCard;
    }
    if (row.category === 'Club Member' && row.subCategory === 'DA Sunset Club') {
      return SunsetClubCard;
    }
    if (row.category === 'Club Member' && row.subCategory === 'DA Country & Golf Club') {
      return CountryGolfClubCard;
    }
    if (row.userType === 'NonMember' && (row.category === 'Resident' || row.subCategory === 'Resident' || row.subCategory === 'Commercial')) {
      return ResidentNonMemberCard;
    }
    if(row.userType === 'StaffAndMember') {
      return StaffMemberCard;
    }
    if (row.userType === 'Employee' || (row.category === 'DHA Employee' && row.subCategory !== 'StaffAndMember')) {
      return EmployeeCard;
    }
    if (row.userType === 'Visitor') {
      return VisitorCard;
    }
    
    // Default fallback
    return ResidentNonMemberCard;
  };
  
  const totalPages = data?.data?.items?.totalPages || 1;

  const handlePreview = (row: CardData) => {
    setPreviewRow(row);
    setPreviewOpen(true);
  };

  // Wait for all images in an element to load
  const waitForImages = async (element: HTMLElement): Promise<void> => {
    const images = element.querySelectorAll('img');
    const imagePromises = Array.from(images).map((img) => {
      if (img.complete) {
        return Promise.resolve();
      }
      return new Promise<void>((resolve) => {
        img.onload = () => resolve();
        img.onerror = () => resolve(); // Resolve even on error to continue
      });
    });
    await Promise.all(imagePromises);
  };

  const downloadAsJPG = async (element: HTMLElement, filename: string) => {
    try {
      // Wait for images to load
      await waitForImages(element);
      
      // Additional delay to ensure rendering
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const canvas = await html2canvas(element, {
        scale: 4,
        backgroundColor: '#ffffff',
        useCORS: true,
        allowTaint: false,
        logging: false,
        imageTimeout: 30000,
      });
      
      const link = document.createElement('a');
      link.download = `${filename}.jpg`;
      link.href = canvas.toDataURL('image/jpeg', 1.0);
      link.click();
      
      return true;
    } catch (error) {
      console.error('Error downloading image:', error);
      return false;
    }
  };

  const handleDownloadBoth = async () => {
    if (!previewRow) return;
    
    setIsDownloading(true);
    
    const fileName = `${previewRow.userName || 'Card'}_${previewRow.id?.slice(0, 8) || 'UID'}`;
    
    // Get the visible card elements
    const frontCardElement = document.querySelector('.front-card-preview') as HTMLElement;
    const backCardElement = document.querySelector('.back-card-preview') as HTMLElement;
    
    if (frontCardElement && backCardElement) {
      // Create temporary containers for cloning
      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'fixed';
      tempContainer.style.left = '-9999px';
      tempContainer.style.top = '0';
      tempContainer.style.backgroundColor = '#fff';
      document.body.appendChild(tempContainer);
      
      try {
        // Process front card
        setDownloadStage('front');
        const frontClone = frontCardElement.cloneNode(true) as HTMLElement;
        frontClone.style.width = '86mm';
        frontClone.style.height = '54mm';
        frontClone.style.margin = '0';
        frontClone.style.padding = '0';
        frontClone.style.borderRadius = '0';
        frontClone.style.boxShadow = 'none';
        tempContainer.innerHTML = '';
        tempContainer.appendChild(frontClone);
        
        await waitForImages(frontClone);
        await new Promise(resolve => setTimeout(resolve, 300));
        
        const frontCanvas = await html2canvas(frontClone, {
          scale: 4,
          backgroundColor: '#ffffff',
          useCORS: true,
          allowTaint: false,
          logging: false,
          imageTimeout: 30000,
        });
        
        const frontLink = document.createElement('a');
        frontLink.download = `${fileName}_FRONT.jpg`;
        frontLink.href = frontCanvas.toDataURL('image/jpeg', 1.0);
        frontLink.click();
        
        // Process back card
        setDownloadStage('back');
        const backClone = backCardElement.cloneNode(true) as HTMLElement;
        backClone.style.width = '86mm';
        backClone.style.height = '54mm';
        backClone.style.margin = '0';
        backClone.style.padding = '0';
        backClone.style.borderRadius = '0';
        backClone.style.boxShadow = 'none';
        tempContainer.innerHTML = '';
        tempContainer.appendChild(backClone);
        
        await waitForImages(backClone);
        await new Promise(resolve => setTimeout(resolve, 300));
        
        const backCanvas = await html2canvas(backClone, {
          scale: 4,
          backgroundColor: '#ffffff',
          useCORS: true,
          allowTaint: false,
          logging: false,
          imageTimeout: 30000,
        });
        
        const backLink = document.createElement('a');
        backLink.download = `${fileName}_BACK.jpg`;
        backLink.href = backCanvas.toDataURL('image/jpeg', 1.0);
        backLink.click();
        
      } finally {
        // Clean up
        document.body.removeChild(tempContainer);
      }
    }
    
    setDownloadStage(null);
    setIsDownloading(false);
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
      const worker = item.entityDetails?.externalWorker;
      const userFamily = item.entityDetails?.externalUserFamily;

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
        profilePictureUrl: externalUser?.profilePictureUrl || 
                         clubMember?.profileImage ||
                         parentUser?.profilePictureUrl || 
                         worker?.profilePictureUrl || 
                         worker?.profilePicture ||
                         userFamily?.profilePicture ||
                         null,
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
        totalPages={totalPages}
        rowsPerPage={pageSize}
        onRowsPerPageChange={(size) => {
          setPageSize(size);
          setCurrentPage(1);
        }}
        serverSidePagination={true}
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
            {/* Visible preview for screen */}
            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'flex-start', marginBottom: '30px' }}>
              <div className="front-card-preview" style={{ borderRadius: '12px', overflow: 'hidden', boxShadow: '0 6px 18px rgba(0,0,0,0.18)' }}>
                <CardComponent data={previewRow} side="front" />
              </div>
              <div className="back-card-preview" style={{ borderRadius: '12px', overflow: 'hidden', boxShadow: '0 6px 18px rgba(0,0,0,0.18)' }}>
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
                {isDownloading ? `Downloading ${downloadStage === 'front' ? 'Front' : downloadStage === 'back' ? 'Back' : '...'}` : 'Download Card'}
              </button>
              <button
                onClick={() => window.print()}
                style={{
                  padding: '10px 18px',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#3B82F6',
                  color: '#fff',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                Print Card
              </button>
            </div>
          </div>
        )}
      </FormModal>
    </>
  );
}