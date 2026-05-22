// 'use client';
// import { useState } from 'react';
// import DataTable from '@/components/tables/DataTable';
// import { cardColumns } from './cardColumns';
// import { CardRow, CardTypeTableProps } from './types';

// const rows: CardRow[] = [
//   { userName: 'Shahid Hussain', email: 'shahid@gmail.com', phone: '0301-2346550', cnicNo: '12345-1234567-1', userType: 'Staff', rfidCardNo: 'UID-9278645300001192', cardIssueDate: '07-02-2025', cardExpiryDate: '07-02-2026', cardStatus: 3 },
//   { userName: 'Ahmed Faraz', email: 'ahmed@gmail.com', phone: '0301-2346540', cnicNo: '12345-4564567-1', userType: 'Staff', rfidCardNo: 'UID-9278645300001144', cardIssueDate: '07-02-2025', cardExpiryDate: '07-02-2026', cardStatus: 6 },
//   { userName: 'Mustafa Javaid', email: 'mustafa@gmail.com', phone: '0301-2346530', cnicNo: '12345-4522267-1', userType: 'Staff', rfidCardNo: 'UID-9278645300001136', cardIssueDate: '07-02-2025', cardExpiryDate: '07-02-2026', cardStatus: 3 },
//   { userName: 'Arsalan Khan', email: 'arsalan@gmail.com', phone: '0301-2346520', cnicNo: '12345-4528907-1', userType: 'Staff', rfidCardNo: 'UID-9278645300001100', cardIssueDate: '07-02-2025', cardExpiryDate: '07-02-2026', cardStatus: 5 },
// ];

// export default function DhaStaffCardTable({ tabs, activeTab, onTabChange, mainTabsHeader }: CardTypeTableProps) {
//   const [currentPage, setCurrentPage] = useState(1);

//   return (
//     <DataTable<CardRow>
//       tabs={tabs}
//       activeTab={activeTab}
//       onTabChange={onTabChange}
//       columns={cardColumns}
//       data={rows}
//       showAddButton={false}
//       currentPage={currentPage}
//       onPageChange={setCurrentPage}
//       enableSorting={true}
//       filterPlaceholder="Name"
//       searchVariant="card-management"
//       showSearchActionButton
//       headerContent={mainTabsHeader}
//     />
//   );
// }
