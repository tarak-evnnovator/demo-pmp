import type { CSSProperties } from "react";
import type { Transaction } from "@/api/types";
import { number } from "@/lib/format";

export const stages = [
  { key: "charging", label: "Charging", color: "var(--dashboard-charging)" },
  { key: "cdr_received", label: "CDR Received", color: "var(--dashboard-cdr)" },
  { key: "failed", label: "Failed", color: "var(--dashboard-failed)" },
];
function istDay(date: Date) { return new Date(date.getTime() + 330 * 60_000).toISOString().slice(0, 10); }

export function TransactionTrend({ transactions, days, today }: { transactions: Transaction[]; days: number; today: Date }) {
  const buckets = Array.from({ length: days }, (_, index) => {
    const date = new Date(today);
    date.setUTCDate(date.getUTCDate() - days + index + 1);
    const key = istDay(date);
    const rows = transactions.filter(row => stages.some(stage => stage.key === row.stage) && Number.isFinite(Date.parse(row.lastUpdated)) && istDay(new Date(row.lastUpdated)) === key);
    return { key, label: new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" }).format(date), counts: stages.map(stage => rows.filter(row => row.stage === stage.key).length), total: rows.length };
  });
  const max = Math.max(4, Math.ceil(Math.max(...buckets.map(bucket => bucket.total)) / 4) * 4);
  return <div className="dashboard-trend" role="img" aria-label={`Transactions by last update over ${days} days. ${buckets.map(bucket => `${bucket.label}: ${bucket.total}`).join("; ")}`}>
    <div className="dashboard-y-axis">{[max, max * .75, max * .5, max * .25, 0].map(value => <span key={value}>{number(value)}</span>)}</div>
    <div className="dashboard-plot"><div className="dashboard-grid-lines">{[0, 1, 2, 3, 4].map(index => <i key={index} />)}</div><div className="dashboard-bars">{buckets.map((bucket, index) => <div className="dashboard-bar-column" key={bucket.key}><div className="dashboard-bar-stack" tabIndex={0} aria-label={`${bucket.label}: ${stages.map((stage, i) => `${stage.label} ${bucket.counts[i]}`).join(", ")}`} title={`${bucket.label}: ${stages.map((stage, i) => `${stage.label} ${bucket.counts[i]}`).join(", ")}`}>{stages.map((stage, i) => <div key={stage.key} style={{ height: `${bucket.counts[i] / max * 100}%`, backgroundColor: stage.color }} />)}</div><span>{days <= 7 || index % Math.ceil(days / 7) === 0 || index === days - 1 ? bucket.label : ""}</span></div>)}</div></div>
  </div>;
}

export function SessionStatus({ counts }: { counts: Record<string, number> }) {
  const total = stages.reduce((sum, stage) => sum + (counts[stage.key] ?? 0), 0);
  let offset = 0;
  const segments = stages.map(stage => {
    const start = offset;
    offset += total ? (counts[stage.key] ?? 0) / total * 100 : 0;
    return `${stage.color} ${start}% ${offset}%`;
  });
  return <div className="dashboard-status"><div className="dashboard-donut" role="img" aria-label={`${total} total transactions`} style={{ "--donut-fill": total ? `conic-gradient(${segments.join(",")})` : "var(--line)" } as CSSProperties}><div><strong>{number(total)}</strong><span>Total</span></div></div><div className="dashboard-status-legend">{stages.map(stage => <div key={stage.key}><i style={{ backgroundColor: stage.color }} /><span>{stage.label}<strong>{number(counts[stage.key] ?? 0)}</strong></span><b style={{ color: stage.color }}>{number(total ? (counts[stage.key] ?? 0) / total * 100 : 0)}%</b></div>)}</div></div>;
}
