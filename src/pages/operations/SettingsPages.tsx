import { useEffect, useState } from "react";
import { api } from "../../api/client";
import type { DataRow } from "../../api/types";
import { DataTable } from "../../components/data/DataTable";
import { ErrorState, Field, LoadingState, PageHeader } from "../../components/ui";

export function AuditPage() { const [rows, setRows] = useState<DataRow[] | null>(null); const [error, setError] = useState(""); useEffect(() => { api<DataRow[]>("/partner/v1/audit").then(setRows).catch(e => setError(e.message)); }, []); return <><PageHeader title="Audit Trail" description="Recent security and access actions in your tenant."/><section className="panel table-panel">{error ? <ErrorState message={error}/> : !rows ? <LoadingState/> : <DataTable rows={rows} columns={[{ key: "action", label: "Action" }, { key: "targetType", label: "Target type" }, { key: "targetId", label: "Target" }, { key: "createdAt", label: "Time" }]}/>}</section></>; }

export function SecurityPage() {
  const [currentPassword, setCurrent] = useState(""); const [newPassword, setNext] = useState(""); const [confirm, setConfirm] = useState(""); const [error, setError] = useState(""); const [done, setDone] = useState(false);
  async function submit(e: React.FormEvent) { e.preventDefault(); setError(""); if (newPassword !== confirm) return setError("New passwords do not match."); try { await api("/partner/v1/auth/change-password", { method: "POST", body: JSON.stringify({ currentPassword, newPassword }) }); setDone(true); } catch (err) { setError(err instanceof Error ? err.message : "Password update failed"); } }
  return <><PageHeader title="Account Security" description="Change your password and revoke existing sessions."/><section className="panel form-panel">{done ? <div className="success-message">Password changed. Sign in again with your new password.</div> : <form onSubmit={submit}>{error && <div className="form-error">{error}</div>}<Field label="Current password"><input type="password" value={currentPassword} onChange={e => setCurrent(e.target.value)} required/></Field><Field label="New password"><input type="password" minLength={12} value={newPassword} onChange={e => setNext(e.target.value)} required/></Field><Field label="Confirm new password"><input type="password" minLength={12} value={confirm} onChange={e => setConfirm(e.target.value)} required/></Field><button className="button primary">Update password</button></form>}</section></>;
}

