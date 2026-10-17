import { useState } from "react";
import { KeyRound, Filter, Search, RotateCcw, ChevronLeft, ChevronRight, ChevronsUpDown, Mail, Building2, Users, ShieldCheck, LockKeyhole, Eye, EyeOff, CircleCheck, Info } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/auth/AuthProvider";
import { api } from "@/api/client";
import { useResource } from "@/hooks/use-resource";
import type { Audit } from "@/api/types";
import { State, Facts, Detail, CopyId } from "@/components/layout/shared";
import { Button } from "@/components/ui/button";
import { dateTime, label } from "@/lib/format";
import { Switch } from "@/components/ui/switch";
const emptyAuditFilters = { actor: "", targetType: "", action: "", from: "", target: "", status: "", to: "" };
function auditStatus(row: Audit) {
  if (row.details?.afterEnabled != null) return row.details.afterEnabled ? "Active" : "Disabled";
  if (row.details?.afterRoutingStatus) return row.details.afterRoutingStatus;
  return "";
}
function auditTone(action: string) {
  return /suspend|remove|delete/.test(action) ? "orange" : /update|change/.test(action) ? "blue" : /login|added|invite|reactivat/.test(action) ? "green" : "purple";
}
export function AuditPage() {
  const { base } = useAuth();
  const r = useResource<Audit[]>(`${base}/audit`);
  const [selected, setSelected] = useState<Audit | null>(null);
  const [draft, setDraft] = useState(emptyAuditFilters);
  const [filters, setFilters] = useState(emptyAuditFilters);
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [ascending, setAscending] = useState(false);
  const records = r.data ?? [];
  const types = [...new Set(records.map(row => row.targetType).filter((value): value is string => Boolean(value)))].sort();
  const actions = [...new Map(records.map(row => [row.action, row.actionLabel])).entries()].sort((a, b) => a[1].localeCompare(b[1]));
  const statuses = [...new Set(records.map(auditStatus).filter(Boolean))].sort();
  const istDay = (value: string) => new Date(new Date(value).getTime() + 330 * 60_000).toISOString().slice(0, 10);
  const matches = (value: string | null | undefined, query: string) => (value ?? "").toLowerCase().includes(query.trim().toLowerCase());
  const filtered = records.filter(row =>
    matches([row.performedBy, row.actorEmail].filter(Boolean).join(" "), filters.actor) &&
    (!filters.targetType || row.targetType === filters.targetType) &&
    (!filters.action || row.action === filters.action) &&
    (!filters.status || auditStatus(row) === filters.status) &&
    matches([row.targetId, row.targetLabel].filter(Boolean).join(" "), filters.target) &&
    (!filters.from || istDay(row.createdAt) >= filters.from) &&
    (!filters.to || istDay(row.createdAt) <= filters.to)
  ).sort((a, b) => (ascending ? 1 : -1) * (a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id)));
  const pages = Math.max(1, Math.ceil(filtered.length / size));
  const current = Math.min(page, pages);
  const start = (current - 1) * size;
  const visible = filtered.slice(start, start + size);
  function field(key: keyof typeof draft, value: string) { setDraft(previous => ({ ...previous, [key]: value })); }
  function reset() { setDraft(emptyAuditFilters); setFilters(emptyAuditFilters); setPage(1); setAscending(false); }
  return (
    <div className="audit-page">
      <header className="audit-page-heading"><h1>Audit Trail</h1><p>Track all important activities and changes in your organization.</p></header>
      <form className="audit-filters" onSubmit={event => { event.preventDefault(); setFilters(draft); setPage(1); }}>
        <div className="audit-panel-heading"><h2><Filter size={20} />Filters</h2><Button type="button" variant="outline" onClick={reset}><RotateCcw size={16} />Reset All</Button></div>
        <div className="audit-filter-grid">
          <label className="field">Performed By<div className="audit-search-input"><Search size={17} /><input aria-label="Performed By" placeholder="Search by name or email..." value={draft.actor} onChange={event => field("actor", event.target.value)} /></div></label>
          <label className="field">Target Type<select aria-label="Target Type" value={draft.targetType} onChange={event => field("targetType", event.target.value)}><option value="">All types</option>{types.map(type => <option key={type} value={type}>{type}</option>)}</select></label>
          <label className="field">Action<select aria-label="Action" value={draft.action} onChange={event => field("action", event.target.value)}><option value="">All actions</option>{actions.map(([value, title]) => <option key={value} value={value}>{title}</option>)}</select></label>
          <label className="field">From Date<input type="date" value={draft.from} max={draft.to || undefined} onChange={event => field("from", event.target.value)} /></label>
          <label className="field">Target ID / Name<div className="audit-search-input"><Search size={17} /><input aria-label="Target ID / Name" placeholder="Search by target ID or name..." value={draft.target} onChange={event => field("target", event.target.value)} /></div></label>
          <label className="field">Status<select aria-label="Status" value={draft.status} onChange={event => field("status", event.target.value)}><option value="">All statuses</option>{statuses.map(status => <option key={status} value={status}>{label(status.toLowerCase())}</option>)}</select></label>
          <label className="field">To Date<input type="date" value={draft.to} min={draft.from || undefined} onChange={event => field("to", event.target.value)} /></label>
          <Button className="audit-search-button" disabled={r.loading}><Search size={18} />Search</Button>
        </div>
      </form>
      <section className="audit-results">
      <div className="audit-panel-heading"><h2>Audit Logs ({filtered.length})</h2><small>Latest {records.length} records{records.length === 100 ? " (API limit: 100)" : ""}</small></div>
      {r.loading || r.error ? (
        <State loading={r.loading} error={r.error} retry={r.reload} />
      ) : (
        <div className="table-wrap"><table className="audit-table"><thead><tr><th>#</th><th><button type="button" className="audit-sort" onClick={() => { setAscending(!ascending); setPage(1); }} aria-label={`Sort date ${ascending ? "newest" : "oldest"} first`}>Date &amp; Time (IST)<ChevronsUpDown size={14} /></button></th><th>Performed By</th><th>Action</th><th>Target Type</th><th>Target</th><th>Details</th></tr></thead><tbody>{visible.map((row, index) => <tr key={row.id} tabIndex={0} className={selected?.id === row.id ? "selected" : ""} onClick={() => setSelected(row)} onKeyDown={event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setSelected(row); } }}><td>{start + index + 1}</td><td>{dateTime(row.createdAt)}</td><td><span className="audit-actor">{row.performedBy ?? "-"}{row.actorRole && <small>{label(row.actorRole.toLowerCase())}</small>}</span></td><td><span className={`audit-pill ${auditTone(row.action)}`}>{row.actionLabel}</span></td><td><span className={`audit-pill ${row.targetType === "party" ? "orange" : row.targetType === "system" ? "purple" : "blue"}`}>{row.targetType ?? "-"}</span></td><td>{row.targetLabel ?? row.targetId ?? "-"}</td><td>{row.detailsSummary ?? "-"}</td></tr>)}</tbody></table>{!visible.length && <State />}</div>
      )}
      <footer className="audit-pagination"><span>Showing {filtered.length ? start + 1 : 0} to {Math.min(start + size, filtered.length)} of {filtered.length} logs</span><div><label>Rows per page<select value={size} onChange={event => { setSize(Number(event.target.value)); setPage(1); }}>{[10, 25, 50].map(value => <option key={value}>{value}</option>)}</select></label><Button variant="outline" size="icon" aria-label="Previous page" disabled={current === 1} onClick={() => setPage(current - 1)}><ChevronLeft size={16} /></Button>{Array.from({ length: Math.min(5, pages) }, (_, index) => Math.max(1, Math.min(current - 2, pages - 4)) + index).map(value => <Button key={value} size="icon" variant={value === current ? "default" : "outline"} aria-label={`Page ${value}`} aria-current={value === current ? "page" : undefined} onClick={() => setPage(value)}>{value}</Button>)}<Button variant="outline" size="icon" aria-label="Next page" disabled={current === pages} onClick={() => setPage(current + 1)}><ChevronRight size={16} /></Button></div></footer>
      </section>
      {selected && <Detail title="Audit details" close={() => setSelected(null)}>
        <h3>{selected.actionLabel}</h3>
        <Facts values={{
          "Time (IST)": dateTime(selected.createdAt),
          "Performed by": selected.performedBy,
          "Target name / email": selected.targetLabel,
          "Target type": selected.targetType,
          "Target ID": selected.targetId ? <CopyId value={selected.targetId} /> : "-",
          ...(selected.actorRole ? { "Member role": label(selected.actorRole.toLowerCase()) } : {}),
          ...(selected.details?.targetEmail ? { "User email": selected.details.targetEmail } : {}),
          ...(selected.details?.assignedRole ? { "Assigned role": label(selected.details.assignedRole.toLowerCase()) } : {}),
          ...(selected.details?.invitedBy ? { "Invited by": selected.details.invitedBy } : {}),
          ...(selected.details?.provider ? { Provider: selected.details.provider.name, "Provider party ID": selected.details.provider.partyId, "Provider role": selected.details.provider.role === "EMSP" ? "eMSP" : selected.details.provider.role } : {}),
          ...(selected.details?.requestType ? { "Request type": selected.details.requestType === "CONNECT" ? "Connection" : "Removal" } : {}),
          ...(selected.details?.reason ? { Reason: selected.details.reason } : {}),
          ...(selected.details?.remarks ? { Remarks: selected.details.remarks } : {}),
          ...(selected.details?.beforeRole ? { "Previous role": label(selected.details.beforeRole.toLowerCase()) } : {}),
          ...(selected.details?.afterRole ? { "New role": label(selected.details.afterRole.toLowerCase()) } : {}),
          ...(selected.details?.beforeEnabled != null ? { "Previous access": selected.details.beforeEnabled ? "Active" : "Disabled" } : {}),
          ...(selected.details?.afterEnabled != null ? { "New access": selected.details.afterEnabled ? "Active" : "Disabled" } : {}),
          ...(selected.details?.beforeRoutingStatus ? { "Previous routing status": selected.details.beforeRoutingStatus } : {}),
          ...(selected.details?.afterRoutingStatus ? { "New routing status": selected.details.afterRoutingStatus } : {}),
        }} />
        {selected.detailsSummary && <p className="audit-description">{selected.detailsSummary}</p>}
      </Detail>}
    </div>
  );
}
export function ProfilePage() {
  const { actor } = useAuth();
  const [busy, setBusy] = useState(false);
  const displayName = (actor?.email.split("@")[0] ?? "Account").split(/[._-]+/).filter(Boolean).map(part => part[0].toUpperCase() + part.slice(1)).join(" ");
  const initials = displayName.split(" ").slice(0, 2).map(part => part[0]).join("");
  const role = label(actor?.role.toLowerCase());
  async function switchPortal() {
    setBusy(true);
    try {
      await api("/portal/v1/auth/portal", { method: "POST", body: JSON.stringify({ partyRole: actor?.partyRole === "CPO" ? "EMSP" : "CPO" }) });
      window.location.assign("/profile");
    } catch (error) { toast.error((error as Error).message); setBusy(false); }
  }
  return (
    <div className="profile-page">
      <header className="profile-heading"><div><h1>Profile</h1><p>Manage your account information and security settings</p></div></header>
      <section className="profile-account" aria-label="Account information">
        <div className="profile-person"><div className="profile-avatar" aria-hidden="true">{initials}</div><div><div className="profile-person-title"><h2>{displayName}</h2><span>{role}</span></div><p>{actor?.email}</p></div></div>
        <div className="profile-facts">
          {[{ title: "Email Address", value: actor?.email, Icon: Mail, tone: "blue" }, { title: "Party ID", value: `${actor?.countryCode}-${actor?.partyId}`, Icon: Building2, tone: "blue" }, { title: "Partner Type", value: actor?.partyRole === "EMSP" ? "eMSP" : "CPO", Icon: Users, tone: "orange" }, { title: "Role", value: role, Icon: ShieldCheck, tone: "green" }].map(({ title, value, Icon, tone }) => <div className={`profile-fact ${tone}`} key={title}><span className="profile-fact-icon"><Icon size={22} /></span><div><small>{title}</small><strong>{value}</strong></div></div>)}
        </div>
      </section>
      <ChangePasswordPage />
      {actor?.availablePortalRoles?.length === 2 && <section className="profile-portal"><h2>Partner portal</h2><div className="toggle-row"><span>eMSP</span><Switch aria-label={`Switch to ${actor.partyRole === "CPO" ? "eMSP" : "CPO"}`} checked={actor.partyRole === "CPO"} disabled={busy} onCheckedChange={() => void switchPortal()} /><span>CPO</span></div></section>}
    </div>
  );
}

function ChangePasswordPage() {
  const { base, logout } = useAuth();
  const [currentPassword, setCurrent] = useState("");
  const [newPassword, setNew] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [visible, setVisible] = useState<Record<string, boolean>>({});
  function cancel() { setCurrent(""); setNew(""); setConfirm(""); setError(""); setVisible({}); }
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirm) {
      setError("Passwords do not match");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await api(`${base}/auth/change-password`, {
        method: "POST",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      toast.success("Password changed. Sign in again.");
      await logout();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
      <form className="profile-password" onSubmit={submit} aria-label="Change password">
        <div className="profile-password-heading"><span><LockKeyhole size={23} /></span><div><h2>Change password</h2><p>Keep your account secure by using a strong password.</p></div></div>
        {[
          ["Current password", currentPassword, setCurrent],
          ["New password", newPassword, setNew],
          ["Confirm new password", confirm, setConfirm],
        ].map(([title, value, set]) => (
          <label className="field" key={String(title)}>
            {String(title)}
            <div className="profile-password-input">
            <LockKeyhole size={15} aria-hidden="true" />
            <input
              aria-label={String(title)}
              type={visible[String(title)] ? "text" : "password"}
              placeholder={`Enter ${String(title).toLowerCase()}`}
              disabled={busy}
              autoComplete={
                title === "Current password"
                  ? "current-password"
                  : "new-password"
              }
              required
              minLength={title === "Current password" ? 1 : 12}
              value={String(value)}
              onChange={(e) => (set as (v: string) => void)(e.target.value)}
            />
            <button type="button" aria-label={`${visible[String(title)] ? "Hide" : "Show"} ${String(title).toLowerCase()}`} title={`${visible[String(title)] ? "Hide" : "Show"} password`} aria-pressed={Boolean(visible[String(title)])} onClick={() => setVisible(previous => ({ ...previous, [String(title)]: !previous[String(title)] }))}>{visible[String(title)] ? <Eye size={16} /> : <EyeOff size={16} />}</button>
            </div>
          </label>
        ))}
        <div className="profile-password-requirements"><strong><Info size={16} />Password Requirements</strong><span className={newPassword.length >= 12 ? "met" : ""}><CircleCheck size={14} />Minimum 12 characters</span><span className={confirm && confirm === newPassword ? "met" : ""}><CircleCheck size={14} />New passwords must match</span></div>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <div className="profile-password-actions"><Button disabled={busy}>
          <KeyRound size={16} />
          {busy ? "Updating..." : "Update password"}
        </Button><Button type="button" variant="outline" disabled={busy} onClick={cancel}>Cancel</Button></div>
      </form>
  );
}
