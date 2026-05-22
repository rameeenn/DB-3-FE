'use client';
import { useEffect, useState, useMemo } from 'react';
import FormModal from './FormModal';
import CommonEntityForm, { ProfileFormData, ProfileField } from '../forms/CommonEntityForm';
import { getEnumMetadata } from '../../services/enum.service';
import { useFeeScales } from '../../hooks/fees/useFeeScales';
import { useZones } from '../../hooks/zone/useZones';
import { useGetAllTagTypes } from '../../hooks/tagtype/useGetAllTagTypes';
import { useApproveTagApprovalRequest } from '../../hooks/tag-approval/useApproveTagApprovalRequest';
import {
  normalizeApprovalDateRange,
  normalizeTagNumberForApi,
  resolveTagTypeIdForApproval,
} from '../../services/approval.service';
import type { FeeScale } from '../../types/fees.types';
import { TagApprovalRequest } from '../../types/tag-approval.types';

interface ApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: TagApprovalRequest | null;
}

export default function ApprovalModal({
  isOpen,
  onClose,
  data,
}: ApprovalModalProps) {
  const isQrTagType = Boolean(data?.tagType?.trim().toLowerCase().includes('qr'));
  const hidePassSpecificFields = Boolean(
    data?.subjectType?.trim().toLowerCase().includes('visitor') ||
    data?.subjectType?.trim().toLowerCase().includes('luggage')
  );
  const { data: feeScaleData, isLoading: isFeeScaleLoading } = useFeeScales();
  const { data: zoneData, isLoading: isZoneLoading } = useZones();
  const { data: tagTypeData, isLoading: isTagTypeLoading } = useGetAllTagTypes();
  const { mutateAsync: approveTagRequest, isPending: isApprovePending } = useApproveTagApprovalRequest();

  const [planTypeOptions, setPlanTypeOptions] = useState([
    { value: '', label: 'Select Plan Type' }
  ]);

  useEffect(() => {
    async function fetchPlanTypeOptions() {
      try {
        const res = await getEnumMetadata({ EnumType: 'PlanType' });
        const planTypeEnum = res.data.enums.find((e: any) => e.name === 'PlanType');
        if (planTypeEnum) {
          setPlanTypeOptions([
            { value: '', label: 'Select Plan Type' },
            ...planTypeEnum.members.map((m: any) => ({ value: m.value.toString(), label: m.name }))
          ]);
        }
      } catch {
        // fallback
      }
    }
    fetchPlanTypeOptions();
  }, []);

  const toDateInputValue = (value?: string | null) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    if (date.getFullYear() <= 1) return '';
    return date.toISOString().split('T')[0];
  };

  const toIsoDate = (value?: string | null) => {
    if (!value) return new Date().toISOString();
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return new Date().toISOString();
    return date.toISOString();
  };

  const toStatusValue = (value?: string | number | boolean | null) => {
    if (value === null || value === undefined) return 0;
    if (typeof value === 'boolean') return value ? 1 : 0;
    if (typeof value === 'number') return value;
    const parsed = Number(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  };

  const toStatusFlag = (value?: string | number | boolean | null) => {
    if (value === null || value === undefined) return false;
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value === 1;
    const normalized = String(value).toLowerCase();
    return normalized === '1' || normalized === 'active' || normalized === 'true';
  };

  const feeScaleOptions = [
    { value: '', label: 'Select Fee Scale' },
    ...((feeScaleData?.data?.map((fee: FeeScale) => ({ value: fee.id, label: fee.name })) || [])),
  ];

  const zoneOptions = [
    { value: '', label: 'Select Zone' },
    ...(zoneData?.data?.map((zone: any) => ({ value: zone.id, label: zone.name })) || []),
  ];

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
    { name: 'tagNumber' as keyof ProfileFormData, label: 'Tag Number', type: 'text', required: true, placeholder: 'Enter Tag Number here' },
    ...passSpecificFields.slice(0, 2),
    { name: 'validFrom' as keyof ProfileFormData, label: 'Valid From', type: 'date', required: true, placeholder: 'Select Date' },
    { name: 'validTo' as keyof ProfileFormData, label: 'Valid To', type: 'date', required: true, placeholder: 'Select Date' },
    
    ...passSpecificFields.slice(2),
  ];

  const visibleFields = isQrTagType ? [] : approveFields;

  const initialValues = useMemo(() => {
    if (!data) return {};
    return {
      tagApprovalRequestId: data.id,
      name: data.subjectName,
      entityId: data.subjectId,
      tagType: data.tagType || '',
      tagNumber: data.tagNumber,
      validFrom: toDateInputValue(data.validFrom),
      validTo: toDateInputValue(data.validTo),
      feeScaleId: data.feeScale,
      status: toStatusFlag(data.status),
      planType: data.planType || '',
      trialPeriod: data.trialPeriod || 'Unknown',
      zone: '',
      notes: data.notes,
    };
  }, [data]);

  const handleSave = async (formData: ProfileFormData) => {
    if (!data) return false;

    const tagTypeId =
      resolveTagTypeIdForApproval(tagTypeData?.data, data.tagType || (formData.tagType as string | undefined)) ||
      '00a07f67-9150-417a-fd67-08de8b030b56';

    const rawFrom = toIsoDate(String(formData.validFrom || data.validFrom || ''));
    const rawTo = toIsoDate(String(formData.validTo || data.validTo || ''));
    const { validFrom, validTo } = normalizeApprovalDateRange(rawFrom, rawTo);

    const planType = String(formData.planType || data.planType || 'unknown');

    const payload = {
      tagApprovalRequestId: String(formData.tagApprovalRequestId || data.id),
      entityName: String(formData.name || data.subjectName || ''),
      entityId: String(formData.entityId || data.subjectId || ''),
      tagNumber: normalizeTagNumberForApi(String(formData.tagNumber || data.tagNumber || '')),
      tagTypeId,
      validFrom,
      validTo,
      status: toStatusValue(formData.status),
      feeScaleId: formData.feeScaleId !== undefined ? String(formData.feeScaleId) : String(data.feeScale || ''),
      trialPeriod: String(formData.trialPeriod || 'Unknown'),
      planType,
zoneId: String(formData.zoneId || ''),
deviceId: String(formData.deviceId || ''),
zoneIds: formData.zoneIds
  ? Array.isArray(formData.zoneIds)
    ? formData.zoneIds
    : [String(formData.zoneIds)]
  : [],
    };

    console.log(
      `approveTagApprovalRequest payload:\n${JSON.stringify(payload, null, 2)}`
    );
    const result = await approveTagRequest(payload);
    onClose();
    return result;
  };

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      title="Approve Tag Approval Request"
    >
      {data ? (
        <CommonEntityForm
          title={isQrTagType ? '' : 'Please provide details below!'}
          onSave={handleSave}
          onCancel={onClose}
          fields={visibleFields}
          saveButtonText="Approve"
          initialValues={initialValues}
          loading={isFeeScaleLoading || isZoneLoading || isTagTypeLoading || isApprovePending}
          successTitle="Tag Approved"
          successMessage="The tag approval has been submitted successfully."
        />
      ) : (
        <div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>
      )}
    </FormModal>
  );
}
