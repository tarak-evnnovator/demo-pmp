import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Building2, Users, CircleCheck, CircleX, Zap, IndianRupee, ChartNoAxesColumnIncreasing, Settings, CalendarDays, UserRound, FileText, Percent, TriangleAlert, Timer, ArrowRight, ChevronRight, type LucideIcon } from "lucide-react";
import { useAuth } from "@/auth/AuthProvider";
import { useResource } from "@/hooks/use-resource";
import { qs } from "@/api/client";
import type { Partner, Transaction, Page, Log, Alert } from "@/api/types";
import { Badge, State, Table } from "@/components/layout/shared";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { dateTime, money, number } from "@/lib/format";

function Amount({ values }: { values: Partner["recordedCdrAmounts"] }) {
  return <>{values?.length ? values.map(value => value.currency && /^[A-Z]{3}$/.test(value.currency) ? money(value.amount, value.currency) : `${number(Number(value.amount))} (currency not recorded)`).join(" / ") : "-"}</>;
}
function DetailMetric({ icon: Icon, title, value, tone, ratio }: { icon: LucideIcon; title: string; value: ReactNode; tone: string; ratio?: string }) {
  return <div className="connection-metric"><span className={`connection-icon ${tone}`}><Icon size={23} /></span><div><small>{title}</small><strong>{value}</strong></div>{ratio && <span className={`connection-ratio ${tone}`}>{ratio}</span>}</div>;
}
function BreakdownRow({ icon: Icon, title, value, tone = "blue", ratio }: { icon: LucideIcon; title: string; value: ReactNode; tone?: string; ratio?: string }) {
  return <div className="connection-breakdown-row"><span className={`connection-icon ${tone}`}><Icon size={17} /></span><span>{title}</span><strong>{value}</strong>{ratio && <span className={`connection-ratio ${tone}`}>{ratio}</span>}</div>;
}
function sessionTime(row: Transaction, step: string) { return dateTime(row.steps?.find(item => item.type === step)?.at); }
function sessionAmount(row: Transaction) { return row.cdrs?.length ? row.cdrs.map(cdr => cdr.recordedAmount == null ? "-" : cdr.currency && /^[A-Z]{3}$/.test(cdr.currency) ? money(cdr.recordedAmount, cdr.currency) : number(cdr.recordedAmount)).join(" / ") : "-"; }

export function ConnectedPartnerDetails({ partner: p, actions }: { partner: Partner; actions: ReactNode }) {
  const { base, can } = useAuth();
  const [tab, setTab] = useState(can("transactions.read") ? "sessions" : can("orphans.read") ? "issues" : "logs");
  const party = `${p.countryCode}-${p.partyId}`;
  const issues = useResource<{ data: { sessionOrphans: Alert[]; cdrHygiene: Alert[] } }>(tab === "issues" && can("orphans.read") ? `${base}/alerts${qs({ cpo: party, limit: 5 })}` : null);
  const logs = useResource<Page<Log>>(tab === "logs" && can("debug.read") ? `${base}/debug-logs${qs({ cpo: party, limit: 5 })}` : null);
  const issueRows = [...(issues.data?.data.sessionOrphans ?? []).map(row => ({ ...row, type: "session" })), ...(issues.data?.data.cdrHygiene ?? []).map(row => ({ ...row, type: "cdr" }))].sort((a, b) => Date.parse(b.firstDetectedAt ?? b.createdAt ?? "") - Date.parse(a.firstDetectedAt ?? a.createdAt ?? "")).slice(0, 5);
  const recent = p.recentTransactions?.slice(0, 5) ?? [];
  const cdrs = p.recentCdrs ?? [];
  const ratio = (count: number | undefined, total: number) => count == null ? undefined : `${number(total ? count / total * 100 : 0)}%`;
  const perf = p.performance;
  const country = /^[A-Z]{2}$/.test(p.countryCode) ? new Intl.DisplayNames(["en"], { type: "region" }).of(p.countryCode) : p.countryCode;
  const viewAll = tab === "logs" ? `/logs${qs({ cpo: party })}` : tab === "issues" ? `/alerts${qs({ cpo: party })}` : `/transactions${qs({ counterpart: party, stage: tab === "cdrs" ? "cdr_received" : undefined })}`;
  const status = p.routingStatus === "ACTIVE";
  return <div className="connection-details">
    <section className="connection-identity"><span className="connection-brand"><Building2 size={34} /></span><div className="connection-title"><div><h2>{p.name}</h2><Badge value={p.routingStatus} /></div>{p.description && <p>{p.description}</p>}</div><div className="connection-meta"><small>Party ID</small><strong>{party}</strong></div><div className="connection-meta"><small>Country</small><strong>{country}</strong></div><div className="connection-meta"><small>Connected Since</small><strong><CalendarDays size={14} />{dateTime(p.connectedSince)}</strong></div><div className="connection-meta"><small>Last Seen</small><strong><CalendarDays size={14} />{dateTime(p.lastSeenAt)}</strong></div></section>
    <div className="connection-metrics">
      <DetailMetric title="Total Sessions" icon={Users} tone="blue" value={number(p.totalSessions)} />
      <DetailMetric title="Completed" icon={CircleCheck} tone="green" value={number(p.completedSessions)} ratio={ratio(p.completedSessions, p.totalSessions)} />
      <DetailMetric title="Failed" icon={CircleX} tone="red" value={number(p.failedSessions)} ratio={ratio(p.failedSessions, p.totalSessions)} />
      <DetailMetric title="Transaction Share" icon={Zap} tone="orange" value={`${number(p.transactionSharePercent)}%`} />
      <DetailMetric title="Recorded CDR Amount" icon={IndianRupee} tone="orange" value={<Amount values={p.recordedCdrAmounts} />} />
    </div>
    <div className="connection-breakdowns">
      <section className="connection-breakdown"><h3><ChartNoAxesColumnIncreasing size={20} />Performance <small>(Last {perf?.periodDays ?? 30} Days)</small></h3>
        <BreakdownRow title="Total Sessions" icon={Users} value={number(perf?.totalSessions)} />
        <BreakdownRow title="Completed Sessions" icon={CircleCheck} tone="green" value={number(perf?.completedSessions)} ratio={perf ? ratio(perf.completedSessions, perf.totalSessions) : undefined} />
        <BreakdownRow title="Failed Sessions" icon={CircleX} tone="red" value={number(perf?.failedSessions)} ratio={perf ? ratio(perf.failedSessions, perf.totalSessions) : undefined} />
        <BreakdownRow title="Success Ratio" icon={Timer} tone="orange" value={perf ? `${number(perf.successRatioPercent)}%` : "-"} />
        <BreakdownRow title="Open Issues (All Time)" icon={TriangleAlert} tone="red" value={number(p.issueCount)} />
      </section>
      <section className="connection-breakdown connection-financial"><h3><IndianRupee size={20} />Financial &amp; Sharing</h3><BreakdownRow title="Recorded CDR Amount" icon={IndianRupee} tone="green" value={<Amount values={p.recordedCdrAmounts} />} /><BreakdownRow title="Transaction Share" icon={Percent} tone="red" value={`${number(p.transactionSharePercent)}%`} /></section>
      <section className="connection-breakdown"><h3><Settings size={20} />Status &amp; Routing</h3>
        <BreakdownRow title="Current Status" icon={CircleCheck} value={<span className={status ? "connection-active" : "connection-suspended"}>{status ? "Active" : "Suspended"}</span>} />
        <BreakdownRow title="Routing Status" icon={Settings} value={<span className={status ? "connection-active" : "connection-suspended"}>{status ? "Enabled" : "Disabled"}</span>} />
        <BreakdownRow title="Suspended On" icon={CalendarDays} value={dateTime(p.suspension?.at)} />
        <BreakdownRow title="Suspended By" icon={UserRound} value={p.suspension?.by ?? "-"} />
        <BreakdownRow title="Suspended Reason" icon={FileText} value={p.suspension?.reason ?? "-"} />
      </section>
    </div>
    {actions}
    {p.routingRequest?.requestType === "REMOVE" && <div className="connection-request"><strong>Removal request</strong><Badge value={p.routingRequest.status} />{p.routingRequest.reviewComment && <span>{p.routingRequest.reviewComment}</span>}</div>}
    <Tabs value={tab} onValueChange={setTab}><div className="connection-tabs-head"><TabsList>
      {can("transactions.read") && <><TabsTrigger value="sessions">Recent Sessions ({recent.length})</TabsTrigger><TabsTrigger value="cdrs">Recent CDRs ({cdrs.length})</TabsTrigger></>}
      {can("orphans.read") && <TabsTrigger value="issues">Issues{issues.data ? ` (${issueRows.length})` : ""}</TabsTrigger>}
      {can("debug.read") && <TabsTrigger value="logs">Logs{logs.data ? ` (${logs.data.data.length})` : ""}</TabsTrigger>}
    </TabsList>{(can("transactions.read") || can("orphans.read") || can("debug.read")) && <Link to={viewAll}>View All <ArrowRight size={14} /></Link>}</div>
      <TabsContent value="sessions"><Table rows={recent} columns={[
        { key: "rank", title: "#", render: row => recent.indexOf(row) + 1 }, { key: "sessionId", title: "Session ID" },
        { key: "stage", title: "Status", render: row => <Badge value={row.stage} /> },
        { key: "start", title: "Start Time (IST)", render: row => sessionTime(row, "START") }, { key: "stop", title: "End Time (IST)", render: row => sessionTime(row, "STOP") },
        { key: "energyKwh", title: "Energy (kWh)", render: row => number(row.energyKwh) }, { key: "amount", title: "Amount", render: sessionAmount },
        { key: "action", title: "Action", render: row => <Link aria-label={`View session ${row.sessionId}`} to={`/transactions${qs({ id: row.id, counterpart: party })}`}><ChevronRight size={16} /></Link> },
      ]} /></TabsContent>
      <TabsContent value="cdrs"><Table rows={cdrs} columns={[
        { key: "cdrId", title: "CDR ID" }, { key: "sessionId", title: "Session ID" }, { key: "energyKwh", title: "Energy (kWh)", render: row => row.energyKwh == null ? "-" : number(Number(row.energyKwh)) },
        { key: "recordedAmount", title: "Amount", render: row => row.recordedAmount == null ? "-" : row.currency && /^[A-Z]{3}$/.test(row.currency) ? money(row.recordedAmount, row.currency) : number(Number(row.recordedAmount)) },
        { key: "receivedAt", title: "Received (IST)", render: row => dateTime(row.receivedAt) }, { key: "status", title: "Status", render: row => <Badge value={row.forwardedAt ? "forwarded" : "received"} /> },
        { key: "action", title: "Action", render: row => row.sessionRowId ? <Link to={`/transactions${qs({ id: row.sessionRowId, counterpart: party, tab: "cdr" })}`}>View <ChevronRight size={14} /></Link> : "-" },
      ]} /></TabsContent>
      <TabsContent value="issues">{issues.loading || issues.error ? <State loading={issues.loading} error={issues.error} retry={issues.reload} /> : <Table rows={issueRows} columns={[
        { key: "reason", title: "Issue" }, { key: "severity", title: "Severity", render: row => <Badge value={row.severity} /> }, { key: "status", title: "Status", render: row => <Badge value={row.status} /> },
        { key: "action", title: "Action", render: row => <Link to={`/alerts${qs({ cpo: party, id: row.id, type: row.type })}`}>View <ChevronRight size={14} /></Link> },
      ]} />}</TabsContent>
      <TabsContent value="logs">{logs.loading || logs.error ? <State loading={logs.loading} error={logs.error} retry={logs.reload} /> : <Table rows={logs.data?.data ?? []} columns={[
        { key: "createdAt", title: "Time (IST)", render: row => dateTime(row.createdAt) }, { key: "method", title: "Method" }, { key: "path", title: "Path" },
        { key: "statusCode", title: "Status", render: row => <Badge value={String(row.statusCode ?? "unknown")} /> }, { key: "durationMs", title: "Duration", render: row => row.durationMs == null ? "-" : `${row.durationMs}ms` },
        { key: "action", title: "Action", render: row => <Link to={`/logs${qs({ cpo: party, id: row.id })}`}>View <ChevronRight size={14} /></Link> },
      ]} />}</TabsContent>
    </Tabs>
  </div>;
}
