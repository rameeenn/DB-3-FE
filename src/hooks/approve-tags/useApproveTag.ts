// Create new file: hooks/tag-approval/useApproveTag.ts

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { approveTag, ApproveTagPayload } from "services/approvetags.service";

export const useApproveTag = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ApproveTagPayload) => approveTag(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tag-approval-requests"] });
      queryClient.invalidateQueries({ queryKey: ["requested-tags"] });
    },
  });
};