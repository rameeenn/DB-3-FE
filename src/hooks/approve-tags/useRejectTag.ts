// Create file: hooks/approve-tags/useRejectTag.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { rejectTagApproval } from "../../services/approvetags.service";

export const useRejectTag = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => rejectTagApproval(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["requested-tags"] });
    },
  });
};