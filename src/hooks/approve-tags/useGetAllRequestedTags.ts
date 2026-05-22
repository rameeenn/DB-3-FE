import { useQuery } from "@tanstack/react-query";
import { getAllRequestedTags } from "../../services/approvetags.service";

export const useGetAllRequestedTags = (pageNumber: number, pageSize: number) => {
  return useQuery({
    queryKey: ["requested-tags", pageNumber, pageSize],
    queryFn: () => getAllRequestedTags(pageNumber, pageSize),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};