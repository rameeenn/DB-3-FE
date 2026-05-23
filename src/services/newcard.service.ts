import apiClient from '../lib/apiClient';

export interface CardManagementUser {
  id: string;
  userName: string;
  cnic: string;
  address: string | null;
  userType: string;
  category: string | null;
  subCategory: string | null;
  cardIssueDate: string | null;
  cardExpiryDate: string | null;
  profilePictureUrl: string | null;
  staffNo: string | null;
  hierarchicalId: string | null;
  memberNo: string | null;
}

export interface GetCardManagementResponse {
  statusCode: number;
  successMessage: string;
  errorMessage: string | null;
 data: {
  items: {
    items: CardManagementUser[];
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    pageNumber: number;
  };
  categories: any[];
  subCategories: any[];
};
}

export const getCardManagementListing = async () => {
  const response =
    await apiClient.get<GetCardManagementResponse>(
      '/user/GetCardManagementListing'
    );

  return response.data;
};