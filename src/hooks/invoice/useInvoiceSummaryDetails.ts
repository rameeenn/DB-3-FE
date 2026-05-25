import { useQuery } from "@tanstack/react-query";
import {
	getInvoiceSummaryDetails,
	type GetInvoiceSummaryDetailsParams,
	type InvoiceSummaryDetailsResult,
	type InvoiceSummaryTotals,
} from "../../services/invoice.service";

export function useInvoiceSummaryDetails(params: GetInvoiceSummaryDetailsParams) {
	return useQuery<InvoiceSummaryDetailsResult & { totals?: InvoiceSummaryTotals }>({
		queryKey: [
			"invoice-summary-details",
			params.pageNumber ?? 1,
			params.pageSize ?? 10,
			params.fromDate ?? "",
			params.toDate ?? "",
		],
		queryFn: () => getInvoiceSummaryDetails(params),
	});
}