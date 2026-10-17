import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, RotateCcw, Filter, Bell, FileText, Download, ChevronLeft, ChevronRight } from "lucide-react";
import { useAuth } from "@/auth/AuthProvider";
import { useResource } from "@/hooks/use-resource";
import { qs } from "@/api/client";
import type { Page, Log, Alert } from "@/api/types";
import { Button } from "@/components/ui/button";
import {
  Table,
  Detail,
  Facts,
  Badge,
  State,
  CopyId,
} from "@/components/layout/shared";
import { dateTime, dateQuery, label } from "@/lib/format";
import { LogDetails } from "@/components/logs/log-details";
export function OperationsPage({ alerts = false }: { alerts?: boolean }) {
  const { base } = useAuth();
  const [params] = useSearchParams();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const emptyPageFilters = { reason: "", severity: "", status: "", module: "", path: "" };
  const [pageForm, setPageForm] = useState(emptyPageFilters);
  const [pageFilters, setPageFilters] = useState(emptyPageFilters);
  const [form, setForm] = useState({ from: "", to: "", cpo: params.get("cpo") ?? "", method: "", statusCode: "", direction: "" });
  const [filter, setFilter] = useState(form);
  const [selected, setSelected] = useState<{
    id: string;
    type?: string;
  } | null>(() => params.get("id") ? { id: params.get("id")!, type: alerts ? params.get("type") ?? "session" : undefined } : null);
  const list = useResource<
    | Page<Log>
    | {
        data: { sessionOrphans: Alert[]; cdrHygiene: Alert[] };
        meta: Page<Log>["meta"];
      }
  >(
    `${base}/${alerts ? "alerts" : "debug-logs"}${qs({ page, limit, ...filter, from: dateQuery(filter.from), to: dateQuery(filter.to, true) })}`,
  );
  const detail = useResource<Log | Alert>(
    selected
      ? `${base}/${alerts ? `alerts/${selected.type}` : "debug-logs"}/${selected.id}`
      : null,
  );
  const rows = list.data
    ? alerts
      ? [
          ...(list.data.data as { sessionOrphans: Alert[] }).sessionOrphans.map(
            (r) => ({ ...r, type: "session" }),
          ),
          ...(list.data.data as { cdrHygiene: Alert[] }).cdrHygiene.map(
            (r) => ({ ...r, type: "cdr" }),
          ),
        ]
      : (list.data.data as Log[])
    : [];
  const d = detail.data;
  const visibleRows = rows.filter(row => alerts
    ? (!pageFilters.reason || (row as Alert).reason === pageFilters.reason) && (!pageFilters.severity || (row as Alert).severity === pageFilters.severity) && (!pageFilters.status || (row as Alert).status === pageFilters.status)
    : (!pageFilters.module || (row as Log).module === pageFilters.module) && (!pageFilters.path || ((row as Log).path ?? "").toLowerCase().includes(pageFilters.path.trim().toLowerCase())));
  const choices = (key: string) => [...new Set(rows.map(row => (row as unknown as Record<string, unknown>)[key]).filter((value): value is string => typeof value === "string" && value !== ""))].sort();
  const pageSelect = (key: "reason" | "severity" | "status" | "module", title: string, all: string) => <label className="field">{title} (this page)<select aria-label={title} value={pageForm[key]} onChange={event => setPageForm(previous => ({ ...previous, [key]: event.target.value }))}><option value="">{all}</option>{[...new Set([...choices(key), ...(pageForm[key] ? [pageForm[key]] : [])])].map(value => <option key={value} value={value}>{label(value)}</option>)}</select></label>;
  const title = alerts ? "Alerts" : "Logs";
  const Icon = alerts ? Bell : FileText;
  function exportPage() {
    const keys = alerts ? ["sessionId", "reason", "severity", "status", "lastCheckedAt", "createdAt"] : ["createdAt", "direction", "partyId", "module", "method", "path", "statusCode", "durationMs", "correlationId"];
    const csv = (value: unknown) => { const text = String(value ?? ""); return `"${(/^[\s]*[=+@-]/.test(text) ? "'" + text : text).replaceAll('"', '""')}"`; };
    const data = [keys, ...visibleRows.map(row => keys.map(key => { const value = (row as unknown as Record<string, unknown>)[key]; return key.endsWith("At") && value ? dateTime(String(value)) : value; }))];
    const url = URL.createObjectURL(new Blob(["\uFEFF", data.map(row => row.map(csv).join(",")).join("\r\n")], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = `${title.toLowerCase()}-page-${page}.csv`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <div className={`operations-page ${alerts ? "operations-alerts" : "operations-logs"}`}>
      <header className="transactions-heading"><h1>{title}</h1><p>{alerts ? "Monitor important events, issues and notifications across your partner network." : "View and monitor system activities, API calls and partner interactions."}</p></header>
      <div className="operations-work-area">
        <div>
          <form
            className="transactions-filters"
            onSubmit={(e) => {
              e.preventDefault();
              setPage(1);
              setFilter(form);
              setPageFilters(pageForm);
            }}
          >
              <div className="transactions-section-heading"><span className="transactions-section-icon"><Filter size={23} /></span><div><h2>Filters</h2><p>{alerts ? "Search and filter alerts using the criteria below." : "Narrow down the logs using the criteria below."}</p></div></div>
              <div className="operations-filter-grid transactions-filter-grid">
                {["from", "to", "cpo"].map((k) => (
                  <label className="field" key={k}>
                    {k === "cpo" ? "Partner party ID" : label(k)}
                    <div className="transactions-input">{k === "cpo" && <Search size={16} aria-hidden="true" />}<input
                      type={k === "cpo" ? "text" : "date"}
                      aria-label={k === "cpo" ? "Partner party ID" : label(k)}
                      placeholder={k === "cpo" ? "Search by partner party ID..." : undefined}
                      minLength={k === "cpo" ? 4 : undefined}
                      maxLength={k === "cpo" ? 8 : undefined}
                      min={k === "to" ? form.from || undefined : undefined}
                      max={k === "from" ? form.to || undefined : undefined}
                      value={form[k as keyof typeof form]}
                      onChange={(e) =>
                        setForm({ ...form, [k]: e.target.value })
                      }
                    /></div>
                  </label>
                ))}
                {!alerts && <>
                  <label className="field">Method<select aria-label="Method" value={form.method} onChange={e => setForm({ ...form, method: e.target.value })}><option value="">All methods</option>{["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"].map(value => <option key={value}>{value}</option>)}</select></label>
                  <label className="field">HTTP status<input aria-label="HTTP status" type="number" min={100} max={599} placeholder="200, 400, 401..." value={form.statusCode} onChange={e => setForm({ ...form, statusCode: e.target.value })} /></label>
                  <label className="field">Direction<select aria-label="Direction" value={form.direction} onChange={e => setForm({ ...form, direction: e.target.value })}><option value="">All directions</option><option value="inbound">Inbound</option><option value="outbound">Outbound</option></select></label>
                  {pageSelect("module", "Module", "All modules")}
                  <label className="field">Path (this page)<div className="transactions-input"><Search size={16} aria-hidden="true" /><input aria-label="Path" placeholder="Search by path..." value={pageForm.path} onChange={event => setPageForm(previous => ({ ...previous, path: event.target.value }))} /></div></label>
                </>}
                {alerts && <>{pageSelect("reason", "Reason", "All reasons")}{pageSelect("severity", "Severity", "All severities")}{pageSelect("status", "Status", "All statuses")}</>}
              </div>
              <div className="operations-filter-actions">
                <Button>
                  <Search size={16} />
                  Search
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const empty = { from: "", to: "", cpo: "", method: "", statusCode: "", direction: "" };
                    setForm(empty);
                    setFilter(empty);
                    setPage(1);
                    setPageForm(emptyPageFilters);
                    setPageFilters(emptyPageFilters);
                  }}
                >
                  <RotateCcw size={16} />
                  Reset
                </Button>
              </div>
          </form>
          <section className="transactions-results operations-results" aria-label={`${title} list`}>
            <div className="transactions-results-head"><div className="transactions-section-heading"><span className="transactions-section-icon"><Icon size={23} /></span><div><h2>{title} ({visibleRows.length} on this page)</h2><p>{alerts ? "Alerts generated across your partner network." : "System activities and API call logs for your partner network."}</p></div></div><Button variant="outline" type="button" disabled={!visibleRows.length || list.loading} onClick={exportPage}><Download size={16} />Export page</Button></div>
          {list.loading || list.error ? (
            <State
              loading={list.loading}
              error={list.error}
              retry={list.reload}
            />
          ) : (
            <>
              <Table
                rows={visibleRows.map((row, index) => ({ ...row, rowNumber: alerts ? index + 1 : (page - 1) * limit + index + 1 }))}
                selected={selected?.id}
                click={(r) => setSelected({ id: r.id, type: r.type })}
                columns={
                  alerts
                    ? [
                        { key: "rowNumber", title: "#" },
                        { key: "sessionId", title: "Session ID" },
                        { key: "reason", title: "Reason" },
                        {
                          key: "severity",
                          title: "Severity",
                          render: (r) => <span className={`operations-pill severity-${String(r.severity).toLowerCase()}`}>{label(r.severity)}</span>,
                        },
                        {
                          key: "status",
                          title: "Status",
                          render: (r) => <span className={`operations-pill alert-${String(r.status).toLowerCase()}`}>{label(r.status)}</span>,
                        },
                        {
                          key: "lastCheckedAt",
                          title: "Checked (IST)",
                          render: (r) => dateTime(r.lastCheckedAt),
                        },
                      ]
                    : [
                        { key: "rowNumber", title: "#" },
                        {
                          key: "createdAt",
                          title: "Time (IST)",
                          render: (r) => dateTime(r.createdAt),
                        },
                        {
                          key: "direction",
                          title: "Direction",
                          render: (r) => { const direction = r.direction === "IN" ? "inbound" : r.direction === "OUT" ? "outbound" : String(r.direction ?? "").toLowerCase(); return <span className={`operations-pill direction-${direction}`}>{label(direction) || "-"}</span>; },
                        },
                        { key: "partyId", title: "Partner" },
                        { key: "module", title: "Module" },
                        { key: "method", title: "Method", render: (r) => <span className={`operations-pill method-${String(r.method).toLowerCase()}`}>{r.method}</span> },
                        { key: "path", title: "Path", render: (r) => <span className="operations-ellipsis" title={r.path}>{r.path ?? "-"}</span> },
                        {
                          key: "statusCode",
                          title: "Status",
                          render: (r) => <Badge value={r.statusCode == null ? null : String(r.statusCode)} />,
                        },
                        {
                          key: "durationMs",
                          title: "Duration",
                          render: (r) => `${r.durationMs ?? "-"} ms`,
                        },
                        { key: "correlationId", title: "Correlation ID", render: (r) => <span className="operations-ellipsis" title={r.correlationId}>{r.correlationId ?? "-"}</span> },
                      ]
                }
              />
              <footer className="transactions-pagination"><span>Page {page} · Showing {visibleRows.length} {title.toLowerCase()}</span><div><label>Rows per {alerts ? "category" : "page"}<select aria-label="Page size" value={limit} onChange={event => { setLimit(Number(event.target.value)); setPage(1); }}>{[10, 20, 50].map(value => <option key={value}>{value}</option>)}</select></label><Button variant="outline" size="icon" aria-label="Previous page" disabled={page === 1} onClick={() => setPage(page - 1)}><ChevronLeft size={16} /></Button><span className="transactions-current-page" aria-current="page">{page}</span><Button variant="outline" size="icon" aria-label="Next page" disabled={!list.data?.meta.hasMore} onClick={() => setPage(page + 1)}><ChevronRight size={16} /></Button></div></footer>
            </>
          )}
          </section>
        </div>
        {selected && (
          <Detail
            title={alerts ? "Alert details" : "API log details"}
            description={alerts ? "Complete information" : "Full request and response captured during debug mode."}
            close={() => setSelected(null)}
          >
            {detail.loading || detail.error ? (
              <State
                loading={detail.loading}
                error={detail.error}
                retry={detail.reload}
              />
            ) : (
              d && (
                <>
                {alerts ? <Facts
                  values={Object.fromEntries(
                    Object.entries(d)
                      .filter(
                        ([key, value]) =>
                          key !== "notes" && key !== "requestCurl" && typeof value !== "object",
                      )
                      .map(([key, value]) => [
                        label(key.replace(/([a-z])([A-Z])/g, "$1 $2")),
                        key === "direction" ? (value === "IN" ? "Inbound" : value === "OUT" ? "Outbound" : label(String(value))) : key.endsWith("At") ? (
                          dateTime(value as string)
                        ) : key.toLowerCase().endsWith("id") && value ? (
                          <CopyId value={String(value)} />
                        ) : (
                          String(value ?? "-")
                        ),
                      ]),
                  )}
                /> : <LogDetails log={d as Log} close={() => setSelected(null)} />}
                </>
              )
            )}
          </Detail>
        )}
      </div>
    </div>
  );
}
