import apiClient from "@/lib/apiClient";

export interface GetAllRequestedTagsParams {
  PageNumber?: number;
  PageSize?: number;
}

export interface RequestedTagItem {
  id: string;
  subjectType: string;
  subjectId: string;
  subjectName: string;
  parentUserName: string;
  hierarchicalId: string;
  category: string | null;
  subCategory: string | null;
  tagType: string;
  tagNumber: string;
  feeScale: string;
  planType: string | null;
  validFrom: string;
  validTo: string;
  notes: string;
  status: string;
  cardStatus: string;
  trialPeriod: string | null;
  entityDetails: any;
}

export interface GetAllRequestedTagsResponse {
  statusCode: number;
  successMessage: string;
  errorMessage: string | null;
  data: {
    items: RequestedTagItem[];
    page?: number;
    pageSize?: number;
    totalCount?: number;
    totalPages?: number;
  };
}

export const getAllRequestedTags = async (
  pageNumber: number = 1,
  pageSize: number = 10
): Promise<GetAllRequestedTagsResponse> => {
  const response = await apiClient.get("/tag-approval/requests", {
    params: {
      PageNumber: pageNumber,
      PageSize: pageSize,
    },
  });
  return response.data;
};


export interface ApproveTagPayload {
  tagApprovalRequestId: string;
  entityName: string;
  entityId: string;
  tagNumber: string;
  tagTypeId: string;
  validFrom: string;
  validTo: string;
  planType?: string;
  status: number;
  feeScaleId?: string;
  trialPeriod?: string;
}

export const approveTag = async (payload: ApproveTagPayload): Promise<any> => {
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

export const rejectTagApproval = async (id: string): Promise<any> => {
  const response = await apiClient.post(`/tag-approval/requests/${id}/reject`);
  return response.data;
};

export const cancelTagApproval = async (id: string): Promise<any> => {
  const response = await apiClient.post(`/tag-approval/requests/${id}/cancel`);
  return response.data;
};