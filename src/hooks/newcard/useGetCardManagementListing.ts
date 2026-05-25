// hooks/newcard/useGetCardManagementListing.ts
import { useQuery } from "@tanstack/react-query";
import { getCardManagementListing } from "../../services/newcard.service";

export const useGetCardManagementListing = (pageNumber: number = 0, pageSize: number = 0) => {
  return useQuery({
    queryKey: ["card-management-listing", pageNumber, pageSize],
    queryFn: () => getCardManagementListing(pageNumber, pageSize),
  });
};