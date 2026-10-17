import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Building2, Users, CircleCheck, CirclePause, ChartNoAxesCombined, Filter, Search, RotateCcw, Download, Plus, X, RefreshCw, Info, ArrowUpDown, Flag } from "lucide-react";
import type { Partner, RoutingRequest } from "@/api/types";
import { useAuth } from "@/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { Badge, Metric, Pager, State, Table } from "@/components/layout/shared";
import { dateTime, money, number } from "@/lib/format";

type Resource<T> = { data: T | null; loading: boolean; error: string; reload: () => void };
const initialFilters = { search: "", status: "", min: "", max: "", sort: "name" };
function countryName(code: string) {
  return /^[A-Z]{2}$/.test(code) ? new Intl.DisplayNames(["en"], { type: "region" }).of(code) ?? code : code;
}
function Country({ code }: { code: string }) {
  return <span className="partner-country" role="img" aria-label={countryName(code)} title={countryName(code)}><span className={`partner-flag partner-flag-${code.toLowerCase()}`} aria-hidden="true">{code === "IN" || code === "AE" ? null : <Flag size={13} />}</span></span>;
}
function PartnerName({ name, partyId, colorIndex }: { name: string; partyId: string; colorIndex: number }) {
  return <span className="partner-name"><span className={`partner-avatar partner-avatar-${colorIndex % 7}`} title={partyId}><Building2 size={17} /></span><span>{name}</span></span>;
}
function exportPartners(rows: Partner[], available: boolean, noun: string) {
  const columns = available ? ["Name", "Party ID", "Country", "Completed Sessions", "Success Ratio (%)", "Issues"] : ["Name", "Party ID", "Country", "Sessions", "Success Ratio (%)", "Transaction Share (%)", "Recorded CDR Amount", "Issues", "Status"];
  const csvCell = (value: unknown) => {
    const raw = String(value ?? "");
    const safe = /^\s*[=+\-@]|^[\t\r\n]/.test(raw) ? `'${raw}` : raw;
    return `"${safe.replaceAll('"', '""')}"`;
  };
  const data = rows.map(row => [row.name, `${row.countryCode}-${row.partyId}`, countryName(row.countryCode), available ? row.completedSessions : row.totalSessions, row.successRatioPercent,
    ...(available ? [row.issueCount] : [row.transactionSharePercent, row.recordedCdrAmounts?.map(value => `${value.currency ?? ""} ${value.amount}`).join(" / "), row.issueCount, row.routingStatus])]);
  const url = URL.createObjectURL(new Blob(["\uFEFF", [columns, ...data].map(row => row.map(csvCell).join(",")).join("\r\n")], { type: "text/csv;charset=utf-8" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${available ? "available" : "connected"}-${noun.toLowerCase()}.csv`;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function PartnerListing({ available, noun, list, history, selectedId, busy, onPartner, onRequest, onRetry, onRefresh }: {
  available: boolean; noun: string; list: Resource<Partner[]>; history: Resource<RoutingRequest[]>; selectedId?: string; busy: boolean;
  onPartner: (partner: Partner) => void; onRequest: (request: RoutingRequest) => void; onRetry: (request: RoutingRequest) => void; onRefresh: () => void;
}) {
  const { actor, can } = useAuth();
  const [form, setForm] = useState(initialFilters);
  const [filters, setFilters] = useState(initialFilters);
  const [rangeError, setRangeError] = useState("");
  const [notice, setNotice] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [page, setPage] = useState(1);
  useEffect(() => { setForm(initialFilters); setFilters(initialFilters); setRangeError(""); setNotice(true); setPage(1); setShowAll(false); }, [available, noun]);
  const all = list.data ?? [];
  const count = (row: Partner) => available ? row.completedSessions : row.totalSessions;
  const rows = all.filter(row => `${row.name} ${row.countryCode}-${row.partyId}`.toLowerCase().includes(filters.search.trim().toLowerCase())
    && (!filters.status || row.routingStatus === filters.status)
    && (filters.min === "" || count(row) >= Number(filters.min)) && (filters.max === "" || count(row) <= Number(filters.max)))
    .sort((a, b) => filters.sort === "sessions" ? count(b) - count(a) || a.name.localeCompare(b.name) : filters.sort === "success" ? b.successRatioPercent - a.successRatioPercent || a.name.localeCompare(b.name) : filters.sort === "name-desc" ? b.name.localeCompare(a.name) : a.name.localeCompare(b.name));
  const currentPage = Math.min(page, Math.max(1, Math.ceil(rows.length / 10)));
  const visible = rows.slice((currentPage - 1) * 10, currentPage * 10);
  const active = all.filter(row => row.routingStatus === "ACTIVE").length;
  const suspended = all.filter(row => row.routingStatus === "SUSPENDED").length;
  const average = all.length ? all.reduce((sum, row) => sum + row.successRatioPercent, 0) / all.length : 0;
  const requests = (history.data ?? []).filter(request => request.requestType === (available ? "CONNECT" : "REMOVE"));
  const reset = () => { setForm(initialFilters); setFilters(initialFilters); setRangeError(""); setPage(1); };
  const percent = (value: number) => `${number(all.length ? value / all.length * 100 : 0)}%`;
  const amount = (row: Partner) => row.recordedCdrAmounts?.map(item => item.currency && /^[A-Z]{3}$/.test(item.currency) ? money(item.amount, item.currency) : number(Number(item.amount))).join(" / ") || "-";
  const provider = (request: RoutingRequest) => actor?.partyRole === "CPO" ? request.emsp : request.cpo;
  return <div className={`partner-listing ${available ? "is-available" : "is-connected"}`}>
    <header className="partner-listing-head"><div><h1>{available ? "Available" : "Connected"} {noun}</h1><p>{available ? `Discover ${noun} available on the platform.` : `Manage all connected ${noun} and view their details, performance and status.`}</p></div>
      {!available && <Button asChild><Link to="/partners/available"><Plus size={16} />Connect New {noun === "eMSPs" ? "eMSP" : "CPO"}</Link></Button>}
      {available && notice && <div className="partner-available-notice"><Info size={21} /><span>These {noun} are not yet connected to your network.</span><button type="button" aria-label="Dismiss notice" title="Dismiss notice" onClick={() => setNotice(false)}><X size={16} /></button></div>}
    </header>
    <div className="partner-listing-metrics">
      <Metric title={`Total ${available ? "Available " : ""}${noun}`} icon={Users} tone={available ? undefined : "blue"} value={list.data ? number(all.length) : "-"} />
      {!available && <><div className="partner-stat"><Metric title="Active" icon={CircleCheck} tone="green" value={list.data ? number(active) : "-"} /><span className="partner-stat-share green"><b>{percent(active)}</b><small>of connected partners</small></span></div>
        <div className="partner-stat"><Metric title="Suspended" icon={CirclePause} tone="red" value={list.data ? number(suspended) : "-"} /><span className="partner-stat-share red"><b>{percent(suspended)}</b><small>of connected partners</small></span></div>
        <Metric title="Avg. Success Ratio" icon={ChartNoAxesCombined} tone="blue" value={list.data ? `${number(average)}%` : "-"} /></>}
    </div>
    <form className="partner-listing-filters" onSubmit={event => { event.preventDefault(); if (form.min !== "" && form.max !== "" && Number(form.min) > Number(form.max)) { setRangeError("Minimum sessions cannot exceed maximum sessions"); return; } setRangeError(""); setFilters(form); setPage(1); }}>
      <div className="partner-filter-head"><h2><Filter size={18} />Filters</h2>{available && <Button type="button" variant="outline" size="sm" onClick={reset}><RotateCcw size={14} />Reset</Button>}</div>
      <div className="partner-filter-fields">
        <label className="field">Search<span className="partner-search-input"><Search size={16} /><input placeholder="Name or party ID" value={form.search} onChange={event => setForm({ ...form, search: event.target.value })} /></span></label>
        {!available && <label className="field">Status<select aria-label="Status" value={form.status} onChange={event => setForm({ ...form, status: event.target.value })}><option value="">All statuses</option><option value="ACTIVE">Active</option><option value="SUSPENDED">Suspended</option></select></label>}
        <label className="field">Min. Sessions<input type="number" min="0" step="1" placeholder="Min" value={form.min} onChange={event => setForm({ ...form, min: event.target.value })} /></label>
        <label className="field">Max. Sessions<input type="number" min="0" step="1" placeholder="Max" value={form.max} onChange={event => setForm({ ...form, max: event.target.value })} /></label>
        {available && <label className="field">Sort by<select aria-label="Sort by" value={form.sort} onChange={event => setForm({ ...form, sort: event.target.value })}><option value="name">Name (A - Z)</option><option value="name-desc">Name (Z - A)</option><option value="sessions">Completed Sessions</option><option value="success">Success Ratio</option></select></label>}
        <Button type="submit"><Search size={16} />Search</Button>{!available && <Button type="button" variant="outline" onClick={reset}><RotateCcw size={16} />Reset</Button>}
      </div>{rangeError && <p role="alert" className="error">{rangeError}</p>}
    </form>
    <section className="partner-listing-table" aria-label={`${available ? "Available" : "Connected"} partners`}><div className="partner-table-head"><h2>{available ? "Available" : "Connected"} {noun} ({rows.length})</h2><div className="partner-table-tools">{!available && <label><span className="sr-only">Sort partners</span><ArrowUpDown size={14} /><select aria-label="Sort partners" value={filters.sort} onChange={event => { setForm({ ...form, sort: event.target.value }); setFilters({ ...filters, sort: event.target.value }); setPage(1); }}><option value="name">Name (A - Z)</option><option value="name-desc">Name (Z - A)</option><option value="sessions">Sessions</option><option value="success">Success Ratio</option></select></label>}<Button variant="outline" size="sm" disabled={list.loading || !rows.length} onClick={() => exportPartners(rows, available, noun)}><Download size={15} />Export</Button></div></div>
      {list.loading || list.error ? <State loading={list.loading} error={list.error} retry={list.reload} /> : <><Table rows={visible} selected={selectedId} click={onPartner} columns={[
        { key: "rank", title: "#", render: row => rows.indexOf(row) + 1 },
        { key: "name", title: "Name", render: row => <PartnerName name={row.name} partyId={row.partyId} colorIndex={all.indexOf(row)} /> },
        { key: "partyId", title: "Party ID", render: row => `${row.countryCode}-${row.partyId}` },
        { key: "countryCode", title: "Country", render: row => <Country code={row.countryCode} /> },
        { key: "sessions", title: available ? "Completed Sessions" : "Sessions", render: row => number(count(row)) },
        { key: "successRatioPercent", title: "Success Ratio", render: row => `${number(row.successRatioPercent)}%` },
        ...(!available ? [{ key: "transactionSharePercent", title: "Transaction Share", render: (row: Partner) => `${number(row.transactionSharePercent)}%` }, { key: "recordedCdrAmounts", title: "Recorded CDR Amount", render: amount }] : []),
        { key: "issueCount", title: "Issues", render: row => number(row.issueCount) },
        ...(!available ? [{ key: "routingStatus", title: "Status", render: (row: Partner) => <Badge value={row.routingStatus?.toLowerCase()} /> }] : []),
      ]} />{rows.length > 10 && <Pager page={currentPage} more={currentPage * 10 < rows.length} setPage={setPage} />}</>}
    </section>
    <section className="partner-listing-table" aria-label={`${available ? "Connection" : "Removal"} requests`}><div className="partner-table-head"><h2>{available ? "Connection Requests" : "Removal Requests"} ({requests.length})</h2><div className="partner-table-tools"><Button size="icon-sm" variant="ghost" aria-label="Refresh routing requests" title="Refresh routing requests" onClick={onRefresh}><RefreshCw size={15} /></Button>{requests.length > 5 && <Button variant="link" size="sm" onClick={() => setShowAll(!showAll)}>{showAll ? "Show Less" : "View All"}</Button>}</div></div>
      {history.loading || history.error ? <State loading={history.loading} error={history.error} retry={history.reload} /> : <Table rows={showAll ? requests : requests.slice(0, 5)} click={onRequest} columns={[
        { key: "rank", title: "#", render: row => requests.indexOf(row) + 1 },
        { key: "partner", title: `${noun === "eMSPs" ? "eMSP" : "CPO"} Name`, render: row => <PartnerName name={provider(row)?.name ?? "-"} partyId={provider(row)?.partyId ?? ""} colorIndex={requests.indexOf(row)} /> },
        { key: "partyId", title: "Party ID", render: row => provider(row) ? `${provider(row)?.countryCode}-${provider(row)?.partyId}` : "-" },
        { key: "requestType", title: "Request Type", render: () => available ? "Connection" : "Removal" },
        { key: "status", title: "Status", render: row => <Badge value={row.status.toLowerCase()} /> },
        { key: "createdAt", title: "Submitted On (IST)", render: row => dateTime(row.createdAt) },
        { key: "reviewComment", title: "Review Comment" },
        { key: "notificationStatus", title: "Notification", render: (row: RoutingRequest) => row.status === "PENDING" && row.notificationStatus === "FAILED" && can("connection.manage") ? <Button size="sm" variant="outline" disabled={busy} onClick={event => { event.stopPropagation(); onRetry(row); }} onKeyDown={event => event.stopPropagation()}><RotateCcw size={14} />Retry notification</Button> : <span className={row.notificationStatus === "SENT" ? "partner-notification-sent" : ""}><Badge value={row.notificationStatus.toLowerCase()} /></span> },
      ]} />}
    </section>
  </div>;
}
