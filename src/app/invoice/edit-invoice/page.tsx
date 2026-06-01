'use client';
import React, { useEffect, useState } from 'react';
import DashboardLayout from 'components/layout/DashboardLayout';
import CommonEntityForm, { ProfileField, ProfileFormData } from 'components/forms/CommonEntityForm';
import { clearTableRow, getTableRow } from 'lib/tableRowStorage';
import Loader from 'components/ui/loader';
import { invoiceFields } from '../fields';

export default function EditInvoice() {
  const [invoiceId, setInvoiceId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState("");
  const [initialValues, setInitialValues] = useState<ProfileFormData | undefined>(undefined);

  useEffect(() => {
    const selected = getTableRow<any>('invoice');
    if (selected && selected.id) {
      setInvoiceId(selected.id);
      setInitialValues(selected);
    }
    const timeoutId = setTimeout(() => {
      clearTableRow('invoice');
    }, 5000);
    setIsLoading(false);
    return () => clearTimeout(timeoutId);
  }, []);

  const handleUpdate = async (formData: ProfileFormData) => {
    setSuccessMsg("");

    if (!invoiceId) {
      throw new Error('Invoice ID not found');
    }

    // Demo mode - just log the data
    console.log('Invoice updated (Demo):', { id: invoiceId, ...formData });
    setSuccessMsg('Invoice updated successfully!');
    setTimeout(() => {
      setSuccessMsg("");
    }, 2000);
  };

  if (isLoading) {
    return <DashboardLayout pageTitle="Edit Invoice"><Loader variant="full" /></DashboardLayout>;
  }

  // if (!invoiceId) {
  //   return <DashboardLayout pageTitle="Edit Invoice">Invoice not found</DashboardLayout>;
  // }

  return (
    <DashboardLayout pageTitle="Edit Invoice">
      <CommonEntityForm
        fields={invoiceFields}
        initialValues={initialValues}
        onSave={handleUpdate}
        title="Edit Invoice"
        saveButtonText="Update Invoice"
        successTitle="Success"
        successMessage={successMsg}
      />
    </DashboardLayout>
  );
}
