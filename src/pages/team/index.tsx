import { useState } from "react";
import { Link } from "react-router-dom";
import { UserRound, UserRoundCheck, UserRoundPlus, UsersRound, Plus, Mail, Send, Search, FileClock } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/auth/AuthProvider";
import { api } from "@/api/client";
import { useResource } from "@/hooks/use-resource";
import type { Member, Invitation } from "@/api/types";
import { Metric, Table, State, Badge, Pager } from "@/components/layout/shared";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { dateTime, label, number } from "@/lib/format";

const roles = ["TENANT_ADMIN", "OPERATOR", "FINANCE_VIEWER"];
function roleValue(value: string) { return value === "DEVELOPER" ? "OPERATOR" : value; }
function roleLabel(value: string) { return label(roleValue(value).toLowerCase()); }
function RoleBadge({ role }: { role: string }) { const value = roleValue(role); return <span className={`team-role team-role-${value.toLowerCase()}`}>{roleLabel(value)}</span>; }
function memberName(member: Member) { return member.email.split("@")[0].replace(/[._-]+/g, " ").replace(/\b\w/g, letter => letter.toUpperCase()); }
function status(member: Member) { return member.disabledAt ? "disabled" : member.userStatus.toLowerCase(); }

export function TeamPage() {
  const { actor, base, can } = useAuth();
  const members = useResource<Member[]>(`${base}/team`, 30_000);
  const invitations = useResource<Invitation[]>(`${base}/team/invitations`, 30_000);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("OPERATOR");
  const [busy, setBusy] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [tab, setTab] = useState("members");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Member | null>(null);
  const [editRole, setEditRole] = useState("OPERATOR");
  const [enabled, setEnabled] = useState(true);
  const [editError, setEditError] = useState("");
  const all = members.data ?? [];
  const invites = invitations.data ?? [];
  const pending = invites.filter(invitation => Date.parse(invitation.expiresAt) > Date.now());
  const active = all.filter(member => status(member) === "active").length;
  const filtered = all.filter(member => `${memberName(member)} ${member.email}`.toLowerCase().includes(search.trim().toLowerCase()) && (!roleFilter || roleValue(member.role) === roleFilter) && (!statusFilter || status(member) === statusFilter));
  const currentPage = Math.min(page, Math.max(1, Math.ceil(filtered.length / 10)));
  const self = selected?.membershipId === actor?.membershipId;

  async function send(event: React.FormEvent) {
    event.preventDefault();
    setInviteError("");
    if (all.some(member => member.email.toLowerCase() === email.trim().toLowerCase())) { setInviteError("This email is already a team member."); return; }
    setBusy(true);
    try {
      await api(`${base}/team/invitations`, { method: "POST", body: JSON.stringify({ email: email.trim(), role }) });
      invitations.reload(); setEmail(""); toast.success("Invitation sent");
    } catch (error) { setInviteError((error as Error).message); }
    finally { setBusy(false); }
  }
  async function resend(invitation: Invitation) {
    setBusy(true);
    try { await api(`${base}/team/invitations/${invitation.id}/resend`, { method: "POST" }); invitations.reload(); toast.success("Invitation resent"); }
    catch (error) { toast.error((error as Error).message); }
    finally { setBusy(false); }
  }
  async function save() {
    if (!selected || self) return;
    setBusy(true); setEditError("");
    try { await api(`${base}/team/members/${selected.membershipId}`, { method: "PATCH", body: JSON.stringify({ role: editRole, enabled }) }); members.reload(); setSelected(null); toast.success("Member updated"); }
    catch (error) { setEditError((error as Error).message); }
    finally { setBusy(false); }
  }
  const invitationTable = invitations.loading || invitations.error ? <State loading={invitations.loading} error={invitations.error} retry={invitations.reload} /> : <Table rows={invites} columns={[
    { key: "rank", title: "#", render: row => invites.indexOf(row) + 1 }, { key: "email", title: "Email" },
    { key: "role", title: "Role", render: row => <RoleBadge role={row.role} /> },
    { key: "createdAt", title: "Invited On (IST)", render: row => dateTime(row.createdAt) },
    { key: "expiresAt", title: "Expires On (IST)", render: row => dateTime(row.expiresAt) },
    { key: "status", title: "Status", render: row => <Badge value={Date.parse(row.expiresAt) > Date.now() ? "pending" : "expired"} /> },
    { key: "action", title: "Action", render: (row: Invitation) => <Button variant="outline" size="sm" disabled={busy} onClick={() => void resend(row)}><Send size={13} />Resend</Button> },
  ]} />;
  return <div className="team-page">
    <header className="team-page-head"><div><h1>Team Management</h1><p>Manage team members, roles and access for your organization.</p></div>{can("audit.read") && <Button asChild variant="outline" size="sm"><Link to="/audit"><FileClock size={15} />Audit Trail</Link></Button>}</header>
    <div className="team-summary">
      <Metric title="Total Members" value={members.data ? number(all.length) : "-"} icon={UserRound} />
      <div className="team-summary-active"><Metric title="Active Members" value={members.data ? number(active) : "-"} icon={UserRoundCheck} tone="green" /><small>{number(all.length ? active / all.length * 100 : 0)}% active</small></div>
      <div className="team-summary-pending"><Metric title="Pending Invitations" value={invitations.data ? number(pending.length) : "-"} icon={UserRoundPlus} tone="blue" /><small>Awaiting response</small></div>
      <div className="team-summary-roles"><Metric title="Roles Configured" value={number(roles.length)} icon={UsersRound} tone="red" /><small>Available roles</small></div>
    </div>
    <form className="team-invite" onSubmit={event => void send(event)}><div className="team-section-heading"><span className="team-heading-icon"><Plus size={20} /></span><div><h2>Invite Team Member</h2></div></div>
      <div className="team-invite-fields"><label className="field">Email address<span className="team-email-input"><Mail size={15} /><input type="email" required placeholder="name@example.com" value={email} onChange={event => setEmail(event.target.value)} /></span></label><label className="field">Role<select aria-label="Invitation role" value={role} onChange={event => setRole(event.target.value)}>{roles.map(value => <option value={value} key={value}>{roleLabel(value)}</option>)}</select></label><Button type="submit" disabled={busy}><Send size={15} />{busy ? "Please wait..." : "Send invitation"}</Button></div>
      {inviteError && <p role="alert" className="error">{inviteError}</p>}
    </form>
    {/* ({pending.length}) */}
    <Tabs value={tab} onValueChange={setTab}><section className="team-directory" aria-label="Team directory"><div className="team-directory-tools"><TabsList><TabsTrigger value="members">Team Members ({all.length})</TabsTrigger><TabsTrigger value="invitations">Pending Invitations </TabsTrigger></TabsList>{tab === "members" && <div className="team-member-filters"><label className="team-member-search"><Search size={14} /><span className="sr-only">Search members</span><input placeholder="Search members..." value={search} onChange={event => { setSearch(event.target.value); setPage(1); }} /></label><label><span>Filter by role</span><select aria-label="Filter by role" value={roleFilter} onChange={event => { setRoleFilter(event.target.value); setPage(1); }}><option value="">All roles</option>{roles.map(value => <option value={value} key={value}>{roleLabel(value)}</option>)}</select></label><label><span>Filter by status</span><select aria-label="Filter by status" value={statusFilter} onChange={event => { setStatusFilter(event.target.value); setPage(1); }}><option value="">All statuses</option>{["active", "disabled", "locked", "invited"].map(value => <option value={value} key={value}>{roleLabel(value)}</option>)}</select></label></div>}</div>
      <TabsContent value="members">{members.loading || members.error ? <State loading={members.loading} error={members.error} retry={members.reload} /> : <><Table rows={filtered.slice((currentPage - 1) * 10, currentPage * 10)} click={member => { setSelected(member); setEditRole(roleValue(member.role)); setEnabled(!member.disabledAt); setEditError(""); }} columns={[
        { key: "rank", title: "#", render: row => filtered.indexOf(row) + 1 },
        { key: "name", title: "Name", render: (row: Member) => <span className="team-person"><span className={`team-avatar team-avatar-${all.indexOf(row) % 5}`}>{memberName(row).split(" ").map(part => part[0]).slice(0, 2).join("")}</span>{memberName(row)}</span> },
        { key: "email", title: "Email" }, { key: "role", title: "Role", render: row => <RoleBadge role={row.role} /> },
        { key: "status", title: "Status", render: row => <Badge value={status(row)} /> },
        { key: "createdAt", title: "Added On (IST)", render: row => dateTime(row.createdAt) },
        { key: "lastLoginAt", title: "Last Login (IST)", render: row => <span className="team-last-login">{row.lastLoginAt && <i />}{dateTime(row.lastLoginAt)}</span> },
      ]} />{filtered.length > 10 && <Pager page={currentPage} more={currentPage * 10 < filtered.length} setPage={setPage} />}</>}</TabsContent>
      <TabsContent value="invitations">{invitationTable}</TabsContent>
    </section></Tabs>
    <Dialog open={Boolean(selected)} onOpenChange={open => { if (!open && !busy) setSelected(null); }}><DialogContent><DialogTitle>Manage member</DialogTitle><DialogDescription>{selected?.email}</DialogDescription><label className="field">Role<select aria-label="Member role" value={editRole} disabled={busy || self} onChange={event => setEditRole(event.target.value)}>{roles.map(value => <option key={value} value={value}>{roleLabel(value)}</option>)}</select></label><div className="toggle-row"><Switch aria-label="Member access" checked={enabled} disabled={busy || self} onCheckedChange={setEnabled} /><span>{enabled ? "Enabled" : "Disabled"}</span></div>{self && <p className="muted">Your own membership cannot be changed here.</p>}{editError && <p role="alert" className="error">{editError}</p>}<DialogFooter><Button variant="outline" disabled={busy} onClick={() => setSelected(null)}>Cancel</Button><Button disabled={busy || self} onClick={() => void save()}>Save changes</Button></DialogFooter></DialogContent></Dialog>
  </div>;
}
