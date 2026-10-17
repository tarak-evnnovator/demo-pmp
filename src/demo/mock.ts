import type { Actor, Partner, Transaction, RoutingRequest, Member, Invitation, Audit, Log, Alert } from "@/api/types";

type Role = "CPO" | "EMSP";
const key = "chargeindia-designer-demo-v2";
const time = (minutes = 0) => new Date(Date.now() - minutes * 60_000).toISOString();
const id = () => crypto.randomUUID();
const emailFor = (role: Role) => role === "CPO" ? "mnq.admin@example.com" : "xyz.admin@example.com";
const permissions = ["dashboard.read", "partners.read", "transactions.read", "connection.manage", "debug.read", "orphans.read", "team.manage", "audit.read"];
interface Tenant {
  partners: Partner[]; available: Partner[]; transactions: Transaction[];
  requests: RoutingRequest[]; members: Member[]; invitations: Invitation[];
  audits: Audit[]; logs: Log[]; alerts: Alert[];
}
interface Store { actor: Actor | null; tenants: Record<Role, Tenant>; password: string }
function actorFor(role: Role, environment: "stage" | "production" = "stage"): Actor {
  return { userId: `admin-${role}`, membershipId: `admin-${role}`, email: emailFor(role), partyRefId: `party-${role}`, countryCode: "IN", partyId: role === "CPO" ? "MNQ" : "XYZ", partyRole: role, availablePortalRoles: ["CPO", "EMSP"], environment, role: "TENANT_ADMIN", permissions };
}
function audit(tenant: Tenant, actor: Actor, action: string, targetType: string, targetId: string, targetLabel: string, summary: string, details: Partial<NonNullable<Audit["details"]>> = {}) {
  tenant.audits.unshift({ id: id(), action, actionLabel: action.replaceAll(".", " ").replaceAll("_", " "), targetType, targetId, targetLabel, createdAt: time(), actorEmail: actor.email, actorRole: actor.role, performedBy: actor.email, detailsSummary: summary,
    details: { targetEmail: null, assignedRole: null, invitedBy: null, provider: null, requestType: null, reason: null, remarks: null, beforeRole: null, afterRole: null, beforeEnabled: null, afterEnabled: null, beforeRoutingStatus: null, afterRoutingStatus: null, ...details } });
}
function seed(role: Role): Tenant {
  const actor = actorFor(role);
  const noun = role === "CPO" ? "Mobility" : "Charge Network";
  const prefix = role === "CPO" ? "E" : "C";
  const partners: Partner[] = Array.from({ length: 4 }, (_, index) => ({ id: `${role}-partner-${index + 1}`, countryCode: "IN", partyId: `${prefix}0${index + 1}`, name: `Demo ${noun} ${index + 1}`, routingStatus: index === 1 ? "SUSPENDED" : "ACTIVE", totalSessions: index < 2 ? (index === 0 ? 3 : 2) : 0, completedSessions: index < 2 ? 1 : 0, failedSessions: index === 0 ? 1 : 0, successRatioPercent: index < 2 ? (index === 0 ? 33.33 : 50) : 0, transactionSharePercent: index < 2 ? (index === 0 ? 60 : 40) : 0, recordedCdrAmounts: index === 1 ? [{ currency: "INR", amount: "339.48" }] : [], issueCount: index < 2 ? 1 : 0, description: `Demo ${role === "CPO" ? "eMSP" : "CPO"} for roaming and transaction flow with ChargeIndia Hub.`, connectedSince: time(60 * 24 * 30), lastSeenAt: index < 2 ? time(5) : null, suspension: index === 1 ? { at: time(180), by: actor.email, reason: "Scheduled maintenance and routing review" } : null }));
  const transactions: Transaction[] = ["started", "charging", "stopped", "cdr_received", "failed"].map((stage, index) => {
    const partner = partners[index % 2];
    const sessionId = `DEMO-MNQ-XYZ-00${index + 1}`;
    const count = stage === "failed" ? 1 : Math.min(index + 1, 4);
    return { id: `${role}-transaction-${index + 1}`, sessionId, cpo: role === "CPO" ? "IN-MNQ" : `IN-${partner.partyId}`, emsp: role === "EMSP" ? "IN-XYZ" : `IN-${partner.partyId}`, sessionStatus: index === 0 ? "PENDING" : index === 1 ? "ACTIVE" : stage === "failed" ? "INVALID" : "COMPLETED", locationId: `DEMO-LOC-${index % 2 + 1}`, evseUid: `DEMO-EVSE-${index + 1}`, energyKwh: [0, 8.2, 12.4, 18.86, 0][index], lastUpdated: time(index * 25), stage,
      steps: ["START", "CHARGING", "STOP", "CDR"].slice(0, count).map((type, step) => ({ type, at: time(150 + index * 25 - step * 30), status: stage === "failed" ? "FAILED" : "SUCCESS" })),
      sessionEvents: [{ method: "PUT", status: "PENDING", at: time(150 + index * 25) }, ...(index > 0 ? [{ method: "PATCH", status: index === 1 ? "ACTIVE" : "COMPLETED", at: time(index * 25) }] : [])],
      cdrs: stage !== "cdr_received" ? [] : [{ id: `${role}-cdr-1`, cdrId: "DEMO-CDR-001", receivedAt: time(74), forwardedAt: time(73), currency: "INR", recordedAmount: 339.48, payload: { id: "DEMO-CDR-001", session_id: sessionId, country_code: "IN", party_id: role === "CPO" ? "MNQ" : partner.partyId, start_date_time: time(180), end_date_time: time(75), currency: "INR", total_energy: 18.86, total_time: 1.75, total_cost: { excl_vat: 287.69, incl_vat: 339.48 }, total_energy_cost: { excl_vat: 287.69, incl_vat: 339.48 }, cdr_token: { uid: "DEMO-TOKEN-001", type: "RFID", contract_id: "DEMO-CONTRACT" }, cdr_location: { id: "DEMO-LOC-2", name: "Demo Charging Station", address: "MG Road", city: "Bengaluru", country: "IND", coordinates: { latitude: "12.9716", longitude: "77.5946" }, evse_uid: "DEMO-EVSE-4", connector_id: "1" }, charging_periods: [{ start_date_time: time(180), tariff_id: "DEMO-TARIFF-1", dimensions: [{ type: "ENERGY", volume: 18.86 }, { type: "TIME", volume: 1.75 }] }], last_updated: time(74) } }] };
  });
  for (const partner of partners.slice(0, 2)) {
    const recent = transactions.filter(row => (role === "CPO" ? row.emsp : row.cpo) === `IN-${partner.partyId}`);
    partner.recentTransactions = recent;
    partner.performance = { periodDays: 30, totalSessions: partner.totalSessions, completedSessions: partner.completedSessions, failedSessions: partner.failedSessions ?? 0, successRatioPercent: partner.successRatioPercent };
    partner.recentCdrs = recent.flatMap(row => row.cdrs.map(cdr => ({ ...cdr, recordedAmount: String(cdr.recordedAmount), energyKwh: String(row.energyKwh), sessionId: row.sessionId, sessionRowId: row.id })));
  }
  const tenant: Tenant = { partners: partners.slice(0, 2), available: partners.slice(2), transactions, requests: [], members: [{ membershipId: actor.membershipId, userId: actor.userId, email: actor.email, userStatus: "ACTIVE", role: "TENANT_ADMIN", disabledAt: null, createdAt: time(43200), lastLoginAt: time(5) }, ...["OPERATOR", "OPERATOR", "FINANCE_VIEWER"].map((role, i) => ({ membershipId: `member-${i}`, userId: `user-${i}`, email: `demo.member${i + 1}@example.com`, userStatus: "ACTIVE", role, disabledAt: i === 1 ? time(120) : null, createdAt: time(1440 * (i + 1)), lastLoginAt: time(240) }))], invitations: [{ id: "invite-pending", email: "demo.invited@example.com", role: "OPERATOR", createdAt: time(60), expiresAt: new Date(Date.now() + 604800000).toISOString() }, { id: "invite-expired", email: "demo.expired@example.com", role: "FINANCE_VIEWER", createdAt: time(14400), expiresAt: time(60) }], audits: [], logs: [], alerts: [] };
  for (const [index, partner] of [tenant.available[0], tenant.partners[1]].entries()) {
    const request = makeRequest(actor, partner, index === 0 ? "CONNECT" : "REMOVE", "Partner onboarding / maintenance review", "Please review this demo request.");
    partner.routingRequest = request; tenant.requests.push(request);
    audit(tenant, actor, "routing.request_submitted", "routing_request", request.id, partner.name, `${request.requestType === "CONNECT" ? "Connection" : "Removal"} requested for ${partner.name} (IN-${partner.partyId}).`, { requestType: request.requestType, reason: request.reason, remarks: request.remarks, provider: { name: partner.name, partyId: `IN-${partner.partyId}`, role: role === "CPO" ? "EMSP" : "CPO" } });
  }
  audit(tenant, actor, "team.member_added", "user", "member-0", tenant.members[1].email, "Team member added as Operator.", { targetEmail: tenant.members[1].email, assignedRole: "OPERATOR" });
  audit(tenant, actor, "team.member_updated", "user", "member-0", tenant.members[1].email, "Member access enabled.", { targetEmail: tenant.members[1].email, beforeEnabled: false, afterEnabled: true });
  audit(tenant, actor, "team.member_updated", "user", "member-1", tenant.members[2].email, "Member access disabled.", { targetEmail: tenant.members[2].email, beforeEnabled: true, afterEnabled: false });
  audit(tenant, actor, "team.invitation_sent", "invitation", "invite-pending", tenant.invitations[0].email, "Invitation sent for Operator access.", { targetEmail: tenant.invitations[0].email, invitedBy: actor.email, assignedRole: "OPERATOR" });
  audit(tenant, actor, "auth.login", "user", actor.userId, actor.email, "User signed in successfully.");
  tenant.logs = [200, 201, 400, 401, 404, 500].map((statusCode, index) => ({ id: `log-${index}`, direction: index % 2 ? "outbound" : "inbound", countryCode: "IN", partyId: partners[index % 2].partyId, party: `IN-${partners[index % 2].partyId}`, module: ["sessions", "cdrs", "locations"][index % 3], method: ["PUT", "POST", "PATCH", "GET"][index % 4], path: `/ocpi/2.2.1/${["sessions", "cdrs", "locations"][index % 3]}/IN/${partners[index % 2].partyId}/DEMO-001`, requestUrl: `https://demo.example.com/ocpi/2.2.1/sessions/DEMO-001`, statusCode, requestId: `demo-request-${index}`, correlationId: `demo-correlation-${index}`, durationMs: 13 + index * 21, errorMessage: statusCode >= 400 ? "Demo resource unavailable" : null, createdAt: time(index * 20), authorization: "[REDACTED]", requestHeaders: { "Content-Type": "application/json", Authorization: "[REDACTED]", "X-Request-ID": `demo-request-${index}` }, responseHeaders: { "content-type": "application/json" }, requestBody: { id: "DEMO-001", status: "ACTIVE", kwh: 8.2, last_updated: time() }, responseBody: statusCode >= 400 ? { status_code: 2003, status_message: "Demo resource not found", timestamp: time() } : { status_code: 1000, status_message: "Success", timestamp: time() }, requestCurl: "curl 'https://demo.example.com/ocpi/2.2.1/sessions/DEMO-001' -H 'Authorization: [REDACTED]'" }));
  tenant.alerts = ["meter_stale", "connector_offline", "communication_failed", "missing_cdr"].map((reason, index) => ({ id: `alert-${index}`, type: index === 3 ? "cdr" : "session", sessionId: transactions[index].sessionId, sessionRowId: transactions[index].id, reason, severity: ["LOW", "MEDIUM", "HIGH", "HIGH"][index], status: index === 1 ? "RESOLVED" : "OPEN", firstDetectedAt: time(120 + index * 20), lastCheckedAt: time(index * 10), createdAt: time(120 + index * 20), ...(index === 1 ? { resolvedAt: time(20) } : {}), notes: { partner: `IN-${partners[index % 2].partyId}`, message: "Demo issue captured for design review" } }));
  return tenant;
}
function makeRequest(actor: Actor, partner: Partner, requestType: "CONNECT" | "REMOVE", reason: string, remarks: string): RoutingRequest {
  const own = { id: actor.partyRefId, name: actor.partyRole === "CPO" ? "Demo Charge Network" : "XYZ Mobility", countryCode: "IN", partyId: actor.partyId };
  const other = { id: partner.id, name: partner.name, countryCode: partner.countryCode, partyId: partner.partyId };
  const cpo = actor.partyRole === "CPO" ? own : other;
  const emsp = actor.partyRole === "EMSP" ? own : other;
  return { id: id(), cpoPartyRefId: cpo.id, emspPartyRefId: emsp.id, requesterPartyRefId: own.id, requesterPortalRole: actor.partyRole, requestType, status: "PENDING", notificationStatus: "SENT", reason, remarks, reviewComment: null, reviewedBy: null, reviewedAt: null, createdAt: time(30), cpo, emsp };
}
function load(): Store {
  try { const saved = sessionStorage.getItem(key); if (saved) return JSON.parse(saved); } catch { /* Recover from outdated demo storage. */ }
  return { actor: null, password: "demo", tenants: { CPO: seed("CPO"), EMSP: seed("EMSP") } };
}
const store = load();
function save() { sessionStorage.setItem(key, JSON.stringify(store)); }
function fail(message: string, status = 400): never { throw Object.assign(new Error(message), { status }); }
export async function mockRequest(path: string, options: RequestInit = {}): Promise<unknown> {
  if (options.signal?.aborted) throw new DOMException("Aborted", "AbortError");
  const url = new URL(path, "https://demo.invalid");
  const method = options.method ?? "GET";
  const body = typeof options.body === "string" ? JSON.parse(options.body) : {};
  const route = url.pathname.replace(/^\/(portal|partner|cpo)\/v1/, "");
  if (route === "/auth/login") {
    const role = body.email?.toLowerCase() === emailFor("CPO") ? "CPO" : body.email?.toLowerCase() === emailFor("EMSP") ? "EMSP" : null;
    if (!role || body.password !== store.password) fail("Use a demo account and its demo password.", 401);
    store.actor = actorFor(role, url.searchParams.get("environment") === "production" ? "production" : "stage");
    audit(store.tenants[role], store.actor, "auth.login", "user", store.actor.userId, store.actor.email, "User signed in successfully."); save(); return { ok: true };
  }
  if (route === "/auth/logout") { store.actor = null; save(); return { ok: true }; }
  if (route === "/auth/forgot-password") return { ok: true };
  if (route === "/auth/reset-password" || route === "/auth/accept-invitation") fail("Demo only: no reset or invitation emails are sent.");
  const actor = store.actor;
  if (!actor) fail("Sign in to the demo.", 401);
  if (route === "/auth/me") return structuredClone(actor);
  if (route === "/auth/environment") { if (method === "POST") { if (!["stage", "production"].includes(body.environment)) fail("Invalid environment"); actor.environment = body.environment; save(); } return { availableEnvironments: ["stage", "production"], environment: actor.environment }; }
  if (route === "/auth/portal") { if (!["CPO", "EMSP"].includes(body.partyRole)) fail("Invalid portal"); store.actor = actorFor(body.partyRole, actor.environment); save(); return { ok: true }; }
  const tenant = store.tenants[actor.partyRole];
  if (route === "/auth/change-password") { if (body.currentPassword !== store.password) fail("Current password is incorrect."); if (body.newPassword?.length < 12) fail("Use at least 12 characters."); store.password = body.newPassword; store.actor = null; save(); return { ok: true }; }
  const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit")) || 10));
  const paged = <T,>(rows: T[]) => ({ data: structuredClone(rows.slice((page - 1) * limit, page * limit)), meta: { page, limit, hasMore: rows.length > page * limit } });
  const within = (date: string) => (!url.searchParams.get("from") || date >= url.searchParams.get("from")!) && (!url.searchParams.get("to") || date <= url.searchParams.get("to")!);
  if (route === "/dashboard") return { direction: actor.partyRole === "CPO" ? "outbound" : "inbound", connectedPartners: tenant.partners.length, transactions: { total: tenant.transactions.length, stages: Object.fromEntries(["started", "charging", "stopped", "cdr_received", "failed"].map(stage => [stage, tenant.transactions.filter(row => row.stage === stage).length])) }, recentTransactions: structuredClone(tenant.transactions) };
  if (route === "/transactions") return paged(tenant.transactions.filter(row => within(row.lastUpdated) && (!url.searchParams.get("stage") || row.stage === url.searchParams.get("stage")) && (!url.searchParams.get("sessionId") || row.sessionId.toLowerCase().includes(url.searchParams.get("sessionId")!.toLowerCase())) && (!url.searchParams.get("counterpart") || (actor.partyRole === "CPO" ? row.emsp : row.cpo) === url.searchParams.get("counterpart")!.toUpperCase())));
  if (route.startsWith("/transactions/")) return structuredClone(tenant.transactions.find(row => row.id === decodeURIComponent(route.split("/").pop()!)) ?? fail("Transaction not found", 404));
  if (route === "/team") return structuredClone(tenant.members);
  if (route === "/team/invitations") {
    if (method === "POST") { if (tenant.invitations.some(row => row.email === body.email && row.expiresAt > time())) fail("Invitation already pending."); const invitation = { id: id(), email: body.email, role: body.role, createdAt: time(), expiresAt: new Date(Date.now() + 604800000).toISOString() }; tenant.invitations.unshift(invitation); audit(tenant, actor, "team.invitation_sent", "invitation", invitation.id, body.email, `Invitation sent as ${body.role}.`, { targetEmail: body.email, assignedRole: body.role, invitedBy: actor.email }); save(); return invitation; }
    return structuredClone(tenant.invitations);
  }
  if (/^\/team\/invitations\/[^/]+\/resend$/.test(route)) { const row = tenant.invitations.find(row => row.id === route.split("/")[3]) ?? fail("Invitation not found", 404); row.expiresAt = new Date(Date.now() + 604800000).toISOString(); audit(tenant, actor, "team.invitation_resent", "invitation", row.id, row.email, "Invitation resent."); save(); return row; }
  if (route.startsWith("/team/members/") && method === "PATCH") { const row = tenant.members.find(row => row.membershipId === route.split("/").pop()) ?? fail("Member not found", 404); if (row.membershipId === actor.membershipId) fail("Cannot change own access."); const before = !row.disabledAt; const beforeRole = row.role; row.role = body.role ?? row.role; if (typeof body.enabled === "boolean") row.disabledAt = body.enabled ? null : time(); audit(tenant, actor, "team.member_updated", "user", row.userId, row.email, `Member access ${row.disabledAt ? "disabled" : "enabled"}; role ${row.role}.`, { targetEmail: row.email, beforeEnabled: before, afterEnabled: !row.disabledAt, beforeRole, afterRole: row.role }); save(); return row; }
  if (route === "/audit") return structuredClone(tenant.audits);
  if (route === "/debug-logs") return paged(tenant.logs.filter(row => within(row.createdAt) && ["method", "direction", "statusCode"].every(field => !url.searchParams.get(field) || String(row[field as keyof Log]) === url.searchParams.get(field)) && (!url.searchParams.get("cpo") || row.party === url.searchParams.get("cpo"))));
  if (route.startsWith("/debug-logs/")) return structuredClone(tenant.logs.find(row => row.id === route.split("/").pop()) ?? fail("Log not found", 404));
  if (route === "/alerts") { const rows = tenant.alerts.filter(row => within(row.firstDetectedAt!) && (!url.searchParams.get("cpo") || (row.notes as { partner: string }).partner === url.searchParams.get("cpo"))); return { data: { sessionOrphans: paged(rows.filter(row => row.type === "session")).data, cdrHygiene: paged(rows.filter(row => row.type === "cdr")).data }, meta: paged(rows).meta }; }
  if (route.startsWith("/alerts/")) return structuredClone(tenant.alerts.find(row => row.id === route.split("/").pop()) ?? fail("Alert not found", 404));
  const parts = route.split("/").filter(Boolean);
  if (["cpos", "emsps"].includes(parts[0])) {
    if (parts[1] === "routing-requests") { if (method === "POST") return { notificationStatus: "SENT" }; return structuredClone(tenant.requests.filter(row => !url.searchParams.get("requestType") || row.requestType === url.searchParams.get("requestType"))); }
    if (parts[1] === "available") return structuredClone(tenant.available);
    if (parts[1] === "connected") return structuredClone(parts[2] ? tenant.partners.find(row => row.id === parts[2]) ?? fail("Partner not found", 404) : tenant.partners);
    const partner = [...tenant.partners, ...tenant.available].find(row => row.id === parts[1]) ?? fail("Partner not found", 404);
    if (method === "POST" && ["connection-requests", "removal-requests"].includes(parts[2])) {
      if (partner.routingRequest?.status === "PENDING") fail("A request is already pending.", 409);
      if (parts[2] === "removal-requests" && partner.routingStatus !== "SUSPENDED") fail("Disable routing first.");
      const request = makeRequest(actor, partner, parts[2] === "connection-requests" ? "CONNECT" : "REMOVE", body.reason ?? "", body.remarks ?? ""); request.createdAt = time(); partner.routingRequest = request; tenant.requests.unshift(request); audit(tenant, actor, "routing.request_submitted", "routing_request", request.id, partner.name, `${request.requestType} requested for ${partner.name}.`, { requestType: request.requestType, reason: request.reason, remarks: request.remarks, provider: { name: partner.name, partyId: `IN-${partner.partyId}`, role: actor.partyRole === "CPO" ? "EMSP" : "CPO" } }); save(); return structuredClone(request);
    }
    if (method === "POST" && ["suspend", "reactivate"].includes(parts[2])) { const before = partner.routingStatus; partner.routingStatus = parts[2] === "suspend" ? "SUSPENDED" : "ACTIVE"; partner.suspension = parts[2] === "suspend" ? { at: time(), by: actor.email, reason: body.reason } : null; audit(tenant, actor, parts[2] === "suspend" ? "routing.suspended" : "routing.reactivated", "party", partner.id, partner.name, `Routing ${partner.routingStatus.toLowerCase()} for ${partner.name}.`, { beforeRoutingStatus: before, afterRoutingStatus: partner.routingStatus, reason: body.reason ?? null, provider: { name: partner.name, partyId: `IN-${partner.partyId}`, role: actor.partyRole === "CPO" ? "EMSP" : "CPO" } }); save(); return { notificationStatus: "SENT" }; }
  }
  return fail(`Unmocked demo endpoint: ${method} ${route}`, 404);
}
