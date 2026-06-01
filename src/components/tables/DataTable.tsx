'use client';
import React, { useEffect, useMemo, useState, ReactNode } from 'react';
import styles from './DataTable.module.css';
import Loader from '../ui/loader';
import { usePathname } from 'next/navigation';
import { getStatusConfig } from '@/lib/statusMapping';
import { Search, ArrowLeft, ArrowRight, Plus, ArrowUp, ArrowDown, CreditCard } from 'lucide-react';

// ================================ TYPE DEFINITIONS ================================

export interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (value: any, row: T) => ReactNode;
}

export interface Tab {
  key: string;
  label: string;
}

export interface DataTableProps<T> {
  tabs?: Tab[];
  activeTab?: string;
  onTabChange?: (tabKey: string) => void;
  columns: Column<T>[];
  data: T[];
  addButtonLabel?: string;
  onAddClick?: () => void;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  rowsPerPage?: number;
  /** When set with `serverSidePagination`, page size is controlled by parent (triggers API refetch). */
  onRowsPerPageChange?: (pageSize: number) => void;
  /** When true with controlled `currentPage`, rows are not sliced client-side (server returns one page). */
  serverSidePagination?: boolean;
  loading?: boolean;
  error?: string | Error;
  emptyMessage?: string;
  showAddButton?: boolean;
  getRowStatus?: (row: T) => 'Active' | 'Inactive' | 'Pending' | undefined;
  headerContent?: React.ReactNode;
  tableUpperContent?: React.ReactNode;
  enableFiltering?: boolean;
  enableSorting?: boolean;
  filterPlaceholder?: string;
  searchVariant?: 'default' | 'card-management';
  showSearchActionButton?: boolean;
  /** If set, only these keys get column filter dropdowns (each must exist in columns and FILTERABLE_COLUMNS_CONFIG). */
  columnFilterKeys?: string[];
  /** Per-table labels for column filters (overrides default FILTERABLE_COLUMNS_CONFIG labels). */
  columnFilterLabels?: Record<string, string>;
  /** Fixed option lists for column filters (e.g. enum API). Overrides values derived from row data. */
  columnFilterStaticOptions?: Record<string, { value: string; label: string }[]>;
  tabVariant?: 'tabs' | 'dropdown';
  clubOptions?: string[];
  selectedClub?: string;
  onClubChange?: (value: string) => void;
  userTypeOptions?: string[];
selectedUserType?: string;
onUserTypeChange?: (value: string) => void;

categoryOptions?: string[];
selectedCategory?: string;
onCategoryChange?: (value: string) => void;

subCategoryOptions?: string[];
selectedSubCategory?: string;
onSubCategoryChange?: (value: string) => void;

}

// ================================ Long Fields ==============================
let longFields: string[] = [
  'description',
  'notes',
];

// ================================ CONSTANTS ================================

const FILTERABLE_COLUMNS_CONFIG: Record<string, string> = {
  jobType: 'Job Type',
  workerCardDeliveryType: 'Worker Card Delivery',
  cardStatus: 'Tag Status',
  tagType: 'Tag Type',
  tagStatus: 'Tag Status',
  passStatus: 'Pass Status',
  visitPassType: 'Pass Type',
  activeStatus: 'Status',
  category: 'Category',
  subCategory: 'Sub Category',
};

// ================================ STATUS BADGE COMPONENT ================================

export function StatusBadge({
  status,
  type,
  value,
}: {
  status?: string;
  type?: string;
  value?: string | number | boolean | null;
}) {
  // If type and value are provided, use the status mapping
  let displayLabel = status;
  let bgColor: string | undefined;
  let textColor: string | undefined;

  if (type && value !== undefined && value !== null) {
    const config = getStatusConfig(type, value);
    if (config) {
      displayLabel = config.label;
      bgColor = config.bg;
      textColor = config.color;
    }
  }

  const normalizedLabel =
    typeof displayLabel === 'string' && displayLabel.trim() === '' ? undefined : displayLabel;

  // Fallback to CSS classes if no custom colors
  if (!bgColor || !textColor) {
    const getStatusClass = () => {
      const statusStr = (normalizedLabel || '').toLowerCase();
      switch (statusStr) {
        case 'approved':
        case 'paid':
          return styles.statusApproved;
        case 'rejected':
          return styles.statusRejected;
        case 'cancelled':
          return styles.statusCancelled;
        case 'active':
          return styles.statusActive;
        case 'inactive':
          return styles.statusInactive;
        case 'pending':
        case 'blocked':
          return styles.statusPending;
        case 'private':
          return styles.statusPrivate;
        case 'official':
          return styles.statusOfficial;
        case 'service':
          return styles.statusService;
        case 'commercial':
          return styles.statusCommercial;
        default:
          return styles.statusInactive;
      }
    };

    const noStatus = "---"

    return (
      <span className={`${styles.statusBadge} ${getStatusClass()}`}>
        {normalizedLabel ?? noStatus}
      </span>
    );
  }

  return (
    <span
      className={styles.statusBadge}
      style={{
        backgroundColor: bgColor,
        color: textColor,
      }}
    >
      {normalizedLabel}
    </span>
  );
}

// ================================ MAIN DATATABLE COMPONENT ================================

export default function DataTable<T extends Record<string, any>>({
  tabs,
  activeTab,
  onTabChange,
  columns,
  data,
  addButtonLabel = 'Add New',
  onAddClick,
  currentPage,
  totalPages,
  onPageChange,
  rowsPerPage = 10,
  onRowsPerPageChange,
  serverSidePagination = false,
  loading = false,
  error,
  emptyMessage = 'No data available',
  showAddButton = true,
  getRowStatus,
  headerContent,
  enableFiltering = true,
  enableSorting = true,
  filterPlaceholder = 'Search',
  searchVariant = 'default',
  showSearchActionButton = false,
  tableUpperContent = null,
  columnFilterKeys,
  columnFilterLabels,
  columnFilterStaticOptions,
  tabVariant = 'tabs',
   clubOptions,
  selectedClub,
  onClubChange,
  totalCount,
  userTypeOptions,
  selectedUserType,
  onUserTypeChange,

  categoryOptions,
  selectedCategory,
  onCategoryChange,

  subCategoryOptions,
  selectedSubCategory,
  onSubCategoryChange,

}: DataTableProps<T>  & { totalCount?: number }) {
  
  // ================================ STATE MANAGEMENT ================================
  
  const [filterTerm, setFilterTerm] = useState('');
  const [sortKey, setSortKey] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
  const [internalRowsPerPage, setInternalRowsPerPage] = useState(rowsPerPage);
  const [internalCurrentPage, setInternalCurrentPage] = useState(1);
  
  const pathName = usePathname();

  // ================================ HELPER FUNCTIONS ================================
  
  const getRawCellValue = (column: Column<T>, row: T) => {
    if (column.key.toString().includes('.')) {
      return column.key
        .toString()
        .split('.')
        .reduce((obj, key) => obj?.[key], row as any);
    }
    return row[column.key as keyof T];
  };

  const getRowClassName = (row: T) => {
    const status = getRowStatus?.(row);
    if (status === 'Active') return styles.rowActive;
    if (status === 'Inactive') return styles.rowInactive;
    return '';
  };
  
  const renderCell = (column: Column<T>, row: T) => {
    const value = getRawCellValue(column, row);
    const isLongField = longFields.includes(String(column.key).toLowerCase());

    let rendered: React.ReactNode;
    if (column.render) {
      rendered = column.render(value, row);
    } else {
      if (value === null || value === undefined) rendered = '-';
      else if (typeof value === 'string' && value.trim() === '') rendered = '-';
      else rendered = value;
    }

    // If this is a long field and the rendered content is a plain string/number,
    if (isLongField && (typeof rendered === 'string' || typeof rendered === 'number')) {
      return (
        <span className={styles.longText} title={String(value ?? '')}>
          {rendered}
        </span>
      );
    }

    return rendered;
  };

  // ================================ FILTER OPTIONS GENERATION ================================
  
  // Determine which filters are available based on columns present in the table
  const availableFilters = useMemo(() => {
    const filters: Array<{ key: string; label: string }> = [];

    Object.entries(FILTERABLE_COLUMNS_CONFIG).forEach(([key, label]) => {
      const hasVisibleColumn = columns.some((column) => String(column.key) === key);
      const isExplicitlyRequested = !!columnFilterKeys?.includes(key);

      if (!hasVisibleColumn && !isExplicitlyRequested) return;
      if (columnFilterKeys && columnFilterKeys.length > 0 && !isExplicitlyRequested) {
        return;
      }

      const displayLabel = columnFilterLabels?.[key] ?? label;
      filters.push({ key, label: displayLabel });
    });

    // Keys listed in columnFilterKeys but not in FILTERABLE_COLUMNS_CONFIG (e.g. subjectType as "Entity Type" on tag screens only)
    columnFilterKeys?.forEach((key) => {
      if (filters.some((f) => f.key === key)) return;
      const displayLabel =
        columnFilterLabels?.[key] ??
        FILTERABLE_COLUMNS_CONFIG[key] ??
        key.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase());
      filters.push({ key, label: displayLabel });
    });

    return filters;
  }, [columns, columnFilterKeys, columnFilterLabels]);

  const getFilterOptions = (filterKey: string) => {
    const staticOpts = columnFilterStaticOptions?.[filterKey];
    if (staticOpts && staticOpts.length > 0) {
      return [...staticOpts].sort((a, b) => a.label.localeCompare(b.label));
    }

    const uniqueValues = Array.from(
      new Set(
        data
          .map((row) => row[filterKey])
          .filter((value) => value !== null && value !== undefined)
          .map((value) => String(value))
      )
    );
    
    return uniqueValues.map((value) => {
      // Check if this filter key exists in FILTERABLE_COLUMNS_CONFIG
      // and try to get a status config for it
      if (FILTERABLE_COLUMNS_CONFIG[filterKey]) {
        const numericValue = Number(value);
        const config = getStatusConfig(filterKey, Number.isNaN(numericValue) ? value : numericValue);
        return {
          value,
          label: config?.label || value,
        };
      }
      return { value, label: value };
    }).sort((a, b) => a.label.localeCompare(b.label));
  };

  // ================================ DATA FILTERING & SORTING ================================
  
  const filteredAndSortedData = useMemo(() => {
    let result = [...data];

    // Apply all column filters
    Object.entries(columnFilters).forEach(([key, filterValue]) => {
      if (filterValue && filterValue !== 'all') {
        result = result.filter((row) => String(row[key]) === filterValue);
      }
    });

    // Apply search filter
    const trimmedFilter = filterTerm.trim().toLowerCase();
    if (enableFiltering && trimmedFilter) {
      result = result.filter((row) =>
        columns.some((column) => {
          const value = getRawCellValue(column, row);
          if (value === null || value === undefined) return false;
          return String(value).toLowerCase().includes(trimmedFilter);
        })
      );
    }

    // Apply sorting
    if (enableSorting && sortKey) {
      const selectedColumn = columns.find((column) => String(column.key) === sortKey);
      if (selectedColumn) {
        result.sort((a, b) => {
          const aValue = getRawCellValue(selectedColumn, a);
          const bValue = getRawCellValue(selectedColumn, b);

          if (aValue === bValue) return 0;
          if (aValue === null || aValue === undefined) return sortDirection === 'asc' ? -1 : 1;
          if (bValue === null || bValue === undefined) return sortDirection === 'asc' ? 1 : -1;

          const aNumber = Number(aValue);
          const bNumber = Number(bValue);
          const bothNumbers = !Number.isNaN(aNumber) && !Number.isNaN(bNumber);

          if (bothNumbers) {
            return sortDirection === 'asc' ? aNumber - bNumber : bNumber - aNumber;
          }

          const aString = String(aValue);
          const bString = String(bValue);
          return sortDirection === 'asc'
            ? aString.localeCompare(bString, undefined, { numeric: true, sensitivity: 'base' })
            : bString.localeCompare(aString, undefined, { numeric: true, sensitivity: 'base' });
        });
      }
    }

    return result;
  }, [columnFilters, columns, data, enableFiltering, enableSorting, filterTerm, sortDirection, sortKey]);

  // ================================ EFFECTS ================================
  
  // Auto-set initial sort if cardStatus column exists
  useEffect(() => {
    if (!enableSorting) return;
    const hasCardStatusColumn = columns.some((column) => String(column.key) === 'cardStatus');
    if (hasCardStatusColumn && !sortKey) {
      setSortKey('cardStatus');
      setSortDirection('desc');
    }
  }, [columns, enableSorting, sortKey]);

  // Sync internal page with total pages when uncontrolled
  useEffect(() => {
    const isPaginationControlled = typeof currentPage === 'number';
    if (isPaginationControlled) return;
    
    const calculatedTotalPages = Math.max(1, Math.ceil(filteredAndSortedData.length / Math.max(1, internalRowsPerPage)));
    setInternalCurrentPage((prevPage) => Math.min(prevPage, calculatedTotalPages));
  }, [filteredAndSortedData.length, internalRowsPerPage, currentPage]);


  // ================================ PAGINATION LOGIC ================================
  
  const isPaginationControlled = typeof currentPage === 'number';
  const isRowsPerPageControlled = typeof onRowsPerPageChange === 'function';
  const effectiveRowsPerPage = Math.max(
    1,
    isRowsPerPageControlled ? rowsPerPage : internalRowsPerPage
  );
  const safeRowsPerPage = Math.max(1, effectiveRowsPerPage);
  const calculatedTotalPages = Math.max(1, Math.ceil(filteredAndSortedData.length / safeRowsPerPage));
  const resolvedTotalPages =
    serverSidePagination && isPaginationControlled
      ? Math.max(1, totalPages ?? 1)
      : Math.max(calculatedTotalPages, Math.max(1, totalPages ?? 1));
  const activePage = isPaginationControlled ? (currentPage as number) : internalCurrentPage;
  const safeCurrentPage = Math.min(Math.max(activePage, 1), resolvedTotalPages);
  const paginatedData =
    serverSidePagination && isPaginationControlled
      ? filteredAndSortedData
      : filteredAndSortedData.slice((safeCurrentPage - 1) * safeRowsPerPage, safeCurrentPage * safeRowsPerPage);

  const handlePageChange = (nextPage: number) => {
    const clampedPage = Math.min(Math.max(nextPage, 1), resolvedTotalPages);
    if (clampedPage === safeCurrentPage) return;
    if (isPaginationControlled) {
      onPageChange?.(clampedPage);
    } else {
      setInternalCurrentPage(clampedPage);
    }
  };

  const handleRowsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRows = Math.max(1, parseInt(e.target.value, 10) || 10);
    if (isRowsPerPageControlled) {
      onRowsPerPageChange(newRows);
      if (isPaginationControlled) {
        onPageChange?.(1);
      } else {
        setInternalCurrentPage(1);
      }
      return;
    }
    setInternalRowsPerPage(newRows);
    setInternalCurrentPage(1);
  };

  const handleColumnFilterChange = (key: string, value: string) => {
    setColumnFilters(prev => ({ ...prev, [key]: value }));
    if (!isPaginationControlled) {
      setInternalCurrentPage(1);
    } else {
      onPageChange?.(1);
    }
  };

  // ================================ PAGINATION UI RENDERER ================================
  
  const renderPagination = () => {
    if (resolvedTotalPages < 1) return null;

    const pages: (number | string)[] = [];
    const maxVisiblePages = 5;

    if (resolvedTotalPages <= maxVisiblePages) {
      for (let i = 1; i <= resolvedTotalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      const startPage = Math.max(2, safeCurrentPage - 1);
      const endPage = Math.min(resolvedTotalPages - 1, safeCurrentPage + 1);
      if (startPage > 2) pages.push('...');
      for (let i = startPage; i <= endPage; i++) pages.push(i);
      if (endPage < resolvedTotalPages - 1) pages.push('...');
      pages.push(resolvedTotalPages);
    }

    return (
      <div className={styles.pagination}>
        <button
          className={styles.paginationButton}
          onClick={() => handlePageChange(safeCurrentPage - 1)}
          disabled={safeCurrentPage === 1}
        >
          <ArrowLeft size={16} />
        </button>
        {pages.map((page, index) => (
          <button
            key={`${page}-${index}`}
            className={`${styles.pageNumber} ${page === safeCurrentPage ? styles.pageNumberActive : ''}`}
            onClick={() => typeof page === 'number' && handlePageChange(page)}
            disabled={page === '...'}
          >
            {page}
          </button>
        ))}
        <button
          className={styles.paginationButton}
          onClick={() => handlePageChange(safeCurrentPage + 1)}
          disabled={safeCurrentPage === resolvedTotalPages}
        >
          <ArrowRight size={16} />
        </button>
      </div>
    );
  };

  // ================================ TABS RENDERER ================================
  
  const renderTabs = () => {
    if (!tabs || tabs.length === 0) return null;
    const chunkTabs = (tabs: Tab[], size: number): Tab[][] => {
      const chunks: Tab[][] = [];
      for (let i = 0; i < tabs.length; i += size) {
        chunks.push(tabs.slice(i, i + size));
      }
      return chunks;
    };

    const tabChunks = chunkTabs(tabs, 7);

    return tabChunks.map((chunk: Tab[], rowIndex: number) => (
      <div key={rowIndex} className={styles.tabsRow}>
        <div className={styles.tabsContainer}>
          {chunk.map((tab: Tab, ind: number) => (
            <button
              key={tab.key}
              className={`
                ${styles.tab}
                ${pathName?.includes('setup') ? styles.tabSetup : ''}
                ${activeTab === tab.key ? styles.tabActive : ''}
                ${ind === 0 ? styles.tabEdgeLeft : ''}
                ${ind === chunk.length - 1 ? styles.tabEdgeRight : ''}
              `}
              onClick={() => onTabChange?.(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    ));
  };

  // ================================ CONTROLS BAR RENDERER ================================
  
  const renderControlsBar = () => {
  if (!enableFiltering && !enableSorting && availableFilters.length === 0)
    return null;

  return (
    <div className={styles.controlsBar}>
      <div className={styles.leftControls}>
        {enableFiltering && (
          <div
            className={`${styles.searchWrapper} ${
              searchVariant === 'card-management'
                ? styles.searchWrapperCardManagement
                : ''
            }`}
          >
            <Search size={16} className={styles.searchIcon} />

            <input
              type="text"
              className={styles.filterInput}
              placeholder={filterPlaceholder}
              value={filterTerm}
              onChange={(e) => {
                setFilterTerm(e.target.value);

                if (!isPaginationControlled)
                  setInternalCurrentPage(1);
              }}
            />
          </div>
        )}
      </div>

      <div className={styles.rightControls}>

        {/* USER TYPE */}
{userTypeOptions && selectedUserType !== undefined && (
  <div className={styles.filterGroup}>
    <label className={styles.controlLabel}>User Type</label>
    <div className={styles.selectShell}>
      <select
        className={styles.sortSelect}
        value={selectedUserType}
        onChange={(e) => onUserTypeChange?.(e.target.value)}
      >
        {userTypeOptions.map((u) => (
          <option key={u} value={u}>
            {u}
          </option>
        ))}
      </select>
    </div>
  </div>
)}

{/* CATEGORY */}
{categoryOptions && selectedCategory !== undefined && (
  <div className={styles.filterGroup}>
    <label className={styles.controlLabel}>Category</label>
    <div className={styles.selectShell}>
      <select
        className={styles.sortSelect}
        value={selectedCategory}
        onChange={(e) => onCategoryChange?.(e.target.value)}
      >
        {categoryOptions.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
    </div>
  </div>
)}

{/* SUB CATEGORY */}
{subCategoryOptions && selectedSubCategory !== undefined && (
  <div className={styles.filterGroup}>
    <label className={styles.controlLabel}>Sub Category</label>
    <div className={styles.selectShell}>
      <select
        className={styles.sortSelect}
        value={selectedSubCategory}
        onChange={(e) => onSubCategoryChange?.(e.target.value)}
      >
        {subCategoryOptions.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
    </div>
  </div>
)}

        {/* Dynamic column filters */}
        {availableFilters.map((filter) => (
          <div key={filter.key} className={styles.filterGroup}>
            <label className={styles.controlLabel}>
              {filter.label}
            </label>

            <div className={styles.selectShell}>
              <select
                className={styles.sortSelect}
                value={columnFilters[filter.key] || 'all'}
                onChange={(e) =>
                  handleColumnFilterChange(
                    filter.key,
                    e.target.value
                  )
                }
              >
                <option value="all">All</option>

                {getFilterOptions(filter.key).map((option) => (
                  <option
                    key={option.value}
                    value={option.value}
                  >
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ))}

        {/* Sort controls */}
        {enableSorting && (
          <div className={styles.sortControls}>
            <div className={styles.filterGroup}>
              <label className={styles.controlLabel}>
                Sort By
              </label>

              <div className={styles.selectShell}>
                <select
                  className={styles.sortSelect}
                  value={sortKey}
                  onChange={(e) => setSortKey(e.target.value)}
                >
                  <option value="">None</option>

                  {columns.map((column) => (
                    <option
                      key={String(column.key)}
                      value={String(column.key)}
                    >
                      {column.header}
                    </option>
                  ))}
                </select>
              </div>
            </div>
              {/* Rows Per Page (FIXED to match other controls) */}
<div className={styles.filterGroup}>
  <label className={styles.controlLabel}>
    Rows per page
  </label>

  <div className={styles.selectShell}>
    <select
      value={effectiveRowsPerPage}
      onChange={handleRowsPerPageChange}
      className={styles.sortSelect}
    >
      {[5, 10, 15, 20, 50, 100].map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  </div>
</div>
            <div className={styles.filterGroup}>
              <button
                type="button"
                className={styles.sortToggleButton}
                onClick={() =>
                  setSortDirection((d) =>
                    d === 'asc' ? 'desc' : 'asc'
                  )
                }
                disabled={!sortKey}
              >
                {sortDirection === 'asc' ? (
                  <ArrowUp size={18} />
                ) : (
                  <ArrowDown size={18} />
                )}
              </button>
            </div>
            
          </div>
        )}
      </div>
    </div>
  );
};

  // ================================ TABLE RENDERER ================================
  
  const renderTable = () => {
    if (error) {
      return (
        <div style={{ color: 'red', marginBottom: 12, padding: '12px', backgroundColor: '#ffe6e6', borderRadius: '4px' }}>
          {error instanceof Error ? error.message : error}
        </div>
      );
    }

    if (loading) {
      return (
        <div className={styles.loading}>
          <Loader variant="inline" />
        </div>
      );
    }

    if (paginatedData.length === 0) {
      return <div className={styles.emptyState}>{emptyMessage}</div>;
    }

    return (
      <table className={styles.table}>
        <thead>
          <tr>
            {columns.map((column, ind) => (
              <th key={ind} className={`${ind === 0 ? styles.tabEdgeLeft : ''} ${ind === columns.length - 1 ? styles.tabEdgeRight : ''}`}>
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {paginatedData.map((row, rowIndex) => (
            <tr key={rowIndex} className={`${rowIndex % 2 !== 0 ? styles.rowInactive : styles.rowActive} ${rowIndex === paginatedData.length - 1 ? styles.lastRow : ''}`}>
              {columns.map((column, colIndex) => (
                <td key={colIndex}>{renderCell(column, row)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  // ================================ FOOTER RENDERER ================================
  
const renderFooter = () => {
  const start = (safeCurrentPage - 1) * safeRowsPerPage + 1;
  const end = Math.min(
    safeCurrentPage * safeRowsPerPage,
    filteredAndSortedData.length
  );

  return (
    <div className={styles.footerBar}>
      
      {/* LEFT SIDE */}
      <div className={styles.footerInfo} style={{marginTop: '15px'}}>
        <p style={{ fontSize: '12px' }}>
        <span style={{ color: 'black' }}>Rows </span>
        <span style={{ color: 'green' }}>{' '} {start}-{end}</span>
          <span style={{ color: 'black' }}> of </span>
          <span style={{ color: 'green' }}>{' '} {filteredAndSortedData.length}</span>
        </p>
      </div>

      {/* RIGHT SIDE */}
      <div className={styles.footerPagination}>
        {renderPagination()}
      </div>

    </div>
  );
};

  // ================================ MAIN RENDER ================================
  
  return (
    <div className={styles.container}>
      {renderTabs()}
      {headerContent}
      
      {showAddButton && (
        <div className={styles.addButtonWrapper}>
          <button className={styles.addButton} onClick={onAddClick}>
            <Plus size={14} style={{ marginRight: 8 }} />
            {addButtonLabel}
          </button>
        </div>
      )}

      {renderControlsBar()}
      
      <div className={styles.tableWrapper}>
        {tableUpperContent}
        {renderTable()}
      </div>
      {renderFooter()}
    </div>
  );
}
