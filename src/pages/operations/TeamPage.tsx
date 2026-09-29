import { useCallback, useEffect, useState } from "react";
import { MailPlus } from "lucide-react";
import { api } from "../../api/client";
import type { DataRow, PortalRole } from "../../api/types";
import { DataTable } from "../../components/data/DataTable";
import { ErrorState, Field, LoadingState, PageHeader } from "../../components/ui";

const roles: PortalRole[] = ["TENANT_ADMIN", "OPERATOR", "DEVELOPER", "FINANCE_VIEWER"];
export function TeamPage() {
  const [rows, setRows] = useState<DataRow[]>([]); const [email, setEmail] = useState(""); const [role, setRole] = useState<PortalRole>("OPERATOR"); const [loading, setLoading] = useState(true); const [error, setError] = useState(""); const [message, setMessage] = useState("");
  const load = useCallback(() => { setLoading(true); api<DataRow[]>("/partner/v1/team").then(setRows).catch(e => setError(e.message)).finally(() => setLoading(false)); }, []);
  useEffect(load, [load]);
  async function invite(e: React.FormEvent) { e.preventDefault(); setError(""); try { await api("/partner/v1/team/invitations", { method: "POST", body: JSON.stringify({ email, role }) }); setMessage(`Invitation sent to ${email}.`); setEmail(""); } catch (err) { setError(err instanceof Error ? err.message : "Invitation failed"); } }
  async function toggle(row: DataRow) { await api(`/partner/v1/team/members/${row.membershipId}`, { method: "PATCH", body: JSON.stringify({ enabled: Boolean(row.disabledAt) }) }); await load(); }
  return <><PageHeader title="Team Management" description="Invite and control access for your eMSP organization."/><section className="panel invite-panel"><form onSubmit={invite}><Field label="Email address"><input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="user@company.com" required/></Field><Field label="Role"><select value={role} onChange={e => setRole(e.target.value as PortalRole)}>{roles.map(item => <option key={item}>{item}</option>)}</select></Field><button className="button primary"><MailPlus/>Send invitation</button></form>{message && <div className="success-message">{message}</div>}</section><section className="panel table-panel">{error ? <ErrorState message={error} retry={load}/> : loading ? <LoadingState/> : <DataTable rows={rows} columns={[{ key: "email", label: "Email" }, { key: "role", label: "Role" }, { key: "userStatus", label: "Account" }, { key: "createdAt", label: "Added" }, { key: "access", label: "Access", render: row => <button className="button secondary compact-button" onClick={() => toggle(row)}>{row.disabledAt ? "Enable" : "Disable"}</button> }]}/>}</section></>;
}

