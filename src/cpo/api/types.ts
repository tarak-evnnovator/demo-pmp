export type PortalRole = "TENANT_ADMIN" | "OPERATOR" | "DEVELOPER" | "FINANCE_VIEWER";

export interface PartnerActor {
  userId: string;
  membershipId: string;
  email: string;
  partyRefId: string;
  countryCode: string;
  partyId: string;
  role: PortalRole;
  permissions: string[];
}

export interface PageMeta { page: number; limit: number; hasMore: boolean }
export interface PageResult<T = Record<string, unknown>> { data: T[]; meta: PageMeta }
export type DataRow = Record<string, unknown>;

