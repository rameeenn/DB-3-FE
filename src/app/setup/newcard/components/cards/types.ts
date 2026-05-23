// components/cards/types.ts
export interface CardData {
  id: string;
  userName: string;
  cnic: string;
  userType: string;
  category: string;
  subCategory: string;
  cardIssueDate: string;
  cardExpiryDate: string;
  address: string;
  profilePictureUrl: string | null;
  staffNo: string;
  hierarchicalId: string;
  memberNo: string;
}

export interface CardComponentProps {
  data: CardData;
  cardRef?: React.RefObject<HTMLDivElement>;
  isDownload?: boolean;
}