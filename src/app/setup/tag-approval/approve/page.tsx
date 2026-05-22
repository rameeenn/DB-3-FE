
'use client';
import DashboardLayout from '../../../../components/layout/DashboardLayout';
import CommonEntityForm, { ProfileField, ProfileFormData } from '../../../../components/forms/CommonEntityForm';
import { useEffect, useState } from 'react';
import { getEnumMetadata } from '../../../../services/enum.service';
import { useSearchParams } from 'next/navigation';
import { useGetTagApprovalRequestById } from '../../../../hooks/tag-approval/useGetTagApprovalRequestById';

import { useFeeScales } from '../../../../hooks/fees/useFeeScales';
import type { FeeScale } from '../../../../types/fees.types';
import { useZones } from '../../../../hooks/zone/useZones';
import { useGetAllTagTypes } from '../../../../hooks/tagtype/useGetAllTagTypes';
import { useApproveTagApprovalRequest } from '../../../../hooks/tag-approval/useApproveTagApprovalRequest';
import {
  normalizeApprovalDateRange,
  normalizeTagNumberForApi,
  resolveTagTypeIdForApproval,
  ApproveTagApprovalRequestPayload,
} from '../../../../services/approval.service';

export default function AddNewTag() {
  const searchParams = useSearchParams();
  const id = searchParams?.get('id') || '';
  const { data, isLoading, isError } = useGetTagApprovalRequestById(id, !!id);
  const { data: feeScaleData, isLoading: isFeeScaleLoading } = useFeeScales();
  const { data: zoneData, isLoading: isZoneLoading } = useZones();

  const { mutateAsync: approveTagRequest, isPending: isApprovePending } = useApproveTagApprovalRequest();
  const { data: tagTypeData, isLoading: isTagTypeLoading } = useGetAllTagTypes();

  // State to track form data for auto-filling dates
  const [planType, setPlanType] = useState<string>('');
  const [calculatedDates, setCalculatedDates] = useState<{ validFrom: string; validTo: string }>({ validFrom: '', validTo: '' });
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Calculate dates based on plan type - returns an object with validFrom and validTo
  const calculateDatesByPlanType = (type: string | Number) => {
    if (!type) {
      return { validFrom: '', validTo: '' };
    }

    const today = new Date();
    const startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    let daysToAdd = 0;

    // Convert type to number for switch comparison
    const typeNum = Number(type);

    // Map plan types to days based on actual enum: Day(1), Week(2), Month(3), Year(4)
    switch (typeNum) {
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

    if (daysToAdd >= 0) {
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + daysToAdd);
      console.log(endDate)

      return {
        validFrom: startDate.toISOString().split('T')[0],
        validTo: endDate.toISOString().split('T')[0],
      };
    }

    return { validFrom: '', validTo: '' };
  };

  // Update calculated dates whenever plan type changes
  useEffect(() => {
    if (planType) {
      const dates = calculateDatesByPlanType(planType);
      console.log('Plan Type Changed:', planType, 'Calculated Dates:', dates);
      setCalculatedDates(dates);
    }
  }, [planType]);

  // PlanType enum options state
  const [planTypeOptions, setPlanTypeOptions] = useState([
    { value: '', label: 'Select Plan Type' }
  ]);
  useEffect(() => {
    async function fetchPlanTypeOptions() {
      try {
        const res = await getEnumMetadata({ EnumType: 'PlanType' });
        const planTypeEnum = res.data.enums.find(e => e.name === 'PlanType');
        if (planTypeEnum) {
          setPlanTypeOptions([
            { value: '', label: 'Select Plan Type' },
            ...planTypeEnum.members.map(m => ({ value: m.value.toString(), label: m.name }))
          ]);
        }
      } catch {
        // fallback: leave as default
      }
    }
    fetchPlanTypeOptions();
  }, []);

  const toDateInputValue = (value?: string | null) => {
    if (!value) {
      return '';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '';
    }

    if (date.getFullYear() <= 1) {
      return '';
    }

    return date.toISOString().split('T')[0];
  };

  const toIsoDate = (value?: string | null) => {
    if (!value) {
      return new Date().toISOString();
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return new Date().toISOString();
    }

    return date.toISOString();
  };

  const toStatusValue = (value?: string | number | boolean | null) => {
    if (value === null || value === undefined) {
      return 0;
    }

    if (typeof value === 'boolean') {
      return value ? 1 : 0;
    }

    if (typeof value === 'number') {
      return value;
    }

    const parsed = Number(value);
    if (Number.isNaN(parsed)) {
      return 0;
    }

    return parsed;
  };

  const toStatusFlag = (value?: string | number | boolean | null) => {
    if (value === null || value === undefined) {
      return false;
    }

    if (typeof value === 'boolean') {
      return value;
    }

    if (typeof value === 'number') {
      return value === 1;
    }

    const normalized = value.toLowerCase();
    return normalized === '1' || normalized === 'active' || normalized === 'true';
  };

  // Build Fee Scale options for dropdown with placeholder
  const feeScaleOptions = [
    { value: '', label: 'Select Fee Scale' },
    ...((feeScaleData?.data?.map((fee: FeeScale) => ({ value: fee.id, label: fee.name })) || [])),
  ];
  const zoneOptions = [
    { value: '', label: 'Select Zone' },
    ...(zoneData?.data?.map((zone) => ({ value: zone.id, label: zone.name })) || []),
  ];

  const subjectType = data?.data?.subjectType?.trim().toLowerCase() || '';
  const hidePassSpecificFields = subjectType.includes('visitor') || subjectType.includes('luggage');
  const isQrTagType = Boolean(data?.data?.tagType?.trim().toLowerCase().includes('qr'));

  const passSpecificFields: ProfileField[] = hidePassSpecificFields ? [] : [
    {
      name: 'feeScaleId' as keyof ProfileFormData,
      label: 'Fee Scale',
      type: 'select',
      required: true,
      placeholder: 'Select Fee Scale',
      options: feeScaleOptions,
    },
    {
      name: 'planType' as keyof ProfileFormData,
      label: 'Plan Type',
      type: 'select',
      required: true,
      placeholder: 'Select Plan Type',
      options: planTypeOptions,
      onChange: (value: string | number | boolean) => setPlanType(String(value)),
    },
    {
      name: 'trialPeriod' as keyof ProfileFormData,
      label: 'Trial Period (Days)',
      type: 'select',
      required: true,
      placeholder: 'Select Trial Period',
      options: [
        { value: 'Unknown', label: 'Unknown' },
        { value: 'SevenDays', label: 'Seven Days' },
        { value: 'FifteenDays', label: 'Fifteen Days' },
        { value: 'ThirtyDays', label: 'Thirty Days' },
      ],
    },
  ];
  
  const approveFields: ProfileField[] = [
    { name: 'tagApprovalRequestId' as keyof ProfileFormData, label: 'Tag Approval Request ID', type: 'text', required: true, placeholder: 'Tag Approval Request ID here', readOnly: true },
     { name: 'name' as keyof ProfileFormData, label: 'Entity Name', type: 'text', required: true, placeholder: 'Entity Name here', readOnly: true },
    { name: 'entityId' as keyof ProfileFormData, label: 'Entity ID', type: 'text', required: true, placeholder: 'Enter Entity ID here', readOnly: true },
    {
      name: 'tagType' as keyof ProfileFormData,
      label: 'Tag Type',
      type: 'text',
      required: true,
      readOnly: true,
    },
    {name: 'entityType' as keyof ProfileFormData, label: 'Entity Type', type: 'text', required: true, placeholder: 'Select Entity Type', readOnly: true},
    { name: 'tagNumber' as keyof ProfileFormData, label: 'Tag Number', type: 'text', required: true, placeholder: 'Enter Tag Number here' },
    ...passSpecificFields.slice(0, 2),
    { name: 'validFrom' as keyof ProfileFormData, label: 'Valid From', type: 'date', required: true, placeholder: 'Select Date', readOnly: true },
    { name: 'validTo' as keyof ProfileFormData, label: 'Valid To', type: 'date', required: true, placeholder: 'Select Date', readOnly: true },
    { name: 'status' as keyof ProfileFormData, label: 'Status', type: 'statusSwitch', required: false, placeholder: 'Status' },
    ...passSpecificFields.slice(2),
  ];

  const visibleFields = isQrTagType ? [] : approveFields;

  const handleSave = async (formData: ProfileFormData) => {
  if (!data?.data) {
    return false;
  }

  const tag = data.data;
  const isQrTag = tag.tagType?.toLowerCase().includes('qr');

  // For QR tags, find the QR tag type ID from the tagTypeData
  let tagTypeId = '';
  if (isQrTag) {
    const qrTagType = tagTypeData?.data?.find(
      (tt: any) => tt.name?.toLowerCase() === 'qr'
    );
    tagTypeId = qrTagType?.id || '';
  } else {
    tagTypeId =
      resolveTagTypeIdForApproval(tagTypeData?.data, tag.tagType || (formData.tagType as string | undefined)) ||
      '00a07f67-9150-417a-fd67-08de8b030b56';
  }

  const rawFrom = toIsoDate(String(formData.validFrom || tag.validFrom || ''));
  const rawTo = toIsoDate(String(formData.validTo || tag.validTo || ''));
  const { validFrom, validTo } = normalizeApprovalDateRange(rawFrom, rawTo);

  // Build base payload for all tags
  const payload: any = {
    tagApprovalRequestId: String(formData.tagApprovalRequestId || tag.id),
    entityName: String(formData.name || tag.subjectName || '').trim(),
    entityId: String(formData.entityId || tag.subjectId || ''),
    tagNumber: normalizeTagNumberForApi(String(formData.tagNumber || tag.tagNumber || '')),
    tagTypeId: tagTypeId,
    validFrom: validFrom,
    validTo: validTo,
    status: toStatusValue(formData.status),
  };

  // For non-QR tags, add additional fields
  if (!isQrTag) {
    // Get the selected plan type value
    const selectedPlanType = formData.planType || tag.planType || '';
    
    // Map plan type value to the expected string format
    let planTypeString = 'unknown';
    if (selectedPlanType) {
      const planTypeNum = Number(selectedPlanType);
      switch (planTypeNum) {
        case 1:
          planTypeString = 'day';
          break;
        case 2:
          planTypeString = 'week';
          break;
        case 3:
          planTypeString = 'month';
          break;
        case 4:
          planTypeString = 'year';
          break;
        default:
          planTypeString = 'unknown';
      }
    }

    payload.feeScaleId = String(formData.feeScaleId || tag.feeScale || '');
    payload.trialPeriod = String(formData.trialPeriod || tag.trialPeriod || 'Unknown');
    payload.planType = planTypeString;
    
    if (tag.zoneId) {
      payload.zoneId = tag.zoneId;
    }
    
    if (tag.deviceId) {
      payload.deviceId = tag.deviceId;
    }
    
    if (tag.zoneIds?.length) {
      payload.zoneIds = tag.zoneIds;
    }
  }

  console.log('Sending payload:', JSON.stringify(payload, null, 2));
  
  // Validate required fields
  if (!payload.tagApprovalRequestId || payload.tagApprovalRequestId.length !== 36) {
    console.error('Invalid tagApprovalRequestId:', payload.tagApprovalRequestId);
    throw new Error('Invalid Tag Approval Request ID');
  }
  
  if (!payload.entityName || payload.entityName.trim() === '') {
    console.error('Missing entityName');
    throw new Error('Entity Name is required');
  }
  
  if (!payload.entityId || payload.entityId.length !== 36) {
    console.error('Invalid entityId:', payload.entityId);
    throw new Error('Invalid Entity ID');
  }
  
  if (!payload.tagNumber || payload.tagNumber.trim() === '') {
    console.error('Missing tagNumber');
    throw new Error('Tag Number is required');
  }
  
  if (!payload.tagTypeId || payload.tagTypeId.length !== 36) {
    console.error('Invalid tagTypeId:', payload.tagTypeId);
    throw new Error('Invalid Tag Type ID');
  }

  // Only validate feeScaleId for non-QR tags
  if (!isQrTag && (!payload.feeScaleId || payload.feeScaleId.length !== 36)) {
    console.error('Invalid feeScaleId:', payload.feeScaleId);
    throw new Error('Invalid Fee Scale ID');
  }

  return approveTagRequest(payload);
};

  // Map fetched data to form fields
  let initialValues: Partial<ProfileFormData> = {};
  if (data && data.data) {
    const tag = data.data;
    
    // Initialize planType only once during data load
    if (!isInitialized && !planType && tag.planType) {
      console.log('[approve page] Initializing planType from tag:', tag.planType);
      setPlanType(String(tag.planType));
      setIsInitialized(true);
    }
    
    // Determine which dates to use: calculated dates from planType take priority
    // If planType has calculated dates, use those. Otherwise use tag dates.
    let validFromValue = '';
    let validToValue = '';
    
    // If we have calculated dates (from plan type selection), use them
    if (calculatedDates.validFrom && calculatedDates.validTo) {
      console.log('[approve page] Using calculated dates:', calculatedDates);
      validFromValue = calculatedDates.validFrom;
      validToValue = calculatedDates.validTo;
    } else {
      // Otherwise use dates from the tag
      console.log('[approve page] Using tag dates');
      validFromValue = toDateInputValue(tag.validFrom);
      validToValue = toDateInputValue(tag.validTo);
    }

    initialValues = {
      tagApprovalRequestId: tag.id,
      name: tag.subjectName,
      entityType: tag.subjectType || '',
      entityId: tag.subjectId,
      tagType: tag.tagType || '',
      tagNumber: tag.tagNumber,
      validFrom: validFromValue,
      validTo: validToValue,
      feeScaleId: tag.feeScale,
      status: toStatusFlag(tag.status),
      planType: tag.planType ? String(tag.planType) : '',
      trialPeriod: tag.trialPeriod || 'Unknown',
      zone: '',
      notes: tag.notes,
    };
    
    console.log('[approve page] Final initialValues:', initialValues);
  }

  return (
    <DashboardLayout pageTitle="Approval">
      <div style={{ margin: '0 auto' }}>
        {isLoading ? (
          <div>Loading...</div>
        ) : isError ? (
          <div>Failed to load tag approval request.</div>
        ) : (
          <CommonEntityForm
            title={isQrTagType ? '' : 'Please provide details below!'}
            onSave={handleSave}
            onCancel={() => window.history.back()}
            fields={visibleFields}
            saveButtonText="Approve"
            initialValues={initialValues}
            loading={isFeeScaleLoading || isZoneLoading || isTagTypeLoading || isApprovePending}
            successTitle="Tag Approved"
            successMessage="The tag approval has been submitted successfully."
          />
        )}
      </div>
    </DashboardLayout>
  );
}