import { useQuery } from "@tanstack/react-query";
import {
	getInvoiceSummary,
	type GetInvoiceSummaryParams,
	type InvoiceSummaryTotals,
} from "../../services/invoice.service";

// In your useInvoiceSummary hook file
export const useInvoiceSummary = (params: GetInvoiceSummaryParams) => {
  return useQuery({
    queryKey: ['invoiceSummary', params],
    queryFn: () => getInvoiceSummary(params),
  });
};
