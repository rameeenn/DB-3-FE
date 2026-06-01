'use client';
import React, { useState } from 'react';
import DashboardLayout from 'components/layout/DashboardLayout';
import CommonEntityForm, { ProfileFormData } from 'components/forms/CommonEntityForm';
import { invoiceFields } from '../fields';

export default function AddInvoice() {
  const [successMsg, setSuccessMsg] = useState("");

  const handleSave = async (formData: ProfileFormData) => {
    setSuccessMsg("");

    // Demo mode - just log the data
    console.log('Invoice submitted (Demo):', formData);
    setSuccessMsg('Invoice added successfully!');
    // Reset after 2 seconds
    setTimeout(() => {
      setSuccessMsg("");
    }, 2000);
  };

  return (
    <DashboardLayout pageTitle="Add Invoice">
      <CommonEntityForm
        fields={invoiceFields}
        onSave={handleSave}
        title="Add New Invoice"
        saveButtonText="Add Invoice"
        successTitle="Success"
        successMessage={successMsg}
      />
    </DashboardLayout>
  );
}
