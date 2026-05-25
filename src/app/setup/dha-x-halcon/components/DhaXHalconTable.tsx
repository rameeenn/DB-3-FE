'use client';

import { useMemo, useState } from 'react';
import DataTable, { Column, StatusBadge, Tab } from '@/components/tables/DataTable';
import CircularButton from '@/components/ui/CircularButton';
import { endOfDayIso, formatDateDisplay, startOfDayIso } from '@/lib/dateUtils';
import { useInvoiceSummaryDetails } from '@/hooks/invoice/useInvoiceSummaryDetails';
import type { InvoiceSummaryDetailItem } from '@/services/invoice.service';
import { ChevronDown } from 'lucide-react';
import { RangeDatePicker } from '@/components/date-pickers/CustomDatePickers';
import styles from './DhaXHalconTable.module.css';
import { InvoiceSummaryTotals } from '@/services/invoice.service';

interface DhaXHalconTableProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tab: string) => void;
}

interface HalconRow {
  id: string;
  invoiceNumber: string;
  date: string;
  userId: string;
  name: string;
  entityType: string;
  parentUserName: string;
  serviceType: string;
  amount: string;
  taxAmount: string;
  discountAmount: string;
  totalAmount: string;
  dhaShare: string;
  halconShare: string;
  invoiceStatus: string;
  paymentMethod: string;
  transactionId: string;
  durationDays: string;
  trialDueDate: string;
}

type HeadOption = 'all' | 'dha' | 'halcon';

function formatPkr(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(Number(n))) return '-';
  return `PKR ${Number(n).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

const columns: Column<HalconRow>[] = [
  { key: 'invoiceNumber', header: 'Invoice Number' },
  { key: 'date', header: 'Date', render: (v) => (v ? formatDateDisplay(String(v)) : '-') },
  { key: 'userId', header: 'User ID' },
  { key: 'name', header: 'Name' },
  { key: 'entityType', header: 'Entity Type' },
  { key: 'parentUserName', header: 'Parent User' },
  { key: 'serviceType', header: 'Service Type' },
  { key: 'amount', header: 'Amount' },
  { key: 'taxAmount', header: 'Tax Amount' },
  { key: 'discountAmount', header: 'Discount' },
  { key: 'totalAmount', header: 'Total Amount' },
  { key: 'dhaShare', header: 'DHA share (est.)' },
  { key: 'halconShare', header: 'Halcon share (est.)' },
  {
    key: 'invoiceStatus',
    header: 'Status',
    render: (value) => <StatusBadge status={String(value || '-')} />,
  },
  { key: 'paymentMethod', header: 'Payment Method' },
  { key: 'transactionId', header: 'Transaction ID' },
  { key: 'durationDays', header: 'Duration (days)' },
  { key: 'trialDueDate', header: 'Trial due', render: (v) => (v ? formatDateDisplay(String(v)) : '-') },
  {
    key: 'action',
    header: 'Action',
    render: () => <CircularButton imagePath="/icons/View.svg" imageAlt="View" width={32} height={32} />,
  },
];

export default function DhaXHalconTable({ tabs, activeTab, onTabChange }: DhaXHalconTableProps) {
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedHead, setSelectedHead] = useState<HeadOption>('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const fromDateIso = fromDate ? startOfDayIso(fromDate) : undefined;
  const toDateIso = toDate ? endOfDayIso(toDate) : undefined;

  // Get data for the table (with date filters)
  const {
    data: summaryDetails,
    isLoading,
    isError,
    error,
  } = useInvoiceSummaryDetails({
    pageNumber: currentPage,
    pageSize,
    fromDate: fromDateIso,
    toDate: toDateIso,
  });

  // Get totals without date filters for the header summary
  const { data: totalsData } = useInvoiceSummaryDetails({
    pageNumber: 1,
    pageSize: 1,
    fromDate: undefined,
    toDate: undefined,
  });

  // Use totals from the unfiltered API call for the header
  const totals = totalsData?.totals;
  const dhaPct = totals?.dhaPercentage ?? 0;
  const halconPct = totals?.halconPercentage ?? 0;
  const totalAmount = totals?.totalAmount ?? 0;
  const dhaAmount = totals?.dhaAmount ?? 0;
  const halconAmount = totals?.halconAmount ?? 0;

  // For table rows, use the percentages from totals to calculate shares
  const tableRows: HalconRow[] = useMemo(() => {
    const items: InvoiceSummaryDetailItem[] = summaryDetails?.items ?? [];
    return items.map((item) => {
      const total = Number(item.totalAmount) || 0;
      const dhaPart = (total * dhaPct) / 100;
      const halconPart = (total * halconPct) / 100;
      return {
        id: item.id,
        invoiceNumber: item.invoiceNumber || '-',
        date: item.date || '-',
        userId: item.userId || '-',
        name: item.username || '-',
        entityType: item.entityType || '-',
        parentUserName: item.parentUserName || '-',
        serviceType: item.serviceType || '-',
        amount: formatPkr(item.amount),
        taxAmount: formatPkr(item.taxAmount),
        discountAmount: formatPkr(item.discountAmount ?? null),
        totalAmount: formatPkr(item.totalAmount),
        dhaShare: formatPkr(dhaPart),
        halconShare: formatPkr(halconPart),
        invoiceStatus: item.invoiceStatus || '-',
        paymentMethod: item.paymentMethod || '-',
        transactionId: item.transactionId || '-',
        durationDays: item.durationDays != null ? String(item.durationDays) : '-',
        trialDueDate: item.trialDueDate || '-',
      };
    });
  }, [summaryDetails?.items, dhaPct, halconPct]);

  const totalListPages = Math.max(1, summaryDetails?.totalPages ?? 1);

  const filteredRows = useMemo(() => {
    if (selectedHead === 'all') return tableRows;
    if (selectedHead === 'dha') {
      return tableRows.filter(row => {
        const dhaValue = parseFloat(row.dhaShare.replace(/[^0-9.-]/g, ''));
        return dhaValue > 0;
      });
    }
    return tableRows.filter(row => {
      const halconValue = parseFloat(row.halconShare.replace(/[^0-9.-]/g, ''));
      return halconValue > 0;
    });
  }, [tableRows, selectedHead]);

  const headerContent = (
    <div className={styles.headerArea}>
      <div className={styles.summaryStrip}>
        <div className={styles.leftGroup}>
          <div className={styles.controlCard}>
            <p className={styles.cardLabel}>Select Head</p>
            <div className={styles.selectWrap}>
              <select
                value={selectedHead}
                onChange={(e) => setSelectedHead(e.target.value as HeadOption)}
                className={styles.headSelect}
              >
                <option value="all">All</option>
                <option value="dha">DHA</option>
                <option value="halcon">Halcon</option>
              </select>
              <ChevronDown size={13} className={styles.selectIcon} />
            </div>
          </div>
          <div className={styles.controlCard}>
            <p className={styles.cardLabel}>Date Range</p>
            <RangeDatePicker
              fromValue={fromDate}
              toValue={toDate}
              onFromChange={(nextValue) => {
                setFromDate(nextValue);
                setCurrentPage(1);
              }}
              onToChange={(nextValue) => {
                setToDate(nextValue);
                setCurrentPage(1);
              }}
              label="Select date range"
            />
          </div>
        </div>
        <div className={styles.rightGroup}>
          <div className={styles.card}>
            <p className={styles.cardLabel}>Total Amount</p>
            <p className={styles.cardValue}>{formatPkr(totalAmount)}</p>
          </div>
          <div className={styles.card}>
            <p className={styles.cardLabel}>DHA %</p>
            <p className={styles.cardSub}>{dhaPct}%</p>
            <p className={styles.cardValue}>{formatPkr(dhaAmount)}</p>
          </div>
          <div className={styles.card}>
            <p className={styles.cardLabel}>Halcon %</p>
            <p className={styles.cardSub}>{halconPct}%</p>
            <p className={styles.cardValue}>{formatPkr(halconAmount)}</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <DataTable<HalconRow>
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={onTabChange}
      columns={columns}
      data={filteredRows}
      showAddButton={false}
      loading={isLoading}
      currentPage={currentPage}
      totalPages={totalListPages}
      onPageChange={setCurrentPage}
      rowsPerPage={pageSize}
      onRowsPerPageChange={(size) => {
        setPageSize(size);
        setCurrentPage(1);
      }}
      serverSidePagination
      headerContent={headerContent}
      enableSorting={false}
      enableFiltering={false}
      error={
        isError
          ? `Failed to load data: ${error instanceof Error ? error.message : 'Unknown error'}`
          : undefined
      }
    />
  );
}