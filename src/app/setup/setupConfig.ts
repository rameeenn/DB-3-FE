import { Tab } from '@/components/tables/DataTable';
export type SetupTab = {
  key: string;
  label: string;
};

export const SETUP_TABS: SetupTab[] = [
  { key: 'cp-agent', label: 'CP/Agent' },
  { key: 'bank-account', label: 'Bank Account' },
  { key: 'employee', label: 'Employee' },
  { key: 'vendor-supplier', label: 'Vendor / Supplier' },
  { key: 'phase', label: 'Phase' },
  { key: 'zone', label: 'Zone' },
  { key: 'fee-scale', label: 'Fee Scale' },
  { key: 'invoice', label: 'Invoice' },
  { key: 'tag', label: 'Tag' },
  { key: 'tag-approval', label: 'Approve' },
  { key: 'tag-log', label: 'Approved tags' },
  { key: 'tag-type', label: 'Tag Type' },
  { key: 'newcard', label: 'Card Management' }
];

export const getAddButtonLabel = (tab: string): string => {
  switch (tab) {
    case 'cp-agent':
      return 'Add CP/Agent';
    case 'bank-account':
      return 'Add Bank Account';
    case 'employee':
      return 'Add Employee';
    case 'vendor-supplier':
      return 'Add Vendor/Supplier';
    case 'package-type':
      return 'Add Package Type';
    case 'fee-scale':
      return 'Add Fee Scale';
    case 'invoice':
      return 'Add Invoice';
    case 'dha-x-halcon':
      return 'Add Record';
    case 'card-management':
      return 'Add Card';
    case 'phase':
      return 'Add Phase';
    case 'zone':
      return 'Add Zone';
    case 'tag':
      return 'Create Tag';
    case 'tag-approval':
      return 'Request Approval';
    case 'tag-type':
      return 'Add Tag Type';
    default:
      return 'Add New';
  }
};

export const ROUTE_MAP: { [key: string]: string } = {
  'employee': '/setup/employee?modal=add',
  'zone': '/setup/zone?modal=add',
  'cp-agent': '/setup/cp-agent?modal=add',
  'bank-account': '/setup/bank-account?modal=add',
  'vendor-supplier': '/setup/vendor-supplier?modal=add',
  'package-type': '/setup/package-type?modal=add',
  'phase': '/setup/phase?modal=add',
  'fee-scale': '/setup/fee-scale?modal=add',
  'invoice': '/setup/invoice?modal=add',
  //'dha-x-halcon': '/setup/dha-x-halcon',
  'card-management': '/setup/newcard',
  'tag': '/setup/tag?modal=add',
  'tag-type': '/setup/tag-type?modal=add',
  'tag-approval': '/setup/tag-approval?modal=add',
};
