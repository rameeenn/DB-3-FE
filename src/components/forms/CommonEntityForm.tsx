
"use client";

import React, { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import styles from './ProfileForm.module.css';
import SuccessModal from '../popup/SuccessModal';
import WarningModal from '../popup/WarningModal';
import Loader from '../ui/loader';
import { normalizeFormStatuses } from '../../lib/statusUtils';
import { formatCardNumberDisplay, stripCardNumberFormatting } from '../../lib/formatCardNumber';
import { isLikelyImageUrl } from '../../lib/resolveMediaUrl';
import type { ProfileField, ProfileFormData } from './FormTypes';
import {
  DateInputField,
  FileInputField,
  RadioCardInputField,
  SelectInputField,
  TextInputField,
  ToggleInputField,
  StatusSwitchInputField,
} from './CommonFormFields';
export type { ProfileField, ProfileFormData } from './FormTypes';

interface CommonEntityFormProps {
  onCancel?: () => void;
  onSave?: (data: ProfileFormData) => void | boolean | Record<string, any> | Promise<void | boolean | Record<string, any>>;
  initialValues?: Partial<ProfileFormData> | any;
  title?: string;
  saveButtonText?: string;
  cancelButtonText?: string;
  loading?: boolean;
  showStatusToggle?: boolean;
  fields?: ProfileField[];
  successTitle?: string;
  successMessage?: string;
  error?: string;
  isViewMode?: boolean;
}

const toVehicleLicensePlate = (vehicleNo?: string, vehicleNo2?: string) => {
  const firstPart = (vehicleNo ?? '').trim();
  const secondPart = (vehicleNo2 ?? '').trim();

  if (!firstPart && !secondPart) {
    return '';
  }
  return `${firstPart}-${secondPart}`;
};

const withDerivedVehicleLicensePlate = (data: ProfileFormData): ProfileFormData => {
  const hasVehicleFields = data.vehicleNo !== undefined || data.vehicleNo2 !== undefined || data.licensePlate !== undefined;

  if (!hasVehicleFields) {
    return data;
  }

  return {
    ...data,
    licensePlate: toVehicleLicensePlate(data.vehicleNo, data.vehicleNo2),
  };
};

const toDigitsOnly = (value: unknown): string => String(value ?? '').replace(/\D/g, '');

const formatCnicValue = (value: unknown): string => {
  const digits = toDigitsOnly(value).slice(0, 13);

  if (!digits) return '';
  if (digits.length <= 5) return digits;
  if (digits.length <= 12) return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12)}`;
};

const formatPhoneValue = (value: unknown): string => {
  const raw = String(value ?? '').trim();
  if (!raw) return '';

  let digits = toDigitsOnly(raw);
  if (digits.startsWith('92')) {
    digits = `0${digits.slice(2)}`;
  }

  digits = digits.slice(0, 11);
  if (!digits) return '';
  if (digits.length <= 4) return digits;

  return `${digits.slice(0, 4)}-${digits.slice(4)}`;
};

const CNIC_FIELD_NAMES = new Set(['cnic', 'idNumber']);
const PHONE_FIELD_NAMES = new Set(['phoneNumber', 'cellNumber', 'cellNumber1', 'cellNumber2', 'nextOfKinNumber']);
const CARD_DISPLAY_FIELD_NAMES = new Set(['cardNo', 'rfidCardNo', 'residentCardNo']);

const formatValueByFieldName = (fieldName: string, value: unknown): string => {
  if (value === null || value === undefined) return '';

  if (CNIC_FIELD_NAMES.has(fieldName)) {
    return formatCnicValue(value);
  }

  if (PHONE_FIELD_NAMES.has(fieldName)) {
    return formatPhoneValue(value);
  }

  if (CARD_DISPLAY_FIELD_NAMES.has(fieldName)) {
    return formatCardNumberDisplay(value);
  }

  return String(value);
};

const withFormattedIdentityAndPhoneFields = (data: ProfileFormData): ProfileFormData => {
  const nextData: Record<string, unknown> = { ...data };

  Object.keys(nextData).forEach((key) => {
    if (!CNIC_FIELD_NAMES.has(key) && !PHONE_FIELD_NAMES.has(key)) {
      return;
    }
    nextData[key] = formatValueByFieldName(key, nextData[key]);
  });

  return nextData as ProfileFormData;
};

const withFormattedCardNumberFields = (data: ProfileFormData): ProfileFormData => {
  const nextData: Record<string, unknown> = { ...data };
  CARD_DISPLAY_FIELD_NAMES.forEach((key) => {
    if (nextData[key] === undefined || nextData[key] === null || nextData[key] === '') {
      return;
    }
    nextData[key] = formatCardNumberDisplay(nextData[key]);
  });
  return nextData as ProfileFormData;
};

const withStrippedCardNumberFieldsForSubmit = (data: ProfileFormData): ProfileFormData => {
  const next: Record<string, unknown> = { ...data };
  CARD_DISPLAY_FIELD_NAMES.forEach((key) => {
    if (next[key] === undefined || next[key] === null) {
      return;
    }
    const stripped = stripCardNumberFormatting(next[key]);
    next[key] = stripped;
  });
  return next as ProfileFormData;
};
export default function CommonEntityForm({
  onCancel,
  onSave,
  initialValues = {},
  title = 'Please provide details below!',
  saveButtonText = 'Add',
  cancelButtonText = 'Cancel',
  loading = false,
  showStatusToggle = true,
  fields = [],
  successTitle,
  successMessage,
  error,
  isViewMode = false,
}: CommonEntityFormProps) {
  const pathname = usePathname();
  const router = useRouter();
  let pageName = pathname?.split('/')[1] ?? '';
  pageName = pageName.charAt(0).toUpperCase() + pageName.slice(1);
  if (pageName.includes('Residential')) {
    pageName = 'Member';
  } else pageName = '';
  const isCompactModal = title.trim() === '';

  const normalizedInitialValues = React.useMemo(() => {
    const statusFieldNames = fields
      .filter((field) => field.type === 'statusSwitch')
      .map((field) => String(field.name));

    if ('isActive' in initialValues) {
      statusFieldNames.push('isActive');
    }

    const normalizedData = normalizeFormStatuses({ ...initialValues }, statusFieldNames);
    const formattedData = withFormattedCardNumberFields(withFormattedIdentityAndPhoneFields(normalizedData));

    return withDerivedVehicleLicensePlate(formattedData);
  }, [fields, initialValues]);

  const [formData, setFormData] = useState<ProfileFormData>(
    normalizedInitialValues
  );
  const [isActive, setIsActive] = useState(initialValues.isActive ?? true);
  const lastSyncedInitialValuesRef = React.useRef(JSON.stringify(normalizedInitialValues));
  React.useEffect(() => {
    const serialized = JSON.stringify(normalizedInitialValues);
    if (serialized !== lastSyncedInitialValuesRef.current) {
      setFormData(normalizedInitialValues);
      lastSyncedInitialValuesRef.current = serialized;
    }
    setIsActive(initialValues.isActive ?? true);
  }, [initialValues, normalizedInitialValues]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [warningTitle, setWarningTitle] = useState('Required Fields Missing');
  const [warningMessage, setWarningMessage] = useState('');

  React.useEffect(() => {
    if (error) {
      setWarningTitle('Request Failed');
      setWarningMessage(error);
      setShowWarning(true);
    }
  }, [error]);
  

  // Helper for phone number masking and blocking further input
  const formatAndLimitPhone = (raw: string) => {
    // Remove all non-digits
    let digits = raw.replace(/\D/g, '');
    // Format for +92 3XX YYYYYYY
    if (digits.startsWith('92')) {
      digits = '+' + digits;
    }
    if (digits.startsWith('+92')) {
      // +92 3XX YYYYYYY
      if (digits.length > 12) digits = digits.slice(0, 12);
      let formatted = '+92 ';
      if (digits.length > 3) {
        formatted += digits.slice(3, 4); // 3
      }
      if (digits.length > 4) {
        formatted += digits.slice(4, 6); // XX
      }
      if (digits.length > 6) {
        formatted += ' ' + digits.slice(6, 13); // YYYYYYY
      }
      return formatted.trim();
    }
    // Format for 03XX-YYYYYYY
    if (digits.startsWith('03')) {
      if (digits.length > 11) digits = digits.slice(0, 11);
      let formatted = digits.slice(0, 4);
      if (digits.length > 4) {
        formatted += '-' + digits.slice(4, 11);
      }
      return formatted;
    }
    // Default: just digits, max 12
    return digits.slice(0, 12);
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = event.target;

    // Phone/cell masking and block further input
    if (name === 'phoneNumber' || name === 'cellNumber' || name === 'cellNumber1' || name === 'cellNumber2' || name === 'nextOfKinNumber') {
      const formatted = formatAndLimitPhone(value);
      setFormData((prev) => ({
        ...prev,
        [name]: formatted
      }));
      return;
    }

    // CNIC masking and block further input (XXXXX-XXXXXXX-X)
    if (name === 'cnic') {
      // Only allow digits, auto-insert dashes, max length 15
      let digits = value.replace(/\D/g, '');
      let formatted = '';
      if (digits.length > 5) {
        formatted += digits.slice(0, 5) + '-';
        if (digits.length > 12) {
          formatted += digits.slice(5, 12) + '-';
          formatted += digits.slice(12, 13);
        } else if (digits.length > 5) {
          formatted += digits.slice(5, 12);
        }
      } else {
        formatted = digits;
      }
      if (formatted.length > 15) formatted = formatted.slice(0, 15);
      setFormData((prev) => ({ ...prev, [name]: formatted }));
      return;
    }



    // Vehicle No: only alphabet, max 4
    if (name === 'vehicleNo') {
      let alpha = value.replace(/[^A-Za-z]/g, '');
      if (alpha.length > 4) alpha = alpha.slice(0, 4);
      setFormData((prev) => ({ ...prev, [name]: alpha }));
      return;
    }

    // Vehicle No 2: only numeric, max 4
    if (name === 'vehicleNo2') {
      let numeric = value.replace(/\D/g, '');
      if (numeric.length > 4) numeric = numeric.slice(0, 4);
      setFormData((prev) => withDerivedVehicleLicensePlate({ ...prev, [name]: numeric }));
      return;
    }

    // eTagId (RFID) and tagNumber: format as 1234 5678 1234 5678, allow only 16 digits
    if (name === 'eTagId') {
      let digits = value.replace(/\D/g, '');
      if (digits.length > 16) digits = digits.slice(0, 16);
      // Insert space every 4 digits
      let formatted = '';
      for (let i = 0; i < digits.length; i += 4) {
        if (i > 0) formatted += ' ';
        formatted += digits.slice(i, i + 4);
      }
      setFormData((prev) => ({ ...prev, [name]: formatted }));
      return;
    }

    if (name === 'cardNo' || name === 'rfidCardNo') {
      let digits = value.replace(/\D/g, '');
      if (digits.length > 16) digits = digits.slice(0, 16);
      let formatted = '';
      for (let i = 0; i < digits.length; i += 4) {
        if (i > 0) formatted += ' ';
        formatted += digits.slice(i, i + 4);
      }
      setFormData((prev) => ({ ...prev, [name]: formatted }));
      return;
    }

    if (name === 'residentCardNo') {
      let digits = value.replace(/\D/g, '');
      if (digits.length > 32) digits = digits.slice(0, 32);
      let formatted = '';
      for (let i = 0; i < digits.length; i += 4) {
        if (i > 0) formatted += ' ';
        formatted += digits.slice(i, i + 4);
      }
      setFormData((prev) => ({ ...prev, [name]: formatted }));
      return;
    }

    if (name === 'feeScaleId') {
      console.log('[CommonEntityForm] feeScaleId change', value);
    }

    if (name === 'licensePlate') {
      return;
    }

    // Numeric-only enforcement for percentage fields
    const numericPercentageFields = new Set(['taxPercentage', 'discountPercentage', 'mdrPercentage', 'fedTaxPercentage']);
    if (numericPercentageFields.has(name)) {
      let cleaned = String(value ?? '').replace(/[^0-9.]/g, '');
      // allow only one decimal point
      const parts = cleaned.split('.');
      if (parts.length > 2) {
        cleaned = parts[0] + '.' + parts.slice(1).join('');
      }
      // trim leading zeros except single zero
      if (/^0\d+/.test(cleaned)) {
        cleaned = cleaned.replace(/^0+(\d)/, '$1');
      }
      setFormData((prev) => withDerivedVehicleLicensePlate({ ...prev, [name]: cleaned }));
      return;
    }

    if (type === 'checkbox') {
      setFormData((prev) => ({ ...prev, [name]: (event.target as HTMLInputElement).checked }));
      return;
    }

    // Auto-fill validFrom and validTo when planType changes
    if (name === 'planType') {
      console.log('[CommonEntityForm] planType changed to:', value, 'type:', typeof value);
      const today = new Date();
      const validFrom = today.toISOString().split('T')[0];
      let validTo = validFrom;
      let daysToAdd = 0;
      
      // Convert to number for comparison
      const planTypeNum = Number(value);
      console.log('[CommonEntityForm] planTypeNum:', planTypeNum);
      
      switch (planTypeNum) {
        case 1: // Day
          daysToAdd = 1;
          break;
        case 2: // Week
          daysToAdd = 7;
          break;
        case 3: // Month
          daysToAdd = 30;
          break;
        case 4: // Year
          daysToAdd = 365;
          break;
        default:
          daysToAdd = 0;
      }
      
      console.log('[CommonEntityForm] daysToAdd:', daysToAdd);
      
      if (daysToAdd > 0) {
        const toDate = new Date(today);
        toDate.setDate(toDate.getDate() + daysToAdd);
        validTo = toDate.toISOString().split('T')[0];
      }
      
      console.log('[CommonEntityForm] validFrom:', validFrom, 'validTo:', validTo);
      setFormData((prev) => withDerivedVehicleLicensePlate({ ...prev, [name]: value, validFrom, validTo }));
      return;
    }
    setFormData((prev) => withDerivedVehicleLicensePlate({ ...prev, [name]: value }));
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, field: keyof ProfileFormData) => {
    const file = event.target.files?.[0] || null;
    setFormData((prev) => ({ ...prev, [field]: file }));
  };

  const isApiSuccess = (response: any) => {
    if (response === undefined || response === null) {
      return true;
    }

    if (typeof response === 'boolean') {
      return response;
    }

    if (typeof response?.statusCode === 'number') {
      return [0, 200, 201, 204].includes(response.statusCode);
    }

    if (typeof response?.success === 'boolean') {
      return response.success;
    }

    if (typeof response?.status === 'number') {
      return response.status >= 200 && response.status < 300;
    }

    return true;
  };

  const handleSubmit = async () => {

    const missingRequiredFields = fields
      .filter((field) => field.required)
      .filter((field) => {
        const value = formData[field.name];

        if (value === null || value === undefined) {
          return true;
        }

        if (typeof value === 'boolean') {
          return false;
        }

        if (typeof value === 'number') {
          return false;
        }

        if (value instanceof File) {
          return false;
        }

        return String(value).trim() === '';
      });

    if (missingRequiredFields.length > 0) {
      setWarningTitle('Required Fields Missing');
      setWarningMessage(`Please fill all required fields: ${missingRequiredFields.map((field) => field.label).join(', ')}.`);
      setShowWarning(true);
      return;
    }


    // eTagId (RFID) and tagNumber validation: must be exactly 16 digits, formatted as 1234 5678 1234 5678
    for (const field of ['eTagId']) {
      if (formData[field]) {
        const digits = formData[field].replace(/\D/g, '');
        if (digits.length !== 16) {
          setWarningTitle('Validation Error');
          setWarningMessage(`${field === 'eTagId' || 'Vehicle E-Tag ID (RFID)'} must be exactly 16 digits.`);
          setShowWarning(true);
          return;
        }
        if (!/^\d{4}( \d{4}){3}$/.test(formData[field])) {
          setWarningTitle('Validation Error');
          setWarningMessage(`${field === 'eTagId' || 'Vehicle E-Tag ID (RFID)'} must be in the format 1234 5678 1234 5678.`);
          setShowWarning(true);
          return;
        }
      }
    }

    // Card No validation: 1234 5678 1234 5678
    if (formData.cardNo && !/^\d{4} \d{4} \d{4} \d{4}$/.test(formData.cardNo)) {
      setWarningTitle('Validation Error');
      setWarningMessage('Card No must be in the format 1234 5678 1234 5678.');
      setShowWarning(true);
      return;
    }

    if (formData.rfidCardNo && !/^\d{4}( \d{4}){3}$/.test(formData.rfidCardNo)) {
      setWarningTitle('Validation Error');
      setWarningMessage('RFID Card No must be in the format 1234 5678 1234 5678.');
      setShowWarning(true);
      return;
    }

    if (formData.residentCardNo) {
      const d = stripCardNumberFormatting(formData.residentCardNo);
      if (d && !/^\d+$/.test(d)) {
        setWarningTitle('Validation Error');
        setWarningMessage('Resident Card No must contain digits only.');
        setShowWarning(true);
        return;
      }
    }

    // Tag Number 18-digit validation removed as requested
    console.log('[CommonEntityForm] submit clicked', formData);

    // Custom validations
    // Contact No: 11 digits (phoneNumber or cellNumber)
    if (formData.phoneNumber && !/^\d{11}$/.test(formData.phoneNumber) && !/^\+92 3\d{2} \d{7}$/.test(formData.phoneNumber) && !/^03\d{2}-\d{7}$/.test(formData.phoneNumber)) {
      setWarningTitle('Validation Error');
      setWarningMessage('Contact Number must be exactly 11 digits.');
      setShowWarning(true);
      return;
    }
    if (formData.cellNumber && !/^\d{11}$/.test(formData.cellNumber) && !/^\+92 3\d{2} \d{7}$/.test(formData.cellNumber) && !/^03\d{2}-\d{7}$/.test(formData.cellNumber)) {
      setWarningTitle('Validation Error');
      setWarningMessage('Contact Number must be exactly 11 digits.');
      setShowWarning(true);
      return;
    }
    // CNIC: 13 digits
    if (formData.cnic && (!/^\d{13}$/.test(formData.cnic) && !/^\d{5}-\d{7}-\d{1}$/.test(formData.cnic))) {
      setWarningTitle('Validation Error');
      setWarningMessage('CNIC must be exactly 13 digits.');
      setShowWarning(true);
      return;
    }

    // Email validation for both 'email' and 'emailAddress' fields
    const emailToValidate = formData.email || formData.emailAddress;
    if (emailToValidate && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailToValidate)) {
      setWarningTitle('Validation Error');
      setWarningMessage('Please enter a valid email address.');
      setShowWarning(true);
      return;
    }

    if(formData.licensePlate && !/^[A-Za-z]+-\d+$/.test(formData.licensePlate)) {
      setWarningTitle('Validation Error');
      setWarningMessage('License Plate must be in format ABC-123.');
      setShowWarning(true);
      return;
    }

    setIsSubmitting(true);
    try {
      let saveResult: void | boolean | Record<string, any> = true;
      if (onSave) {
        const payload = withStrippedCardNumberFieldsForSubmit(
          withDerivedVehicleLicensePlate({ ...formData, isActive })
        );
        saveResult = await onSave(payload);
      }

      if (isApiSuccess(saveResult)) {
        setShowSuccess(true);
      }
    } catch (err: any) {
      setWarningTitle('Request Failed');
      setWarningMessage(err?.response?.data?.errorMessage || err?.message || 'Failed to save record.');
      setShowWarning(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderField = (field: ProfileField, wrapperClassName?: string) => {
    const rawValue = formData[field.name];
    const resolvedValue =
      isViewMode && (rawValue === null || rawValue === undefined || String(rawValue).trim() === '')
        ? 'N/A'
        : rawValue;
    const displayValue = formatValueByFieldName(String(field.name), resolvedValue);
    const viewModeSelectLabel =
      isViewMode && (field.type === 'select' || field.type === 'radio')
        ? field.options?.find((option) => String(option.value) === String(rawValue))?.label || displayValue
        : displayValue;

    if (isViewMode && field.type === 'file') {
      const rawStr = typeof rawValue === 'string' ? rawValue.trim() : '';
      const url = /^https:\/\//i.test(rawStr) ? rawStr : '';
      const isImage = Boolean(url) && isLikelyImageUrl(url);
      const fieldLayoutStyle: React.CSSProperties = {
        ...(field.fieldWidth !== undefined
          ? { width: typeof field.fieldWidth === 'number' ? `${field.fieldWidth}px` : field.fieldWidth }
          : {}),
        ...(field.fieldHeight !== undefined
          ? { minHeight: typeof field.fieldHeight === 'number' ? `${field.fieldHeight}px` : field.fieldHeight }
          : {}),
        ...(field.colSpan ? { gridColumn: `span ${field.colSpan}` } : {}),
      };
      const useCircularImagePreview =
        field.name === 'profilePicture' || field.name === 'cnicFront' || field.name === 'cnicBack';
      return (
        <div
          key={String(field.name)}
          className={`${styles.capsule} ${wrapperClassName ?? ''}`.trim()}
          style={fieldLayoutStyle}
        >
          <label className={styles.labelGreen}>
            {field.label}
            {field.required && <span style={{ color: '#ff1744', marginLeft: '4px' }}>*</span>}
          </label>
          {url && isImage ? (
            <div style={{ marginTop: 6 }}>
              <img
                src={url}
                alt=""
                style={
                  useCircularImagePreview
                    ? {
                        width: 96,
                        height: 96,
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: '1px solid #e5e7eb',
                        display: 'block',
                      }
                    : {
                        maxWidth: '100%',
                        maxHeight: 200,
                        objectFit: 'contain',
                        borderRadius: 8,
                        border: '1px solid #e5e7eb',
                        display: 'block',
                      }
                }
              />
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'inline-block', marginTop: 8, fontSize: 11, fontWeight: 500, color: 'var(--primary, #27ae60)' }}
              >
                Open full size
              </a>
            </div>
          ) : (
            <input type="text" readOnly className={styles.input} value="N/A" tabIndex={-1} aria-readonly />
          )}
        </div>
      );
    }

    if (isViewMode && field.type !== 'statusSwitch') {
      return (
        <TextInputField
          key={field.name}
          field={{ ...field, type: 'text', readOnly: true }}
          value={viewModeSelectLabel}
          onChange={handleInputChange}
          styles={styles}
          wrapperClassName={wrapperClassName}
        />
      );
    }

    if (field.type === 'file') {
      return (
        <FileInputField
          key={field.name}
          field={field}
          formData={formData}
          onFileChange={handleFileChange}
          styles={styles}
          wrapperClassName={wrapperClassName}
        />
      );
    }

    if (field.type === 'select') {
      return (
        <SelectInputField
          key={field.name}
          field={field}
          value={typeof resolvedValue === 'string' ? resolvedValue : ''}
          onChange={handleInputChange}
          styles={styles}
          wrapperClassName={wrapperClassName}
        />
      );
    }

    if (field.type === 'date') {
      return (
        <DateInputField
          key={field.name}
          field={field}
          value={typeof resolvedValue === 'string' ? resolvedValue : ''}
          onChange={handleInputChange}
          styles={styles}
          wrapperClassName={wrapperClassName}
        />
      );
    }

    if (field.type === 'radio') {
      return (
        <RadioCardInputField
          key={field.name}
          field={field}
          value={typeof resolvedValue === 'string' ? resolvedValue : ''}
          onChange={handleInputChange}
          styles={styles}
          wrapperClassName={wrapperClassName}
        />
      );
    }

    if (field.type === 'toggle') {
      return (
        <ToggleInputField
          key={field.name}
          field={field}
          checked={!!resolvedValue}
          onChange={handleInputChange}
          styles={styles}
          wrapperClassName={wrapperClassName}
        />
      );
    }

    if (field.type === 'statusSwitch') {
      return (
        <StatusSwitchInputField
          key={field.name}
          field={field}
          checked={!!resolvedValue}
          onChange={handleInputChange}
          styles={styles}
          wrapperClassName={wrapperClassName}
        />
      );
    }

    // For phone/cell fields, pass maxLength to block further input
    if (field.name === 'phoneNumber' || field.name === 'cellNumber') {
      // maxLength: +92 3XX YYYYYYY = 13, 03XX-YYYYYYY = 12
      // Use 13 to allow both
      return (
        <TextInputField
          key={field.name}
          field={field}
          value={typeof resolvedValue === 'string' ? resolvedValue : ''}
          onChange={handleInputChange}
          styles={styles}
          wrapperClassName={wrapperClassName}
          maxLength={13}
        />
      );
    }
    // For CNIC field, pass maxLength 15
    if (field.name === 'cnic') {
      return (
        <TextInputField
          key={field.name}
          field={field}
          value={typeof resolvedValue === 'string' ? resolvedValue : ''}
          onChange={handleInputChange}
          styles={styles}
          wrapperClassName={wrapperClassName}
          maxLength={15}
        />
      );
    }
    // For vehicleNo field, only alphabet, maxLength 4
    if (field.name === 'vehicleNo') {
      return (
        <TextInputField
          key={field.name}
          field={field}
          value={typeof resolvedValue === 'string' ? resolvedValue : ''}
          onChange={handleInputChange}
          styles={styles}
          wrapperClassName={wrapperClassName}
          maxLength={4}
        />
      );
    }
    // For vehicleNo2 field, only numeric, maxLength 4
    if (field.name === 'vehicleNo2') {
      return (
        <TextInputField
          key={field.name}
          field={field}
          value={typeof resolvedValue === 'string' ? resolvedValue : ''}
          onChange={handleInputChange}
          styles={styles}
          wrapperClassName={wrapperClassName}
          maxLength={4}
        />
      );
    }
    return (
      <TextInputField
        key={field.name}
        field={field}
        value={typeof resolvedValue === 'string' ? resolvedValue : ''}
        onChange={handleInputChange}
        styles={styles}
        wrapperClassName={wrapperClassName}
      />
    );
  };

  const renderedFields: React.ReactNode[] = [];

  const getFieldClassName = (baseClassName?: string, isHidden?: boolean) => {
    if (!isHidden) {
      return baseClassName;
    }

    return [baseClassName, styles.hiddenCapsule].filter(Boolean).join(' ');
  };

  // Separate statusSwitch fields for header, others for grid
  const statusSwitchFields = fields.filter(f => f.type === 'statusSwitch');
  for (let index = 0; index < fields.length; index += 1) {
    const field = fields[index];
    if (field.type === 'statusSwitch') continue; // skip from grid
    if (!field.sameCellKey) {
      renderedFields.push(renderField(field, getFieldClassName(undefined, field.isHidden)));
      continue;
    }
    const groupedFields: ProfileField[] = [field];
    let nextIndex = index + 1;
    while (nextIndex < fields.length && fields[nextIndex].sameCellKey === field.sameCellKey) {
      groupedFields.push(fields[nextIndex]);
      nextIndex += 1;
    }
    index = nextIndex - 1;
    renderedFields.push(
      <div
        key={`same-cell-${field.sameCellKey}-${field.name}`}
        className={styles.groupedCell}
        style={{ gridColumn: field.colSpan ? `span ${field.colSpan}` : undefined }}
      >
        <div
          className={styles.groupedCellGrid}
          style={{
            gridTemplateColumns: `repeat(${field.sameCellColumns ?? groupedFields.length}, minmax(0, 1fr))`,
          }}
        >
          {groupedFields.map((groupField) => renderField(groupField, getFieldClassName(styles.groupedCellItem, groupField.isHidden)))}
        </div>
      </div>
    );
  }

  const normalizedSaveAction = saveButtonText.toLowerCase();
  const isEditMode = normalizedSaveAction.includes('edit') || normalizedSaveAction.includes('update');

  if (loading || isSubmitting) {
    return <Loader />;
  }

    return (
    <>
    <div className={styles.formContainer}>
      <div className={styles.innerForm}>
        <div className={styles.formHeader}>
          {title ? <h2 className={styles.formTitle}>{title}</h2> : null}
          {statusSwitchFields.length > 0 && (
            <div className={styles.statusWrapper} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              {statusSwitchFields.map(field => (
                <StatusSwitchInputField
                  key={field.name as string}
                  field={field}
                  checked={!!formData[field.name]}
                  onChange={handleInputChange}
                  disabled={isViewMode}
                  styles={styles}
                  wrapperClassName={styles.statusToggle}
                />
              ))}
            </div>
          )}
        </div>
        <div className={styles.formGrid}>
          {renderedFields}
        </div>
      </div>

      {!isViewMode && (
        <div className={`${styles.formActions} ${isCompactModal ? styles.compactFormActions : ''}`.trim()}>
          <button type="button" className={styles.cancelButton} onClick={onCancel} disabled={loading}>
            {cancelButtonText}
          </button>
          <button type="button" className={styles.saveButton} onClick={handleSubmit} disabled={loading}>
            {loading ? 'Saving...' : saveButtonText}
          </button>
        </div>
      )}
    </div>
    <SuccessModal
      isOpen={showSuccess}
      onClose={() => {
        setShowSuccess(false);
        router.back();
      }}
      title={successTitle || (isEditMode ? 'Record Updated' : 'Record Added')}
      message={successMessage || (isEditMode ? 'The record has been updated successfully.' : 'The record has been added successfully.')}
    />
    <WarningModal
      isOpen={showWarning}
      onClose={() => setShowWarning(false)}
      onConfirm={() => setShowWarning(false)}
      title={warningTitle}
      message={warningMessage}
      confirmText="OK"
      cancelText=""
    />
    </>
  );
}


