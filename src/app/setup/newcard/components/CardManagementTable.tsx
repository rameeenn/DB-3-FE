'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import DataTable, {
  Column,
  Tab,
} from '../../../../components/tables/DataTable';

import CircularButton from '../../../../components/ui/CircularButton';
import FormModal from '../../../../components/popup/FormModal';

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
  address: string;
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

  const [selectedUserType, setSelectedUserType] = useState('All');

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewRow, setPreviewRow] = useState<CardRow | null>(null);

  const { data, isLoading } = useGetCardManagementListing();

  const handlePreview = (row: CardRow) => {
    setPreviewRow(row);
    setPreviewOpen(true);
  };

  const handlePrint = () => {
    window.print();
  };

  const userTypeOptions = useMemo(() => {
  const items = data?.data?.items?.items ?? [];

  const uniqueTypes = Array.from(
    new Set(items.map((item: any) => item.entityDetails?.externalUser?.userType))
  );

  return ['All', ...uniqueTypes.filter(Boolean)];
}, [data]);

  const tableData: CardRow[] = useMemo(() => {
  const items = data?.data?.items?.items ?? [];

  return items.map((item: any) => {
    const externalUser = item.entityDetails?.externalUser;
    const clubMember = item.entityDetails?.externalClubMember;
    const parentUser = item.entityDetails?.parentUser;

    const name =
      externalUser?.name ||
      clubMember?.username ||
      parentUser?.name ||
      item.userName ||
      '-';

    const cnic =
      externalUser?.cnic ||
      clubMember?.cnic ||
      parentUser?.cnic ||
      '-';

    const userType =
      externalUser?.userType ||
      parentUser?.userType ||
      item.entityName ||
      '-';

    const category =
      clubMember?.category ||
      parentUser?.category ||
      externalUser?.category ||
      '-';

    const subCategory =
      clubMember?.subCategory ||
      parentUser?.subCategory ||
      externalUser?.subCategory ||
      '-';

    const issue =
      externalUser?.cardIssueDate ||
      parentUser?.cardIssueDate ||
      clubMember?.validFrom ||
      item.validFrom;

    const expiry =
      externalUser?.cardExpiryDate ||
      parentUser?.cardExpiryDate ||
      clubMember?.validTo ||
      item.validTo;

    return {
      id: item.id,
      userName: name,
      cnic,
      userType,
      category,
      subCategory,
      cardIssueDate: issue && issue !== '0001-01-01T00:00:00'
        ? new Date(issue).toLocaleDateString()
        : '-',
      cardExpiryDate: expiry && expiry !== '0001-01-01T00:00:00'
        ? new Date(expiry).toLocaleDateString()
        : '-',
      address:
        externalUser?.address ||
        parentUser?.address ||
        '-',
    };
  });
}, [data, selectedUserType]);

  const columns: Column<CardRow>[] = [
    { key: 'userName', header: 'User Name' },
    { key: 'cnic', header: 'CNIC' },
    { key: 'userType', header: 'User Type' },
    { key: 'category', header: 'Category' },
    { key: 'subCategory', header: 'Sub Category' },
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

  return (
    <>
      <style jsx global>{`
        @media print {
  @page {
    size: 86mm 54mm;   /* PVC CARD SIZE */
    margin: 0;
  }

  body {
    margin: 0;
    padding: 0;
  }

  body * {
    visibility: hidden;
  }

  #printable-cards,
  #printable-cards * {
    visibility: visible;
  }

  #printable-cards {
    position: absolute;
    left: 0;
    top: 0;
    width: 86mm;
    height: 54mm;
    margin: 0;
    padding: 0;
  }

  .print-card {
    width: 86mm !important;
    height: 54mm !important;
    page-break-after: always;
    margin: 0 !important;
    box-shadow: none !important;
  }

  button {
    display: none !important;
  }
}
      `}</style>

      <DataTable<CardRow>
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={onTabChange}
        columns={columns}
        data={tableData}
        loading={isLoading}
        showAddButton={true}
        addButtonLabel={addButtonLabel}
        onAddClick={() =>
          router.push('/setup/card-management?modal=add')
        }
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        userTypeOptions={userTypeOptions}
        selectedUserType={selectedUserType}
        onUserTypeChange={setSelectedUserType}
      />

      <FormModal
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title="Resident Non Member Card Preview"
      >
        {previewRow && (
          <div
  id="printable-cards"
  style={{
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    alignItems: 'center',
  }}
>
  {/* CARDS ROW */}
  <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'flex-start', }}>
    {/* FRONT CARD */}
    <div
  className="print-card"
  style={{
    position: 'relative',
    width: '86mm',
    height: '54mm',
    overflow: 'hidden',
    borderRadius: '12px',
    backgroundImage:
      "url('/card-templates/resident/ResidentNonMember_front.svg')",
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    boxShadow: '0 6px 18px rgba(0,0,0,0.18)',
  }}
>
  <div
    style={{
      color: '#e2c172',
      fontFamily: 'Arial',
    }}
  >
    {/* CARD HOLDER */}
    <div
      style={{
        position: 'absolute',
        top: '29mm', // ⬆ moved down (was 24mm)
        left: '6mm',
        fontSize: '2.3mm',
        fontWeight: 100,
        letterSpacing: '0.4px',
      }}
    >
      Card Holder
    </div>

    {/* USER NAME */}
    <div
      style={{
        position: 'absolute',
        top: '32.5mm', // ⬆ moved down (was 27.5mm)
        left: '6mm',
        width: '42mm',

        fontSize: '3mm',
        fontWeight: 500,

        overflow: 'hidden',
        whiteSpace: 'nowrap',
        textOverflow: 'ellipsis',
      }}
    >
      {previewRow.userName || 'My Name'}
    </div>

    {/* LABELS */}
    <div
      style={{
        position: 'absolute',
        top: '40mm', // ⬆ moved down (was 36mm)
        left: '6mm',
        display: 'flex',
        gap: '10mm',

        fontSize: '1.9mm',
        fontWeight: 100,
        letterSpacing: '0.2px',
      }}
    >
      <span>Card Issue</span>
      <span>Valid Thru</span>
    </div>

    {/* VALUES */}
    <div
      style={{
        position: 'absolute',
        top: '43.2mm', // ⬆ moved down (was 39.2mm)
        left: '6mm',
        display: 'flex',
        gap: '12.5mm',

        fontSize: '3mm',
        fontWeight: 200,
      }}
    >
      <span>12/26</span>
      <span>12/27</span>
    </div>
  </div>

  {/* USER IMAGE */}
  <img
    src="https://i.pravatar.cc/400?img=12"
    alt="User"
    style={{
      position: 'absolute',

      right: '5.3mm',
      top: '27.5mm', // ⬆ moved down (was 16.5mm)
      border: '1px solid #e2c172',
      width: '17mm',
      height: '20mm',
      objectFit: 'cover',
      borderRadius: '2mm',
    }}
  />
</div>

    {/* BACK CARD */}
    <div
  className="print-card"
  style={{
    position: 'relative',

    width: '86mm',
    height: '54mm',

    overflow: 'hidden',
    borderRadius: '12px',

    backgroundImage:
      "url('/card-templates/resident/ResidentNonMember_back.svg')",

    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',

    boxShadow: '0 6px 18px rgba(0,0,0,0.18)',
  }}
>
  {/* QR - moved slightly DOWN */}
  <img
    src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=DHA_CARD_TEST"
    alt="QR"
    style={{
      position: 'absolute',

      left: '6.3mm',
      top: '37mm', // ⬅ moved down (was 15mm)

      width: '13mm',
      height: '13mm',

      background: '#fff',
      padding: '1mm',
    }}
  />

  {/* TEXT BLOCK - now aligned to LEFT like front card */}
  <div
    style={{
      position: 'absolute',
      top: '5mm',
      left: '6mm', // ⬅ FIXED (was 30mm → now aligned left like front)
      color: '#e2c172',
      fontFamily: 'Arial',
    }}
  >
    {/* CNIC */}
    <div style={{marginBottom:'3mm'}}>
    <div style={{ marginBottom: '4mm' }}>
  <div style={{ fontSize: '1.9mm', fontWeight: 100 }}>
    CNIC No.
  </div>

  <div style={{ marginTop: '0.8mm', fontSize: '3mm', fontWeight: 200 }}>
    {previewRow.cnic || '42101-1234567-1'}
  </div>
</div>
</div>
    {/* CARD NO */}
    <div style={{marginBottom:'3mm'}}>
<div
  style={{
    marginBottom: '4mm',
  }}
>
  <div
    style={{
      fontSize: '1.9mm',
      fontWeight: 100,
      letterSpacing: '0.2px',
    }}
  >
    Card No.
  </div>

  <div
    style={{
      marginTop: '0.8mm',
      fontSize: '3mm',
      fontWeight: 200,
    }}
  >
    1234 1234 1234 1234
  </div>
</div>
</div>
<div style={{marginBottom:'3mm'}}>
{/* ADDRESS */}
<div
  style={{
    width: '60mm',
  }}
>
  <div
    style={{
      fontSize: '1.9mm',
      fontWeight: 100,
      letterSpacing: '0.2px',
    }}
  >
    Address
  </div>

  <div
    style={{
      marginTop: '0.8mm',
      fontSize: '3mm',
      fontWeight: 200,
      lineHeight: '3.3mm',
    }}
  >
    Plot no. 1234, Khayaban e Iqbal Zone B, DHA Karachi
  </div>
  </div>
</div>
  </div>
</div>
    </div>

  {/* BUTTONS */}
  <div
    style={{
      display: 'flex',
      gap: '12px',
      marginTop: '8px',
    }}
  >

    {/* <button
      onClick={handlePrint}
      style={{
        padding: '10px 18px',
        borderRadius: '8px',
        border: 'none',
        background: 'green',
        color: '#fff',
        cursor: 'pointer',
        fontWeight: 600,
      }}
    >
      Print Card
    </button> */}
  </div>
</div>
        )}
      </FormModal>
    </>
  );
}