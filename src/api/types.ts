export interface Actor {
  userId: string;
  membershipId: string;
  email: string;
  partyRefId: string;
  countryCode: string;
  partyId: string;
  partyRole: "CPO" | "EMSP";
  availablePortalRoles?: ("CPO" | "EMSP")[];
  environment?: "stage" | "production";
  role: string;
  permissions: string[];
}
export interface Page<T> {
  data: T[];
  meta: { page: number; limit: number; hasMore: boolean };
}
export interface Partner {
  id: string;
  countryCode: string;
  partyId: string;
  name: string;
  routingStatus?: "ACTIVE" | "SUSPENDED";
  totalSessions: number;
  completedSessions: number;
  failedSessions?: number;
  description?: string | null;
  connectedSince?: string | null;
  lastSeenAt?: string | null;
  suspension?: { at: string; by: string | null; reason: string | null } | null;
  performance?: { periodDays: number; totalSessions: number; completedSessions: number; failedSessions: number; successRatioPercent: number };
  recentCdrs?: { id: string; cdrId: string; sessionId: string | null; sessionRowId: string | null; receivedAt: string; forwardedAt: string | null; currency: string | null; recordedAmount: string | null; energyKwh: string | null }[];
  successRatioPercent: number;
  transactionSharePercent?: number;
  recordedCdrAmounts?: { currency: string; amount: string }[];
  issueCount?: number;
  recentTransactions?: Transaction[];
  routingRequest?: RoutingRequest | null;
}
export interface RoutingRequest {
  id: string;
  cpoPartyRefId: string;
  emspPartyRefId: string;
  requesterPartyRefId: string;
  requesterPortalRole: "CPO" | "EMSP";
  requestType: "CONNECT" | "REMOVE";
  status: "PENDING" | "COMPLETED" | "REJECTED";
  notificationStatus: "PENDING" | "SENT" | "FAILED";
  reason: string;
  remarks: string;
  reviewComment: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
  cpo?: { id: string; name: string; countryCode: string; partyId: string };
  emsp?: { id: string; name: string; countryCode: string; partyId: string };
}
export interface Cdr {
  payload?: unknown;
  id: string;
  cdrId: string;
  receivedAt: string;
  forwardedAt: string | null;
  currency: string | null;
  recordedAmount: number | null;
}
export interface Transaction {
  id: string;
  cpo: string;
  emsp: string | null;
  sessionId: string;
  sessionStatus: string;
  locationId: string | null;
  evseUid: string | null;
  energyKwh: number | null;
  lastUpdated: string;
  stage: string;
  steps: { type: string; at: string | null; status?: string }[];
  cdrs: Cdr[];
  sessionEvents: { method: string; status: string | null; at: string }[];
  sessionEventsTruncated?: boolean;
}
export interface Dashboard {
  direction: string;
  connectedPartners: number;
  transactions: { total: number; stages: Record<string, number> };
  recentTransactions: Transaction[];
}
export interface Log {
  requestUrl?: string | null;
  authorization?: string | null;
  party?: string | null;
  requestCurl?: string;
  requestHeaders?: unknown;
  requestBody?: unknown;
  responseHeaders?: unknown;
  responseBody?: unknown;
  id: string;
  direction: string;
  countryCode: string | null;
  partyId: string | null;
  module: string | null;
  method: string;
  path: string;
  statusCode: number | null;
  requestId: string | null;
  correlationId: string | null;
  durationMs: number | null;
  errorMessage: string | null;
  createdAt: string;
}
export interface Alert {
  id: string;
  type: "session" | "cdr";
  sessionId?: string;
  sessionRowId?: string;
  reason: string;
  severity: string;
  status: string;
  firstDetectedAt?: string;
  lastCheckedAt?: string;
  createdAt?: string;
  resolvedAt?: string;
  notes?: unknown;
}
export interface Member {
  membershipId: string;
  userId: string;
  email: string;
  userStatus: string;
  role: string;
  disabledAt: string | null;
  createdAt: string;
  lastLoginAt?: string | null;
}
export interface Invitation {
  id: string;
  email: string;
  role: string;
  createdAt?: string;
  expiresAt: string;
}
export interface Audit {
  id: string;
  action: string;
  targetType: string | null;
  targetId: string | null;
  createdAt: string;
  actionLabel: string;
  actorEmail: string | null;
  actorRole: string | null;
  performedBy: string | null;
  targetLabel: string | null;
  detailsSummary: string | null;
  details: {
    targetEmail: string | null;
    assignedRole: string | null;
    invitedBy: string | null;
    provider: { name: string | null; partyId: string | null; role: string | null } | null;
    requestType: string | null;
    reason: string | null;
    remarks: string | null;
    beforeRole: string | null;
    afterRole: string | null;
    beforeEnabled: boolean | null;
    afterEnabled: boolean | null;
    beforeRoutingStatus: string | null;
    afterRoutingStatus: string | null;
  } | null;
}
