// 'use client';
// import { useState } from 'react';
// import { Tab } from '@/components/tables/DataTable';
// import styles from './CardManagementTable.module.css';
// import { MainCardTab } from './cardType/types';

// import ResidentCardTable from './cardType/ResidentCardTable';
// import NonResidentCardTable from './cardType/NonResidentCardTable';
// import DhaStaffCardTable from './cardType/DhaStaffCardTable';
// import ClubCardTable from './cardType/ClubCardTable';
// import WorkerCardTable from './cardType/WorkerCardTable';

// interface CardManagementTableProps {
//   tabs: Tab[];
//   activeTab: string;
//   onTabChange: (tab: string) => void;
//   onAddNew: () => void;
//   addButtonLabel: string;
//   searchParams?: any | null;
// }

// /* ===================== UPDATED TYPES ===================== */
// type Option = string;

// export default function CardManagementTable({
//   tabs,
//   activeTab,
//   onTabChange,
  
  
// }: CardManagementTableProps) {
//   const [activeMainTab, setActiveMainTab] =
//     useState<MainCardTab>('resident');

//   /* ===================== NEW DROPDOWN STATES ===================== */
//   const [userType, setUserType] = useState<Option>('All');
//   const [category, setCategory] = useState<Option>('All');
//   const [subCategory, setSubCategory] = useState<Option>('All');

//   /* ===================== OPTIONS ===================== */
//   const userTypeOptions: Option[] = [
//     'Member',
//     'Non Member',
//   ];

//   const categoryOptions: Option[] = [
//     '1'
//   ];

//   const subCategoryOptions: Option[] = [
//     'All',
//     'Resident',
//     'Non-Resident',
//     'DHA Staff',
//     'Club Card',
//     'Worker Card',
//   ];

//   /* ===================== MAIN TABS ===================== */
//   const mainTabs: Array<{ key: MainCardTab; label: string }> = [
//     { key: 'resident', label: 'Resident' },
//     { key: 'non-resident', label: 'Non-Resident' },
//     { key: 'dha-staff', label: 'DHA Staff' },
//     { key: 'club-card', label: 'Club Card' },
//     { key: 'worker-card', label: 'Worker Card' },
//   ];

//   /* ===================== HEADER (WITH 3 DROPDOWNS) ===================== */
//   const mainTabsHeader = (
//     <div className={styles.headerBlock}>
//       {/* MAIN TABS */}
//       <div className={styles.mainTabs}>
//         {mainTabs.map((tab) => (
//           <button
//             key={tab.key}
//             type="button"
//             onClick={() => setActiveMainTab(tab.key)}
//             className={`${styles.mainTab} ${
//               activeMainTab === tab.key
//                 ? styles.mainTabActive
//                 : ''
//             }`}
//           >
//             {tab.label}
//           </button>
//         ))}
//       </div>

//       {/* ===================== 3 DROPDOWNS ===================== */}
//       <div className={styles.dropdownRow}>

//         {/* USER TYPE */}
//         <div className={styles.filterGroup}>
//           <label className={styles.controlLabel}>User Type</label>
//           <select
//             className={styles.sortSelect}
//             value={userType}
//             onChange={(e) => setUserType(e.target.value)}
//           >
//             {userTypeOptions.map((u) => (
//               <option key={u} value={u}>
//                 {u}
//               </option>
//             ))}
//           </select>
//         </div>

//         {/* CATEGORY */}
//         <div className={styles.filterGroup}>
//           <label className={styles.controlLabel}>Category</label>
//           <select
//             className={styles.sortSelect}
//             value={category}
//             onChange={(e) => setCategory(e.target.value)}
//           >
//             {categoryOptions.map((c) => (
//               <option key={c} value={c}>
//                 {c}
//               </option>
//             ))}
//           </select>
//         </div>

//         {/* SUB CATEGORY */}
//         <div className={styles.filterGroup}>
//           <label className={styles.controlLabel}>Sub Category</label>
//           <select
//             className={styles.sortSelect}
//             value={subCategory}
//             onChange={(e) =>
//               setSubCategory(e.target.value)
//             }
//           >
//             {subCategoryOptions.map((s) => (
//               <option key={s} value={s}>
//                 {s}
//               </option>
//             ))}
//           </select>
//         </div>
//       </div>
//     </div>
//   );

//   /* ===================== RENDER TABS ===================== */
//   if (activeMainTab === 'resident') {
//     return (
//       <ResidentCardTable
//         tabs={tabs}
//         activeTab={activeTab}
//         onTabChange={onTabChange}
//         mainTabsHeader={mainTabsHeader}
//         userType={userType}
//         category={category}
//         subCategory={subCategory}
//       />
//     );
//   }

//   if (activeMainTab === 'non-resident') {
//     return (
//       <NonResidentCardTable
//         tabs={tabs}
//         activeTab={activeTab}
//         onTabChange={onTabChange}
//         mainTabsHeader={mainTabsHeader}
//         userType={userType}
//         category={category}
//         subCategory={subCategory}
//       />
//     );
//   }

//   if (activeMainTab === 'dha-staff') {
//     return (
//       <DhaStaffCardTable
//         tabs={tabs}
//         activeTab={activeTab}
//         onTabChange={onTabChange}
//         mainTabsHeader={mainTabsHeader}
//         userType={userType}
//         category={category}
//         subCategory={subCategory}
//       />
//     );
//   }

//   if (activeMainTab === 'club-card') {
//     return (
//       <ClubCardTable
//         tabs={tabs}
//         activeTab={activeTab}
//         onTabChange={onTabChange}
//         mainTabsHeader={mainTabsHeader}
//         userType={userType}
//         category={category}
//         subCategory={subCategory}
//       />
//     );
//   }

//   return (
//     <WorkerCardTable
//       tabs={tabs}
//       activeTab={activeTab}
//       onTabChange={onTabChange}
//       mainTabsHeader={mainTabsHeader}
//       userType={userType}
//       category={category}
//       subCategory={subCategory}
//     />
//   );
// }