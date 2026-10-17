import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Users, ReceiptText, Play, Zap, Square, FileCheck2, FileX2, IndianRupee, ChevronRight, type LucideIcon } from "lucide-react";
import { useAuth } from "@/auth/AuthProvider";
import { useResource } from "@/hooks/use-resource";
import type { Dashboard, Partner, Page, Transaction } from "@/api/types";
import { Table, Badge, State } from "@/components/layout/shared";
import { TransactionTrend, SessionStatus, stages } from "@/components/dashboard/charts";
import { dateTime, money, number } from "@/lib/format";
import { qs } from "@/api/client";

function formatAmount(amount: string | number, currency?: string | null) {
  return currency && /^[A-Z]{3}$/.test(currency) ? money(amount, currency) : `${number(Number(amount))} (unspecified currency)`;
}

function SummaryCard({ title, value, icon: Icon, tone = "orange", note, chip, to }: { title: string; value: string; icon: LucideIcon; tone?: string; note: string; chip?: string; to?: string }) {
  const content = <><span className={`dashboard-icon ${tone}`}><Icon size={28} strokeWidth={1.8} /></span><div className="dashboard-card-copy"><span>{title}</span><div className="dashboard-card-value"><strong>{value}</strong>{chip && <small className={`dashboard-share ${tone === "red" ? "negative" : ""}`}>{chip}</small>}</div><small className="dashboard-card-note">{note}</small></div></>;
  return to ? <Link className="dashboard-stat" to={to}>{content}</Link> : <div className="dashboard-stat">{content}</div>;
}

export function DashboardPage() {
  const { base, actor, can } = useAuth();
  const [days, setDays] = useState(7);
  const [today, setToday] = useState(() => new Date());
  useEffect(() => {
    const timer = window.setInterval(() => setToday(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);
  const from = new Date(today);
  from.setUTCDate(from.getUTCDate() - days + 1);
  const day = new Date(from.getTime() + 330 * 60_000).toISOString().slice(0, 10);
  const summary = useResource<Dashboard>(`${base}/dashboard`, 60_000);
  const noun = actor?.partyRole === "CPO" ? "eMSPs" : "CPOs";
  const partners = useResource<Partner[]>(can("partners.read") ? `${base}/${actor?.partyRole === "CPO" ? "emsps" : "cpos"}/connected` : null, 60_000);
  const trend = useResource<Page<Transaction>>(can("transactions.read") ? `${base}/transactions${qs({ limit: 100, from: `${day}T00:00:00+05:30` })}` : null, 60_000);
  const data = summary.data;
  const amounts = new Map<string, number>();
  for (const partner of partners.data ?? []) for (const item of partner.recordedCdrAmounts ?? []) {
    if (Number.isFinite(Number(item.amount))) amounts.set(item.currency || "", (amounts.get(item.currency || "") ?? 0) + Number(item.amount));
  }
  const recorded = [...amounts].map(([currency, amount]) => formatAmount(amount, currency)).join(" / ");
  const top = [...(partners.data ?? [])].sort((a, b) => b.totalSessions - a.totalSessions || a.name.localeCompare(b.name)).slice(0, 5);
  const firstName = actor?.email.split("@")[0].split(/[._-]/)[0] ?? "";
  const greeting = firstName ? firstName[0].toUpperCase() + firstName.slice(1) : "";
  const share = (count: number) => `${number(data?.transactions.total ? count / data.transactions.total * 100 : 0)}%`;
  return <div className="dashboard">
    {/* <header className="dashboard-welcome"><div><h1>Welcome back{greeting ? `, ${greeting}` : ""}</h1><p>Here's what's happening across your {actor?.partyRole === "CPO" ? "charging" : "eMSP"} network today.</p></div><span className={`dashboard-environment ${actor?.environment === "production" ? "production" : ""}`}><i />{actor?.environment === "production" ? "Production Environment" : "Stage / UAT Environment"}</span></header> */}
    {summary.error ? <State error={summary.error} retry={summary.reload} /> : !data ? <State loading /> : <>
      <div className="dashboard-stats">
        <SummaryCard title={`Connected ${noun}`} icon={Users} value={number(data.connectedPartners)} note="Connected routing partners" to={can("partners.read") ? "/partners/connected" : undefined} />
        <SummaryCard title="Total Transactions" icon={ReceiptText} value={number(data.transactions.total)} chip={data.transactions.total ? "100%" : "0%"} note="All transactions" to={can("transactions.read") ? "/transactions" : undefined} />
        {[["started", "Started Sessions", Play], ["charging", "Charging Sessions", Zap], ["stopped", "Stopped Sessions", Square], ["cdr_received", "CDRs Received", FileCheck2], ["failed", "Failed Transactions", FileX2]].map(([stage, title, icon]) => <SummaryCard key={String(stage)} title={String(title)} icon={icon as LucideIcon} tone={stage === "failed" ? "red" : stage === "cdr_received" ? "green" : "orange"} value={number(data.transactions.stages[String(stage)] ?? 0)} chip={share(data.transactions.stages[String(stage)] ?? 0)} note="of total transactions" to={can("transactions.read") ? `/transactions?stage=${stage}` : undefined} />)}
        <SummaryCard title="Recorded Amount" icon={IndianRupee} tone="violet" value={partners.loading ? "..." : recorded || (partners.data ? money(0) : "Not available")} note="Recorded CDR amount" to={can("transactions.read") ? "/transactions?stage=cdr_received" : undefined} />
      </div>
      <div className="dashboard-charts">
        <section className="dashboard-panel"><div className="dashboard-panel-head"><h2>Transaction Trend</h2><label className="dashboard-range"><span className="sr-only">Trend period</span><select value={days} onChange={event => setDays(Number(event.target.value))}>{[7, 14, 30].map(value => <option key={value} value={value}>Last {value} Days</option>)}</select></label></div><div className="dashboard-legend">{stages.map(stage => <span key={stage.key}><i style={{ backgroundColor: stage.color }} />{stage.label}</span>)}</div>{trend.loading || trend.error ? <State loading={trend.loading} error={trend.error} retry={trend.reload} /> : <TransactionTrend transactions={trend.data?.data ?? []} days={days} today={today} />}<div className="dashboard-chart-caption">Updated transactions (IST){trend.data?.meta.hasMore ? " - latest 100 records" : ""}</div></section>
        <section className="dashboard-panel"><div className="dashboard-panel-head"><h2>Session Status</h2></div><SessionStatus counts={data.transactions.stages} /></section>
      </div>
      <div className="dashboard-tables">
        <section className="dashboard-panel"><div className="dashboard-panel-head"><h2>Recent Transactions</h2>{can("transactions.read") && <Link to="/transactions">View All</Link>}</div><Table rows={data.recentTransactions} columns={[
          { key: "sessionId", title: "Session ID", render: (row: Transaction) => <Link to={`/transactions?id=${encodeURIComponent(row.id)}`}>{row.sessionId}</Link> },
          { key: "stage", title: "Status", render: (row: Transaction) => <Badge value={row.stage} /> },
          { key: "cpo", title: "CPO" }, { key: "emsp", title: "eMSP" },
          { key: "lastUpdated", title: "Updated (IST)", render: (row: Transaction) => dateTime(row.lastUpdated) },
          { key: "action", title: "Actions", render: (row: Transaction) => <Link className="dashboard-row-action" to={`/transactions?id=${encodeURIComponent(row.id)}`} aria-label={`View ${row.sessionId}`}><ChevronRight size={17} /></Link> },
        ]} /></section>
        <section className="dashboard-panel"><div className="dashboard-panel-head"><h2>Top {noun} by Transactions</h2>{can("partners.read") && <Link to="/partners/connected">View All</Link>}</div>{partners.error ? <State error={partners.error} retry={partners.reload} /> : partners.loading ? <State loading /> : <Table rows={top} columns={[
          { key: "rank", title: "#", render: (row: Partner) => top.indexOf(row) + 1 },
          { key: "name", title: `${noun === "eMSPs" ? "eMSP" : "CPO"} Name`, render: (row: Partner) => <Link className="dashboard-partner-name" to={`/transactions?counterpart=${encodeURIComponent(`${row.countryCode}-${row.partyId}`)}`}><span className="dashboard-partner-avatar">{row.partyId.slice(0, 2)}</span><span>{row.name}</span></Link> },
          { key: "totalSessions", title: "Sessions", render: (row: Partner) => number(row.totalSessions) },
          { key: "successRatioPercent", title: "Success Rate", render: (row: Partner) => <div className="dashboard-success"><span>{number(row.successRatioPercent)}%</span><progress value={Math.max(0, Math.min(100, row.successRatioPercent))} max="100" aria-label={`${row.name} success rate`} /></div> },
          { key: "recordedCdrAmounts", title: "Amount", render: (row: Partner) => row.recordedCdrAmounts?.length ? row.recordedCdrAmounts.map(item => formatAmount(item.amount, item.currency)).join(" / ") : "-" },
        ]} />}</section>
      </div>
    </>}
  </div>;
}
