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
}

export interface GetCardManagementResponse {
  statusCode: number;
  successMessage: string;
  errorMessage: string | null;
  data: {
    users: {
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
      '/tag-approval/GetCardManagementListing'
    );

  return response.data;
};