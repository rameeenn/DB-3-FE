import { ProfileField, ProfileFormData } from 'components/forms/CommonEntityForm';

export const invoiceFields: ProfileField[] = [
  { name: 'id' as keyof ProfileFormData, label: 'ID', type: 'text', required: true, placeholder: 'Enter ID' },
  { name: 'paymentMethod' as keyof ProfileFormData, label: 'Payment Method', type: 'select', required: true, options: [
    { value: '', label: 'Select Payment Method' },
    { value: 'Credit Card', label: 'Credit Card' },
    { value: 'Bank Transfer', label: 'Bank Transfer' },
    { value: 'Cash', label: 'Cash' },
    { value: 'Check', label: 'Check' }
  ]},
  { name: 'transactionId' as keyof ProfileFormData, label: 'Transaction ID', type: 'text', required: true, placeholder: 'Enter Transaction ID' },
  { name: 'invoiceNumber' as keyof ProfileFormData, label: 'Invoice Number', type: 'text', required: true, placeholder: 'Enter Invoice Number' },
  { name: 'tagId' as keyof ProfileFormData, label: 'Tag ID', type: 'text', required: true, placeholder: 'Enter Tag ID' },
  { name: 'entityType' as keyof ProfileFormData, label: 'Entity Type', type: 'select', required: true, options: [
    { value: '', label: 'Select Entity Type' },
    { value: 'User', label: 'User' },
    { value: 'Vehicle', label: 'Vehicle' },
    { value: 'Tag', label: 'Tag' },
    { value: 'Other', label: 'Other' }
  ]},
  { name: 'status' as keyof ProfileFormData, label: 'Status', type: 'statusSwitch', required: false },
];

export const mockInvoiceData: ProfileFormData = {};
