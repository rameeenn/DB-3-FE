'use client';

import { useEffect, useMemo, useState } from 'react';
import DataTable, { Column, StatusBadge } from '../../../components/tables/DataTable';

import { useAllClubMembers } from '../../../hooks/club-members/useAllClubMembers';

import { formatDateDisplay } from '../../../lib/dateUtils';

import {
  tableCnic,
  tablePhone,
  tableCardNumber,
  displayDash,
} from '../../../lib/formatDisplayFields';

import { normalizeNumericEnum } from '../../../lib/statusMapping';

import type { ClubMemberApiResponse } from '@/services/clubmember.service';

/* ===================== TYPES ===================== */

export interface ClubMember {
  ser: number;
  profilePictureUrl: string;
  userName: string;
  email: string;
  phoneNumber: string;
  cnic: string;
  subCategory: string;
  memberNo: string;
  address: string | null;
  cardNumber: string | null;
  validFrom: string;
  validTo: string;
  cardStatus: number | null;
  isActive: string;
  totalCount?: number;
}

/* ===================== MAPPING ===================== */

function mapApiClubMemberToTableRow(
  u: ClubMemberApiResponse
): ClubMember {
  return {
    ser: (u as any).ser ?? 0,

    profilePictureUrl: u.profileImage,

    userName: displayDash(u.username),

    email: displayDash(u.email),

    phoneNumber: tablePhone(u.phone),

    cnic: tableCnic(u.cnic),

    subCategory: displayDash(u.subCategory),

    memberNo: displayDash(u.memberNo),

    address: displayDash((u as any).address),

    cardNumber: tableCardNumber(u.cardNumber),

    validFrom: u.validFrom
      ? formatDateDisplay(u.validFrom)
      : '-',

    validTo: u.validTo
      ? formatDateDisplay(u.validTo)
      : '-',

    cardStatus: normalizeNumericEnum(u.cardStatus),

    isActive: u.isActive ? 'Active' : 'Inactive',
  };
}

/* ===================== COMPONENT ===================== */

export default function ClubMembersTable() {
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // "" = ALL clubs
  const [selectedClub, setSelectedClub] = useState('');

  const { data, isLoading, isFetching, error } = useAllClubMembers();
  const totalCount = data?.data?.totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const totalListPages = 1;

  /* reset page on filter change */
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedClub]);

  /* ===================== FILTER + MAP ===================== */

   const members = useMemo(() => {
    const items = data?.data?.items ?? [];
    
    // Only filter by club, don't paginate here since serverSidePagination is true
    const filtered = selectedClub === ''
      ? items
      : items.filter((x) => x.subCategory === selectedClub);
    
    return filtered.map(mapApiClubMemberToTableRow);
  }, [data, selectedClub]);

  /* ===================== COLUMNS ===================== */

  const clubMembersColumns: Column<ClubMember>[] = [
    {
      key: 'profilePictureUrl',
      header: 'Picture',
      render: (_, row) => (
        <img
          src={row.profilePictureUrl}
          alt={row.userName}
          style={{
            width: 45,
            height: 45,
            borderRadius: '50%',
            objectFit: 'cover',
          }}
        />
      ),
    },

    { key: 'userName', header: 'User Name' },
    { key: 'email', header: 'Email' },
    { key: 'phoneNumber', header: 'Phone' },
    { key: 'cnic', header: 'CNIC' },
    {key: 'subCategory', header: 'Club' },
    { key: 'memberNo', header: 'Member No.' },
    { key: 'cardNumber', header: 'Card Number' },
    { key: 'validFrom', header: 'Valid From' },
    { key: 'validTo', header: 'Valid To' },

    {
      key: 'cardStatus',
      header: 'Card Status',
      render: (_, row) => (
        <StatusBadge type="cardStatus" value={row.cardStatus} />
      ),
    },

    {
      key: 'isActive',
      header: 'Status',
      render: (_, row) => (
        <StatusBadge status={row.isActive} />
      ),
    },
  ];

  const loadError =
    error instanceof Error
      ? error.message
      : error
      ? String(error)
      : undefined;

  /* ===================== UI ===================== */

  return (
    <div>
      <DataTable<ClubMember>
        columns={clubMembersColumns}
        data={members}
        totalCount={totalCount}
        clubOptions={[
          'All Clubs', // UI label
          'Golf Club',
          'Creek Club',
          'Beach View Club',
          'Marina Club',
          'Sunset Club',
          'DA Creek Club',
          'Zamzama Club',
          'DA Sports Club',
        ]}
        selectedClub={selectedClub === '' ? 'All Clubs' : selectedClub}
        onClubChange={(val) =>
          setSelectedClub(val === 'All Clubs' ? '' : val)
        }
        showAddButton={false}
        currentPage={currentPage}
        totalPages={totalListPages}
        onPageChange={setCurrentPage}
        rowsPerPage={pageSize}
        onRowsPerPageChange={(size) => {
          setPageSize(size);
          setCurrentPage(1);
        }}
        serverSidePagination
        loading={isLoading || isFetching}
        error={loadError}
        emptyMessage="No club members found"
        enableFiltering={true}
        enableSorting={true}
        filterPlaceholder="Search members..."
      />
    </div>
  );
}