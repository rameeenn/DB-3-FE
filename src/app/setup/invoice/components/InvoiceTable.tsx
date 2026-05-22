'use client';
import { useEffect, useState, useMemo } from 'react';
import { useInvoices } from '../../../../hooks/invoice/useInvoices';
import { useInvoiceSummary } from '../../../../hooks/invoice/useInvoiceSummary';
import { useCreateInvoice } from '../../../../hooks/invoice/useCreateInvoice';
import { useUpdateInvoice } from '../../../../hooks/invoice/useUpdateInvoice';
import { useInvoiceById } from '../../../../hooks/invoice/useInvoiceById';
import { useRouter } from 'next/navigation';
import DataTable, { Column, Tab, StatusBadge } from '../../../../components/tables/DataTable';
import CircularButton from '../../../../components/ui/CircularButton';
import FormModal from '../../../../components/popup/FormModal';
import CommonEntityForm, { ProfileFormData } from '../../../../components/forms/CommonEntityForm';
import InvoicePreviewModal from './InvoicePreviewModal';
import { saveTableRow, clearTableRow, getTableRow } from '../../../../lib/tableRowStorage';
import { endOfDayIso, formatDateDisplay, startOfDayIso } from '../../../../lib/dateUtils';
import { invoiceFields } from '../fields';
import { exportInvoicesExcel } from '../../../../services/invoice.service';
import { RangeDatePicker } from '../../../../components/date-pickers/CustomDatePickers';
import toolbarStyles from './InvoiceToolbar.module.css';

interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string | null;
  entityType: string | null;
  userId: string;
  username: string | null;
  parentUserName: string | null;
  familyUserName: string | null;
  serviceType: string | null;
  amount: number;
  taxAmount: number;
  bankCharges: number;
  discountAmount: number;
  mdrAmount: number;
  fedTaxAmount: number;
  totalAmount: number;
  paymentMethod: string | null;
  durationDays: number | null;
  trialPeriodDays: number;
  trialDueDate: string | null;
  transactionId: string | null;
  status: string;
  invoiceStatus: string | null;
}

interface InvoiceTableProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  onAddNew: () => void;
  addButtonLabel: string;
  searchParams?: any | null;
}

function formatPkr(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(Number(n))) return 'PKR 0';
  return `PKR ${Number(n).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

export default function InvoiceTable(props: InvoiceTableProps) {
  const { tabs, activeTab, onTabChange, onAddNew, addButtonLabel, searchParams } = props;
  const [currentPage, setCurrentPage] = useState(1);
  const [invoiceNumberFilter, setInvoiceNumberFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [excelExporting, setExcelExporting] = useState(false);
  const router = useRouter();

  const fromIso = fromDate ? startOfDayIso(fromDate) : undefined;
  const toIso = toDate ? endOfDayIso(toDate) : undefined;

  const invoiceQueryPayload = useMemo(
    () => ({
      pageNumber: currentPage,
      pageSize: 10,
      ...(invoiceNumberFilter.trim() ? { invoiceNumber: invoiceNumberFilter.trim() } : {}),
      ...(fromIso ? { fromDate: fromIso } : {}),
      ...(toIso ? { toDate: toIso } : {}),
    }),
    [currentPage, invoiceNumberFilter, fromIso, toIso]
  );

  const { data, isLoading } = useInvoices(invoiceQueryPayload);

 // Replace the useInvoiceSummary with this:
const { data: allInvoicesData, isLoading: isSummaryLoading } = useInvoices({
  pageNumber: 1,
  pageSize: 1000, // Get all records
  ...(invoiceNumberFilter.trim() ? { invoiceNumber: invoiceNumberFilter.trim() } : {}),
  ...(fromIso ? { fromDate: fromIso } : {}),
  ...(toIso ? { toDate: toIso } : {}),
});

// Then calculate totals from allInvoicesData
const summaryTotals = useMemo(() => {
  const allInvoices = allInvoicesData?.data || [];
  return {
    totalAmount: allInvoices.reduce((sum, inv) => sum + (Number(inv.totalAmount) || 0), 0),
    totalTaxAmount: allInvoices.reduce((sum, inv) => sum + (Number(inv.taxAmount) || 0), 0),
    totalBankCharges: allInvoices.reduce((sum, inv) => sum + (Number(inv.bankCharges) || 0), 0),
    paidCount: allInvoices.filter(inv => inv.status?.toLowerCase() === 'paid').length,
    unpaidCount: allInvoices.filter(inv => inv.status?.toLowerCase() !== 'paid').length,
  };
}, [allInvoicesData]);
  const [editInvoiceId, setEditInvoiceId] = useState<string | undefined>();
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [hasCheckedId, setHasCheckedId] = useState(false);
  const [formError, setFormError] = useState('');

  const { mutateAsync: createInvoice } = useCreateInvoice();
  const { mutateAsync: updateInvoice } = useUpdateInvoice();
  const { data: editInvoiceDetails, isLoading: isEditInvoiceLoading } = useInvoiceById(editInvoiceId);

  const modalMode = searchParams?.get('modal');
  const modalId = searchParams?.get('id');
  
  useEffect(() => {
    if (modalMode === 'edit' || modalMode === 'view') {
      if (modalId) {
        setEditInvoiceId(modalId);
        setHasCheckedId(true);
      } else {
        const selected = getTableRow<any>('invoice');
        if (selected?.id) {
          setEditInvoiceId(String(selected.id));
          clearTableRow('invoice');
          setHasCheckedId(true);
        }
      }
    }
  }, [modalMode, modalId]);

  const handleCloseModal = () => {
    setEditInvoiceId(undefined);
    setSelectedInvoice(null);
    setHasCheckedId(false);
    setFormError('');
    router.push('/setup/invoice');
  };

  const handleAddInvoice = async (data: ProfileFormData) => {
    setFormError('');
    try {
      await createInvoice({
        id: data.id || '',
        paymentMethod: data.paymentMethod || '',
        transactionId: data.transactionId || '',
        invoiceNumber: data.invoiceNumber || '',
        tagId: data.tagId || '',
        entityType: data.entityType || '',
      });
      handleCloseModal();
    } catch (err: any) {
      const message = err?.response?.data?.errorMessage || err?.message || 'Failed to create invoice';
      setFormError(message);
    }
  };

  const initialInvoiceValues = useMemo<ProfileFormData | null>(() => {
    if (!editInvoiceDetails?.data) return null;
    return {
      id: editInvoiceDetails.data.id || '',
      paymentMethod: editInvoiceDetails.data.paymentMethod || '',
      transactionId: editInvoiceDetails.data.transactionId || '',
      invoiceNumber: editInvoiceDetails.data.invoiceNumber || '',
      tagId: editInvoiceDetails.data.tagId || '',
      entityType: editInvoiceDetails.data.entityType || '',
    };
  }, [editInvoiceDetails]);

  const handleUpdateInvoice = async (formData: ProfileFormData) => {
    if (!editInvoiceId || !editInvoiceDetails?.data) return;
    setFormError('');
    try {
      await updateInvoice({
        id: editInvoiceId,
        paymentMethod: formData.paymentMethod || editInvoiceDetails.data.paymentMethod || '',
        transactionId: formData.transactionId || editInvoiceDetails.data.transactionId || '',
        invoiceNumber: formData.invoiceNumber || editInvoiceDetails.data.invoiceNumber || '',
        tagId: formData.tagId || editInvoiceDetails.data.tagId || '',
        entityType: formData.entityType || editInvoiceDetails.data.entityType || '',
      });
      handleCloseModal();
    } catch (err: any) {
      const message = err?.response?.data?.errorMessage || err?.message || 'Failed to update invoice';
      setFormError(message);
    }
  };
  // Map InvoiceRecord to Invoice for DataTable
  const invoices: Invoice[] = (data?.data || []).map((inv) => ({
    id: inv.id,
    invoiceNumber: inv.invoiceNumber,
    date: inv.date ?? null,
    entityType: inv.entityType ?? null,
    userId: inv.userId || inv.entityId || '',
    username: inv.username ?? null,
    parentUserName: inv.parentUserName ?? null,
    familyUserName: inv.familyUserName ?? null,
    serviceType: inv.serviceType ?? null,
    amount: inv.amount,
    taxAmount: inv.taxAmount,
    bankCharges: inv.bankCharges ?? 0,
    discountAmount: inv.discountAmount ?? 0,
    mdrAmount: inv.mdrAmount ?? 0,
    fedTaxAmount: inv.fedTaxAmount ?? 0,
    totalAmount: inv.totalAmount,
    paymentMethod: inv.paymentMethod ?? null,
    durationDays: inv.durationDays ?? null,
    trialPeriodDays: inv.trialPeriodDays ?? 0,
    trialDueDate: inv.trialDueDate || inv.trialDueAtUtc || null,
    transactionId: inv.transactionId ?? null,
    status: inv.status || '',
    invoiceStatus: inv.invoiceStatus ?? null,
  }));

  const pageTaxTotal = useMemo(
    () => invoices.reduce((s, i) => s + (Number(i.taxAmount) || 0), 0),
    [invoices]
  );
  const pageBankTotal = useMemo(
    () => invoices.reduce((s, i) => s + (Number(i.bankCharges) || 0), 0),
    [invoices]
  );
// Add these calculations after the invoices mapping (around line 200)
const paidTotal = useMemo(
  () => invoices.reduce((sum, inv) => {
    if (inv.status?.toLowerCase() === 'paid') {
      return sum + (Number(inv.totalAmount) || 0);
    }
    return sum;
  }, 0),
  [invoices]
);

const unpaidTotal = useMemo(
  () => invoices.reduce((sum, inv) => {
    if (inv.status?.toLowerCase() !== 'paid') {
      return sum + (Number(inv.totalAmount) || 0);
    }
    return sum;
  }, 0),
  [invoices]
);
  const excelDateRangeIso = () => {
    const toYmd = toDate.trim() || new Date().toISOString().slice(0, 10);
    const fromYmd = fromDate.trim() || toYmd;
    return {
      from: startOfDayIso(fromYmd)!,
      to: endOfDayIso(toYmd)!,
    };
  };

  const handleExportExcel = async () => {
    const { from, to } = excelDateRangeIso();
    setExcelExporting(true);
    try {
      const blob = await exportInvoicesExcel({
        pageNumber: 0,
        pageSize: 0,
        invoiceNumber: invoiceNumberFilter.trim(),
        fromDate: from,
        toDate: to,
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoices-${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // eslint-disable-next-line no-alert
      alert('Excel export failed. Please try again.');
    } finally {
      setExcelExporting(false);
    }
  };

  const invoiceToolbar = (
    <div className={toolbarStyles.toolbar}>
      <div className={toolbarStyles.row}>
        <div className={toolbarStyles.metricsLeft}>
          <div className={toolbarStyles.controlCard} style={{ minWidth: 140 }}>
            <p className={toolbarStyles.label}>Invoice No.</p>
            <input
              type="text"
              className={toolbarStyles.invoiceNoInput}
              placeholder="Type here"
              value={invoiceNumberFilter}
              onChange={(e) => {
                setInvoiceNumberFilter(e.target.value);
                setCurrentPage(1);
              }}
              aria-label="Filter by invoice number"
            />
          </div>
          <div className={toolbarStyles.controlCard}>
            <p className={toolbarStyles.label}>Date Range</p>
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
          <div className={toolbarStyles.excelWrapper}>
            <button
              type="button"
              className={toolbarStyles.excelBtn}
              onClick={handleExportExcel}
              disabled={excelExporting}
              title="Download Excel"
              aria-label="Export Excel"
            >
                <img src="/icons/excel.svg" alt="Excel Icon" width={20} height={20}></img>
            </button>
          </div>
        </div>
        <div className={toolbarStyles.metrics}>
  <div className={toolbarStyles.metricCard}>
    <p className={toolbarStyles.label}>Total Amount</p>
    <p className={toolbarStyles.value}>{formatPkr(summaryTotals.totalAmount)}</p>
  </div>
  <div className={toolbarStyles.metricCard}>
    <p className={toolbarStyles.label}>Total Tax Amount</p>
    <p className={toolbarStyles.value}>{formatPkr(summaryTotals.totalTaxAmount)}</p>
  </div>
  <div className={toolbarStyles.metricCard}>
    <p className={toolbarStyles.label}>Total Bank Charges</p>
    <p className={toolbarStyles.value}>{formatPkr(summaryTotals.totalBankCharges)}</p>
  </div>
  <div className={toolbarStyles.metricCard}>
    <p className={toolbarStyles.label}>Paid Invoices</p>
    <p className={toolbarStyles.value} >{summaryTotals.paidCount}</p>
  </div>
  <div className={toolbarStyles.metricCard}>
    <p className={toolbarStyles.label}>Unpaid Invoices</p>
    <p className={toolbarStyles.value}>{summaryTotals.unpaidCount}</p>
  </div>
  <div className={toolbarStyles.metricCard}>
    <p className={toolbarStyles.label}>Total Receivables</p>
    <p className={toolbarStyles.value}>{formatPkr(summaryTotals.totalAmount)}</p>
  </div>
</div>
      </div>
    </div>
  );

  const handleView = (item: Invoice) => {
    setSelectedInvoice(item);
    saveTableRow('invoice', item);
    router.push(`/setup/invoice?modal=view&id=${encodeURIComponent(item.id)}`);
  };

  const dashIfEmpty = (value: any) =>
    value === null || value === undefined || value === '' ? '-' : value;

  const columns: Column<Invoice>[] = [
    { key: 'invoiceNumber', header: 'Invoice Number', render: dashIfEmpty },
    { key: 'date', header: 'Date', render: (value) => (value ? formatDateDisplay(value) : '-') },
    { key: 'entityType', header: 'Entity Type', render: dashIfEmpty },
    { key: 'parentUserName', header: 'Entity Name', render: dashIfEmpty },
    { key: 'serviceType', header: 'Tag Type', render: dashIfEmpty },
    { key: 'amount', header: 'Amount', render: dashIfEmpty },
    { key: 'bankCharges', header: 'Bank Charges', render: dashIfEmpty },
    { key: 'taxAmount', header: 'Tax Amount', render: dashIfEmpty },
    { key: 'discountAmount', header: 'Discount', render: dashIfEmpty },
    { key: 'mdrAmount', header: 'MDR Amount', render: dashIfEmpty },
    { key: 'fedTaxAmount', header: 'FED Tax', render: dashIfEmpty },
    { key: 'totalAmount', header: 'Total Amount', render: dashIfEmpty },
    { key: 'paymentMethod', header: 'Payment Method', render: dashIfEmpty },
    { key: 'durationDays', header: 'Duration (Days)', render: dashIfEmpty },
    { key: 'trialPeriodDays', header: 'Trial Period (Days)', render: dashIfEmpty },
    { key: 'trialDueDate', header: 'Trial Due Date', render: (value) => (value ? formatDateDisplay(value) : '-') },
    { key: 'transactionId', header: 'Transaction ID', render: dashIfEmpty },
    { 
      key: 'status', 
      header: 'Status',
      render: (value: string) => <StatusBadge status={dashIfEmpty(value)} />
    },
    {
      key: 'action',
      header: 'Action',
      render: (_, row) => (
        <div style={{ display: 'flex', gap: '4px' }}>
          <CircularButton imagePath="/icons/View.svg" imageAlt="View" width={32} height={32} onClick={() => handleView(row)} />
        </div>
      )
    }
  ];

  return (
    <>
      <DataTable<Invoice>
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={onTabChange}
        columns={columns}
        data={invoices}
        headerContent={invoiceToolbar}
        loading={isLoading}
        showAddButton={false}
        addButtonLabel={addButtonLabel}
        onAddClick={() => router.push('/setup/invoice?modal=add')}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        enableFiltering={false}
        enableSorting={false}
        serverSidePagination
      />
      
      <FormModal
        isOpen={modalMode === 'add'}
        onClose={handleCloseModal}
        title="Add Invoice"
      >
        <CommonEntityForm
          title=""
          fields={invoiceFields}
          initialValues={{
            id: '',
            paymentMethod: '',
            transactionId: '',
            invoiceNumber: '',
            tagId: '',
            entityType: '',
          }}
          onSave={handleAddInvoice}
          onCancel={handleCloseModal}
          loading={false}
          error={formError}
        />
      </FormModal>

      <FormModal
        isOpen={modalMode === 'edit' && hasCheckedId}
        onClose={handleCloseModal}
        title="Edit Invoice"
      >
        {isEditInvoiceLoading ? (
          <div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>
        ) : (
          <CommonEntityForm
            title=""
            fields={invoiceFields}
            initialValues={initialInvoiceValues || { id: '', paymentMethod: '', transactionId: '', invoiceNumber: '', tagId: '', entityType: '' }}
            onSave={handleUpdateInvoice}
            onCancel={handleCloseModal}
            loading={false}
            error={formError}
            isViewMode={false}
          />
        )}
      </FormModal>

      <InvoicePreviewModal
        isOpen={modalMode === 'view' && hasCheckedId}
        onClose={handleCloseModal}
        invoice={
          selectedInvoice
            ? {
                id: selectedInvoice.id,
                invoiceNumber: selectedInvoice.invoiceNumber,
                date: selectedInvoice.date,
                username: selectedInvoice.username,
                amount: selectedInvoice.amount,
                taxAmount: selectedInvoice.taxAmount,
                discountAmount: selectedInvoice.discountAmount,
                totalAmount: selectedInvoice.totalAmount,
                serviceType: selectedInvoice.serviceType,
              }
            : editInvoiceDetails?.data
              ? {
                  id: editInvoiceDetails.data.id || '',
                  invoiceNumber: editInvoiceDetails.data.invoiceNumber || '',
                  date: editInvoiceDetails.data.date || null,
                  username: editInvoiceDetails.data.username || null,
                  amount: Number(editInvoiceDetails.data.amount || 0),
                  taxAmount: Number(editInvoiceDetails.data.taxAmount || 0),
                  discountAmount: Number(editInvoiceDetails.data.discountAmount || 0),
                  totalAmount: Number(editInvoiceDetails.data.totalAmount || 0),
                  serviceType: editInvoiceDetails.data.serviceType || null,
                }
              : null
        }
      />
    </>
  );
}
