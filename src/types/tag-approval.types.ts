export interface TagApprovalRequest {
  id: string;
  subjectType: string;
  subjectId: string;
  subjectName: string;
  tagType: string;
  tagNumber: string;
  feeScale: string;
  planType: unknown;
  validFrom: string;
  validTo: string;
  notes: string;
  status: string;
  trialPeriod: string;
  parentUserName?: string | null;
  hierarchicalId?: string | null;
  category?: string | null;
  subCategory?: string | null;
  cardStatus?: string | null;
  zoneId?: string | null;
  deviceId?: string | null;
  zoneIds?: string[] | null;
}
