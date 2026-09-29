import type { DataRow, PageResult, PartnerActor } from "../api/types";

type DemoRole = "emsp" | "cpo";
const storageKey = "chargeindia-demo-role";
const time = "2026-09-29T09:30:00.000Z";
const permissions = ["dashboard.read", "partners.read", "locations.read", "authorizations.read", "sessions.read", "cdrs.read", "commands.read", "process.read", "debug.read", "orphans.read", "connection.read", "team.manage", "audit.read"];
const row = (id: string, extra: DataRow): DataRow => ({ id, createdAt: time, updatedAt: time, ...extra });

export function demoRole(): DemoRole | null {
  const role = sessionStorage.getItem(storageKey);
  return role === "emsp" || role === "cpo" ? role : null;
}

export function demoActor(role: DemoRole): PartnerActor {
  return { userId: `demo-${role}`, membershipId: `demo-${role}-membership`, email: role === "emsp" ? "xyz.admin@example.com" : "mnq.admin@example.com", partyRefId: `demo-${role}-party`, countryCode: "IN", partyId: role === "emsp" ? "XYZ" : "MNQ", partyRole: role === "emsp" ? "EMSP" : "CPO", role: "TENANT_ADMIN", permissions };
}

const cpos = [row("cpo-mnq", { countryCode: "IN", partyId: "MNQ", status: "CONNECTED" }), row("cpo-tls", { countryCode: "IN", partyId: "TLS", status: "CONNECTED" })];
const emsps = [row("emsp-xyz", { countryCode: "IN", partyId: "XYZ", status: "CONNECTED" }), row("emsp-abc", { countryCode: "IN", partyId: "ABC", status: "CONNECTED" })];
const locations = [row("loc-mnq", { countryCode: "IN", partyId: "MNQ", locationId: "MNQ-LOC-01", lastUpdated: time, payload: { name: "Park Street Station", city: "Kolkata", address: "Park Street", evses: [{ uid: "MNQ-EVSE-01", status: "AVAILABLE" }] }, completenessScore: 100, correctnessScore: 100 }), row("loc-tls", { countryCode: "IN", partyId: "TLS", locationId: "TLS-LOC-01", lastUpdated: time, payload: { name: "Salt Lake Hub", city: "Kolkata", address: "Salt Lake", evses: [{ uid: "TLS-EVSE-01", status: "CHARGING" }] }, completenessScore: 96, correctnessScore: 100 })];
const tariffs = [row("tariff-mnq", { countryCode: "IN", partyId: "MNQ", tariffId: "MNQ-AC-01", lastUpdated: time, payload: { currency: "INR", elements: [{ price_components: [{ type: "ENERGY", price: 13.5, step_size: 1 }] }] }, completenessScore: 100 }), row("tariff-tls", { countryCode: "IN", partyId: "TLS", tariffId: "TLS-DC-01", lastUpdated: time, payload: { currency: "INR", elements: [{ price_components: [{ type: "ENERGY", price: 18, step_size: 1 }] }] }, completenessScore: 100 })];
const sessions = [row("session-mnq", { countryCode: "IN", partyId: "MNQ", sessionId: "SES-XYZ-1001", correlationId: "correlation-mnq", locationId: "MNQ-LOC-01", evseUid: "MNQ-EVSE-01", status: "COMPLETED", startDateTime: time, lastUpdated: time, forwardedAt: time, payload: { kwh: 21.8, currency: "INR" } }), row("session-tls", { countryCode: "IN", partyId: "TLS", sessionId: "SES-XYZ-1002", correlationId: "correlation-tls", locationId: "TLS-LOC-01", evseUid: "TLS-EVSE-01", status: "ACTIVE", startDateTime: time, lastUpdated: time, forwardedAt: null, payload: { kwh: 16.6, currency: "INR" } })];
const cdrs = [row("cdr-mnq", { countryCode: "IN", partyId: "MNQ", cdrId: "CDR-XYZ-1001", sessionId: "SES-XYZ-1001", correlationId: "correlation-mnq", receivedAt: time, forwardedAt: time, payload: { currency: "INR", total_energy: 21.8, total_cost: { excl_vat: 294.3 } } }), row("cdr-tls", { countryCode: "IN", partyId: "TLS", cdrId: "CDR-XYZ-1002", sessionId: "SES-XYZ-1002", correlationId: "correlation-tls", receivedAt: time, forwardedAt: null, payload: { currency: "INR", total_energy: 16.6, total_cost: { excl_vat: 298.8 } } })];
const commands = [row("command-mnq", { commandId: "CMD-1001", commandType: "START_SESSION", status: "ACCEPTED", correlationId: "correlation-mnq" }), row("command-tls", { commandId: "CMD-1002", commandType: "STOP_SESSION", status: "PENDING", correlationId: "correlation-tls" })];
const deliveries = [row("delivery-mnq", { kind: "CDR", status: "DELIVERED", attemptCount: 1, correlationId: "correlation-mnq" }), row("delivery-tls", { kind: "SESSION", status: "PENDING", attemptCount: 2, lastErrorClass: "TIMEOUT", correlationId: "correlation-tls" })];
const processes = [row("process-mnq", { correlationId: "correlation-mnq", module: "Sessions", spanType: "Forward session", direction: "CPO_TO_EMSP", status: "SUCCESS", latencyMs: 320 }), row("process-tls", { correlationId: "correlation-tls", module: "CDRs", spanType: "Deliver CDR", direction: "CPO_TO_EMSP", status: "PENDING", latencyMs: 1800, errorMessage: "Upstream timeout" })];
const logs = [row("log-mnq", { direction: "OUTBOUND", module: "Sessions", method: "PUT", path: "/ocpi/2.2.1/sessions", statusCode: 200, correlationId: "correlation-mnq", durationMs: 320 }), row("log-tls", { direction: "OUTBOUND", module: "CDRs", method: "POST", path: "/ocpi/2.2.1/cdrs", statusCode: 504, correlationId: "correlation-tls", durationMs: 1800, errorMessage: "Upstream timeout" })];
const authorizations = [row("auth-mnq", { tokenUid: "AB***42", tokenType: "RFID", direction: "EMSP_TO_CPO", allowed: true, correlationId: "correlation-mnq" }), row("auth-tls", { tokenUid: "CD***17", tokenType: "RFID", direction: "EMSP_TO_CPO", allowed: false, correlationId: "correlation-tls" })];
const alerts = { sessionOrphans: [row("orphan-1", { sessionId: "SES-XYZ-1001", reason: "CDR_DELAYED", severity: "WARNING", status: "OPEN", firstDetectedAt: time, lastCheckedAt: time })], cdrHygiene: [row("hygiene-1", { reason: "DELIVERY_DELAYED", severity: "WARNING", status: "OPEN", createdAt: time })] };
const resources: Record<string, DataRow[]> = { cpos, emsps, locations, tariffs, sessions, cdrs, commands, deliveries, processes, authorizations, "debug-logs": logs };
function scopedRows(resource: string, role: DemoRole): DataRow[] {
  const rows = resources[resource] ?? [];
  if (role === "emsp" || resource === "emsps") return rows;
  return rows.filter(item => item.partyId === "MNQ" || String(item.correlationId ?? "").endsWith("mnq"));
}

function page(rows: DataRow[], url: URL): PageResult<DataRow> {
  const status = url.searchParams.get("status")?.toLowerCase();
  const party = url.searchParams.get("cpo")?.split("-").at(-1)?.toUpperCase();
  const from = url.searchParams.get("from"); const to = url.searchParams.get("to");
  const selected = rows.filter(item => (!status || String(item.status ?? "").toLowerCase() === status) && (!party || item.partyId === party || !item.partyId) && (!from || String(item.createdAt ?? time) >= from) && (!to || String(item.createdAt ?? time) <= to));
  const number = Math.max(1, Number(url.searchParams.get("page") ?? 1)); const limit = Math.max(1, Number(url.searchParams.get("limit") ?? 25)); const start = (number - 1) * limit;
  return { data: selected.slice(start, start + limit), meta: { page: number, limit, hasMore: start + limit < selected.length } };
}

export function mockRequest(path: string, method: string, body?: string): unknown {
  if (path === "/portal/v1/auth/login" && method === "POST") { const input = JSON.parse(body ?? "{}"); const email = String(input.email ?? "").toLowerCase(); if (input.password !== "demo" || !["xyz.admin@example.com", "mnq.admin@example.com"].includes(email)) throw new Error("Use a demo account and the demo password."); const role: DemoRole = email.startsWith("mnq") ? "cpo" : "emsp"; sessionStorage.setItem(storageKey, role); return demoActor(role); }
  if (path === "/portal/v1/auth/logout" && method === "POST") { sessionStorage.removeItem(storageKey); return {}; }
  if (path === "/portal/v1/auth/forgot-password" && method === "POST") return {};
  const role = demoRole();
  if (path === "/portal/v1/auth/me") { if (!role) throw new Error("Not signed in"); return demoActor(role); }
  if (method !== "GET") throw new Error("Demo mode is read-only; no request was sent.");
  if (!role) throw new Error("Not signed in");
  const url = new URL(path, window.location.origin); const prefix = role === "emsp" ? "/partner/v1/" : "/cpo/v1/";
  if (!url.pathname.startsWith(prefix)) throw new Error("Demo resource not found");
  const [resource, id, detailId] = url.pathname.slice(prefix.length).split("/");
  if (resource === "dashboard") return role === "emsp" ? { connectedCpos: 2, routedLocations: 2, sessions: 2, cdrs: 2, commands: 2 } : { connectedEmsps: 2, locations: 1, sessions: 1, cdrs: 1, commands: 1 };
  if (resource === "connectivity") return { credential: { negotiatedVersion: "2.2.1", partnerUrl: "https://demo.example.com/ocpi" }, endpoints: ["locations", "tariffs", "sessions", "cdrs", "commands"].map(identifier => ({ identifier, role: "RECEIVER", version: "2.2.1", url: `https://demo.example.com/ocpi/${identifier}`, lastDiscoveredAt: time })) };
  if (resource === "team") return [row("member-admin", { membershipId: "member-admin", email: demoActor(role).email, role: "TENANT_ADMIN", userStatus: "ACTIVE" }), row("member-operator", { membershipId: "member-operator", email: "operator@example.com", role: "OPERATOR", userStatus: "ACTIVE" })];
  if (resource === "audit") return [row("audit-1", { action: "LOGIN", targetType: "USER", targetId: demoActor(role).email })];
  if (resource === "alerts") { const visible = role === "cpo" ? { sessionOrphans: alerts.sessionOrphans, cdrHygiene: [] } : alerts; if (id) { const found = (id === "session" ? visible.sessionOrphans : visible.cdrHygiene).find(item => item.id === detailId); if (!found) throw new Error("Demo alert not found"); return { type: id, ...found }; } return { data: visible, meta: { page: 1, limit: 20, hasMore: false } }; }
  if (!resources[resource]) throw new Error("Demo resource not found");
  const rows = scopedRows(resource, role);
  if (!id) return page(rows, url);
  const found = rows.filter(item => resource === "processes" ? item.correlationId === id : resource === "cpos" || resource === "emsps" ? `${item.countryCode}-${item.partyId}` === id : item.id === id);
  if (!found.length) throw new Error("Demo resource not found");
  return resource === "processes" ? found : found[0];
}
