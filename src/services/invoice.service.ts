import apiClient from "../lib/apiClient";
export interface InvoiceRecord {
	id: string;
	invoiceNumber: string;
	date?: string | null;
	tagId: string;
	entityType: string;
	entityId: string;
	userId?: string | null;
	username?: string | null;
	parentUserName?: string | null;
	familyUserName?: string | null;
	serviceType?: string | null;
	paymentMethods?: string | null;
	amount: number;
	bankCharges?: number | null;
	taxAmount: number;
	discountAmount?: number | null;
	mdrAmount?: number | null;
	fedTaxAmount?: number | null;
	totalAmount: number;
	status: string;
	invoiceStatus?: string | null;
	paidAt: string | null;
	paymentMethod: string | null;
	transactionId: string | null;
	durationDays?: number | null;
	trialPeriodDays: number;
	trialDueDate?: string | null;
	trialDueAtUtc: string;
	trialExtensionReason: string | null;
}

export interface GetAllInvoicesResponse {
	statusCode: number;
	successMessage: string;
	errorMessage: string | null;
	data: InvoiceRecord[];
}

export interface RemoveInvoiceResponse {
	statusCode: number;
	successMessage: string;
	errorMessage: string | null;
}


export interface GetAllInvoicesPayload {
	pageNumber: number;
	pageSize: number;
	invoiceNumber?: string;
	fromDate?: string;
	toDate?: string;
}

export interface ExportInvoicesExcelPayload {
	pageNumber: number;
	pageSize: number;
	invoiceNumber: string;
	/** ISO date-time */
	fromDate: string;
	/** ISO date-time */
	toDate: string;
}

export async function exportInvoicesExcel(payload: ExportInvoicesExcelPayload): Promise<Blob> {
	const response = await apiClient.post<Blob>("/invoices/export/excel", payload, {
		responseType: "blob",
	});
	return response.data;
}

export async function getAllInvoices(payload: GetAllInvoicesPayload): Promise<GetAllInvoicesResponse> {
	const fullPayload: Record<string, string | number> = {
		pageNumber: payload.pageNumber ?? 1,
		pageSize: payload.pageSize ?? 10,
	};
	if (payload.invoiceNumber?.trim()) fullPayload.invoiceNumber = payload.invoiceNumber.trim();
	if (payload.fromDate?.trim()) fullPayload.fromDate = payload.fromDate.trim();
	if (payload.toDate?.trim()) fullPayload.toDate = payload.toDate.trim();
	const response = await apiClient.post("/invoices/GetAllInvoices", fullPayload);
	
	const apiData = response.data;
	// If the API returns nested data, flatten it to match the expected response
	if (apiData && apiData.data && apiData.data.data && Array.isArray(apiData.data.data.items)) {
		return {
			...apiData,
			data: apiData.data.data.items,
		};
	}
	return apiData;
}

export async function removeInvoice(id: string): Promise<RemoveInvoiceResponse> {
	const response = await apiClient.post("/invoices/removeInvoice", { id });
	return response.data;
}
export interface CreateInvoicePayload {
	id: string;
	paymentMethod: string;
	transactionId: string;
	invoiceNumber: string;
	tagId: string;
	entityType: string;
	entityId?: string;
	amount?: number;
	taxAmount?: number;
	totalAmount?: number;
	createdBy?: string;
}

export async function createInvoice(payload: CreateInvoicePayload): Promise<RemoveInvoiceResponse> {
	const response = await apiClient.post("/invoices/createInvoice", payload);
	return response.data;
}
export interface UpdateInvoicePayload {
	id: string;
	paymentMethod: string;
	invoiceNumber: string;
	tagId: string;
	entityType: string;
	entityId?: string;
	transactionId?: string;
	status?: string;
	lastModifiedBy?: string;
	amount?: number;
	taxAmount?: number;
	totalAmount?: number;
}

export async function updateInvoice(payload: UpdateInvoicePayload): Promise<RemoveInvoiceResponse> {
	const response = await apiClient.post("/invoices/updateInvoice", payload);
	return response.data;
}
export interface GetInvoiceByIdResponse {
	statusCode: number;
	successMessage: string;
	errorMessage: string | null;
	data: InvoiceRecord;
}

export async function getInvoiceById(id: string): Promise<GetInvoiceByIdResponse> {
	const response = await apiClient.get(`/invoices/${id}`);
	return response.data;
}

// --- DHA × Halcon invoice summary (paginated list + split totals) ---

export interface InvoiceSummaryTotals {
	halconAmount: number;
	dhaAmount: number;
	totalAmount: number;
	halconPercentage: number;
	dhaPercentage: number;
}

export interface InvoiceSummaryDetailItem {
	id: string;
	invoiceNumber: string;
	date?: string | null;
	entityType: string;
	userId: string;
	username?: string | null;
	parentUserName?: string | null;
	serviceType?: string | null;
	paymentMethods?: string | null;
	amount: number;
	taxAmount: number;
	discountAmount?: number | null;
	totalAmount: number;
	invoiceStatus?: string | null;
	paidAt?: string | null;
	paymentMethod?: string | null;
	transactionId?: string | null;
	durationDays?: number | null;
	trialDueDate?: string | null;
}

export interface GetInvoiceSummaryDetailsParams {
	pageNumber?: number;
	pageSize?: number;
	/** ISO date-time */
	fromDate?: string;
	/** ISO date-time */
	toDate?: string;
}

export interface InvoiceSummaryDetailsResult {
	items: InvoiceSummaryDetailItem[];
	totalCount: number;
	pageNumber: number;
	pageSize: number;
	totalPages: number;
	totals?: InvoiceSummaryTotals; // ← ADD THIS LINE to include totals in the result
}

export interface GetInvoiceSummaryParams {
	pageNumber?: number;
	pageSize?: number;
	fromDate?: string;
	toDate?: string;
}

const emptyTotals = (): InvoiceSummaryTotals => ({
	halconAmount: 0,
	dhaAmount: 0,
	totalAmount: 0,
	halconPercentage: 0,
	dhaPercentage: 0,
});

export async function getInvoiceSummary(params: GetInvoiceSummaryParams): Promise<InvoiceSummaryTotals> {
	const pageNumber = params.pageNumber ?? 1;
	const pageSize = params.pageSize ?? 5;
	const query: Record<string, string | number> = {
		PageNumber: pageNumber,
		PageSize: pageSize,
	};
	if (params.fromDate?.trim()) query.FromDate = params.fromDate.trim();
	if (params.toDate?.trim()) query.ToDate = params.toDate.trim();

	const response = await apiClient.get<{
		statusCode: number;
		successMessage: string;
		errorMessage: string | null;
		data?: InvoiceSummaryTotals;
	}>("/invoices/summary", { params: query });

	return response.data?.data ?? emptyTotals();
}

export async function getInvoiceSummaryDetails(
  params: GetInvoiceSummaryDetailsParams
): Promise<InvoiceSummaryDetailsResult & { totals?: InvoiceSummaryTotals }> {
  const pageNumber = params.pageNumber ?? 1;
  const pageSize = params.pageSize ?? 10;
  const query: Record<string, string | number> = {
    PageNumber: pageNumber,
    PageSize: pageSize,
  };
  if (params.fromDate?.trim()) query.FromDate = params.fromDate.trim();
  if (params.toDate?.trim()) query.ToDate = params.toDate.trim();

  const response = await apiClient.get<{
    statusCode: number;
    successMessage: string;
    errorMessage: string | null;
    data?: {
      totals?: InvoiceSummaryTotals;
      items?: InvoiceSummaryDetailItem[];
      totalCount?: number;
      pageNumber?: number;
      pageSize?: number;
      totalPages?: number;
    };
  }>("/invoices/summary/details", { params: query });

  const d = response.data?.data;
  if (!d) {
    return {
      items: [],
      totalCount: 0,
      pageNumber,
      pageSize,
      totalPages: 1,
    };
  }

  return {
    items: Array.isArray(d.items) ? d.items : [],
    totalCount: d.totalCount ?? 0,
    pageNumber: d.pageNumber ?? pageNumber,
    pageSize: d.pageSize ?? pageSize,
    totalPages: Math.max(1, d.totalPages ?? 1),
    totals: d.totals, // ← ADD THIS LINE to return totals
  };
  
}
