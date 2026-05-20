import { useQuery } from '@tanstack/react-query';
import { getCardManagementListing } from '../../services/newcard.service';

export const useGetCardManagementListing = () => {
  return useQuery({
    queryKey: ['card-management-listing'],
    queryFn: getCardManagementListing,
  });
};