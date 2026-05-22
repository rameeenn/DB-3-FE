// Get all requested tags (paginated)
export interface GetAllRequestedTagsParams {
  PageNumber?: number;
  PageSize?: number;
}

export const getAllRequestedTags = async (
  PageNumber?: number,
  PageSize?: number
): Promise<any> => {
  const response = await apiClient.get("/tag-approval/GetAllRequestedTags", {
    params: {
      PageNumber,
      PageSize,
    },
  });
  return response.data;
};
import { TagApprovalRequest } from "../types/tag-approval.types";
import apiClient from "../lib/apiClient";
import { parsePagedListData, type PagedList } from "../lib/unwrapApiList";
import type { TagType } from "../types/tagtype.types";

/** Match API expectation: continuous digits, no spaces. */
export function normalizeTagNumberForApi(tagNumber: string): string {
  return String(tagNumber ?? "").replace(/\D/g, "");
}

/** Many backends reject validTo <= validFrom (same instant fails validation). */
export function normalizeApprovalDateRange(validFromIso: string, validToIso: string): { validFrom: string; validTo: string } {
  const from = new Date(validFromIso);
  const to = new Date(validToIso);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
    return { validFrom: validFromIso, validTo: validToIso };
  }
  if (to.getTime() <= from.getTime()) {
    const adjusted = new Date(from.getTime());
    adjusted.setUTCDate(adjusted.getUTCDate() + 1);
    return { validFrom: from.toISOString(), validTo: adjusted.toISOString() };
  }
  return { validFrom: from.toISOString(), validTo: to.toISOString() };
}

export function resolveTagTypeIdForApproval(tagTypes: TagType[] | undefined, tagType: string | undefined | null): string | undefined {
  if (!tagType?.trim() || !tagTypes?.length) return undefined;
  const t = tagType.trim();
  const byId = tagTypes.find((x) => x.id.toLowerCase() === t.toLowerCase());
  if (byId) return byId.id;
  const byName = tagTypes.find((x) => x.name.toLowerCase() === t.toLowerCase());
  return byName?.id;
}
export interface GetTagApprovalRequestByIdResponse {
  statusCode: number;
  successMessage: string;
  errorMessage: string | null;
  data?: TagApprovalRequest;
}
export const getTagApprovalRequestById = async (id: string): Promise<GetTagApprovalRequestByIdResponse> => {
  const response = await apiClient.get<GetTagApprovalRequestByIdResponse>(`/tag-approval/requests/${id}`);
  return response.data;
};
export const getTagApprovalRequests = async (
  params?: { pageNumber?: number; pageSize?: number }
): Promise<PagedList<TagApprovalRequest>> => {
  const pageNumber = params?.pageNumber ?? 1;
  const pageSize = params?.pageSize ?? 10;
  const response = await apiClient.get<{
    statusCode: number;
    successMessage: string;
    errorMessage: string | null;
    data: unknown;
  }>("/tag-approval/requests", {
    params: { PageNumber: pageNumber, PageSize: pageSize },
  });
  return parsePagedListData<TagApprovalRequest>(response.data?.data as never);
};
export const rejectTagApprovalRequest = async (id: string): Promise<any> => {
  const response = await apiClient.post(`/tag-approval/requests/${id}/reject`);
  return response.data;
};
export const cancelTagApprovalRequest = async (id: string): Promise<any> => {
  const response = await apiClient.post(`/tag-approval/requests/${id}/cancel`);
  return response.data;
};

export interface ApproveTagApprovalRequestPayload {
  tagApprovalRequestId: string;
  entityName: string;
  entityId: string;
  tagNumber: string;
  tagTypeId: string;
  validFrom: string;
  validTo: string;
  status: number;
  feeScaleId: string;
  trialPeriod: string;
  planType?: string;
}

export const approveTagApprovalRequest = async (payload: ApproveTagApprovalRequestPayload): Promise<any> => {
  const response = await apiClient.post("/tag-approval/approve", payload);
  const data = response.data as { statusCode?: number; success?: boolean; errorMessage?: string; message?: string };
  if (data && typeof data.statusCode === "number" && ![0, 200, 201, 204].includes(data.statusCode)) {
    const err = new Error(String(data.errorMessage || data.message || "Approval failed")) as Error & { response?: { data: unknown } };
    err.response = { data };
    throw err;
  }
  if (data && typeof data.success === "boolean" && data.success === false) {
    const err = new Error(String(data.errorMessage || data.message || "Approval failed")) as Error & { response?: { data: unknown } };
    err.response = { data };
    throw err;
  }
  return data;
};

export interface CreateTagApprovalRequestPayload {
  entityName: string;
  entityId: string;
  tagTypeId: string;
  tagNumber: string;
  feeScaleId: string;
  planType: string;
  validFrom: string;
  validTo: string;
  zoneId: string;
  deviceId: string;
  notes: string;
  trialPeriod: string;
}

export const createTagApprovalRequest = async (payload: CreateTagApprovalRequestPayload): Promise<any> => {
  const response = await apiClient.post("/tag-approval/request", payload);
  return response.data;
};
