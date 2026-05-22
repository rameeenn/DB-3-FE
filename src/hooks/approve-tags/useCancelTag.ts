// Create file: hooks/approve-tags/useCancelTag.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cancelTagApproval } from "../../services/approvetags.service";

export const useCancelTag = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => cancelTagApproval(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["requested-tags"] });
    },
  });
};