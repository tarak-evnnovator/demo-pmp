import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, RotateCcw, Filter, Receipt, Download, ChevronLeft, ChevronRight } from "lucide-react";
import { useAuth } from "@/auth/AuthProvider";
import { useResource } from "@/hooks/use-resource";
import { qs } from "@/api/client";
import type { Page, Transaction } from "@/api/types";
import { Button } from "@/components/ui/button";
import {
  Table,
  Detail,
  Badge,
  State,
} from "@/components/layout/shared";
import { dateTime, dateQuery, number, money, label } from "@/lib/format";
import { TransactionDetails } from "@/components/transactions/transaction-details";
export function TransactionsPage() {
  const { base, actor } = useAuth();
  const [params, setParams] = useSearchParams();
  const selected = params.get("id");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [form, setForm] = useState({
    sessionId: "",
    counterpart: params.get("counterpart") ?? "",
    stage: params.get("stage") ?? "",
    from: params.get("from") ?? "",
    to: params.get("to") ?? "",
  });
  const [filters, setFilters] = useState(form);
  const list = useResource<Page<Transaction>>(
    `${base}/transactions${qs({ page, limit, ...filters, from: dateQuery(filters.from), to: dateQuery(filters.to, true) })}`,
  );
  const detail = useResource<Transaction>(
    selected ? `${base}/transactions/${encodeURIComponent(selected)}` : null,
  );
  const t = detail.data;
  const rows = list.data?.data ?? [];
  const counterpart = actor?.partyRole === "CPO" ? "eMSP" : "CPO";
  function exportPage() {
    const cell = (value: unknown) => {
      const text = String(value ?? "");
      return `"${(/^[\s]*[=+@-]/.test(text) ? "'" + text : text).replaceAll('"', '""')}"`;
    };
    const data = [["Date & Time (IST)", "Session ID", counterpart, "Location", "EVSE", "Status", "Energy (kWh)", "Recorded amount"], ...rows.map(row => [dateTime(row.lastUpdated), row.sessionId, actor?.partyRole === "CPO" ? row.emsp : row.cpo, row.locationId, row.evseUid, label(row.stage), row.energyKwh, row.cdrs?.map(cdr => money(cdr.recordedAmount, cdr.currency ?? "INR")).join(" / ")])];
    const url = URL.createObjectURL(new Blob(["\uFEFF", data.map(row => row.map(cell).join(",")).join("\r\n")], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = `transactions-page-${page}.csv`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <div className="transactions-page">
      <header className="transactions-heading"><h1>Transactions</h1><p>View and analyze all charging transactions across your {counterpart} network.</p></header>
      <div className="transactions-work-area">
        <div>
          <form
            className="transactions-filters"
            onSubmit={(e) => {
              e.preventDefault();
              setPage(1);
              setFilters(form);
            }}
          >
              <div className="transactions-section-heading"><span className="transactions-section-icon"><Filter size={23} /></span><div><h2>Filters</h2><p>Search and filter transactions using the criteria below.</p></div></div>
              <div className="transactions-filter-grid">
                {["sessionId", "counterpart", "from", "to"].map((k) => (
                  <label className="field" key={k}>
                    {k === "counterpart"
                      ? actor?.partyRole === "CPO"
                        ? "eMSP party ID"
                        : "CPO party ID"
                      : k === "sessionId" ? "Session ID" : k === "from" ? "From Date" : "To Date"}
                    <div className="transactions-input">
                    {k !== "from" && k !== "to" && <Search size={16} aria-hidden="true" />}
                    <input
                      type={k === "from" || k === "to" ? "date" : "text"}
                      maxLength={k === "sessionId" ? 36 : undefined}
                      placeholder={k === "sessionId" ? "Search by session ID..." : k === "counterpart" ? `Search by ${counterpart} party ID...` : undefined}
                      pattern={k === "counterpart" ? "[A-Za-z]{2}-[A-Za-z0-9]{3}" : undefined}
                      title={k === "counterpart" ? "Party ID, for example IN-XYZ" : undefined}
                      min={k === "to" ? form.from || undefined : undefined}
                      max={k === "from" ? form.to || undefined : undefined}
                      value={form[k as keyof typeof form]}
                      onChange={(e) =>
                        setForm({ ...form, [k]: e.target.value })
                      }
                    />
                    </div>
                  </label>
                ))}
                <label className="field">
                  Status
                  <select aria-label="Status"
                    value={form.stage}
                    onChange={(e) =>
                      setForm({ ...form, stage: e.target.value })
                    }
                  >
                    <option value="">All statuses</option>
                    {[
                      "started",
                      "charging",
                      "stopped",
                      "cdr_received",
                      "failed",
                    ].map((v) => (
                      <option key={v} value={v}>
                        {label(v)}
                      </option>
                    ))}
                  </select>
                </label>
              <div className="transactions-filter-actions">
                <Button>
                  <Search size={16} />
                  Search
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const empty = {
                      sessionId: "",
                      counterpart: "",
                      stage: "",
                      from: "",
                      to: "",
                    };
                    setForm(empty);
                    setFilters(empty);
                    setPage(1);
                  }}
                >
                  <RotateCcw size={16} />
                  Reset
                </Button>
              </div></div>
          </form>
          <section className="transactions-results" aria-label="Transaction list">
            <div className="transactions-results-head"><div className="transactions-section-heading"><span className="transactions-section-icon"><Receipt size={23} /></span><div><h2>Transactions</h2><p>Charging sessions and related transaction details.</p></div></div><Button type="button" variant="outline" disabled={!rows.length || list.loading} onClick={exportPage}><Download size={16} />Export page</Button></div>
          {list.loading || list.error ? (
            <State
              loading={list.loading}
              error={list.error}
              retry={list.reload}
            />
          ) : (
            <>
              <Table
                rows={list.data?.data ?? []}
                selected={selected ?? undefined}
                click={(r) => setParams(previous => { previous.set("id", r.id); return previous; })}
                columns={[
                  { key: "rowNumber", title: "#", render: (row: Transaction) => (page - 1) * limit + rows.indexOf(row) + 1 },
                  {
                    key: "lastUpdated",
                    title: "Date & Time (IST)",
                    render: (r) => dateTime(r.lastUpdated),
                  },
                  { key: "sessionId", title: "Session ID" },
                  {
                    key: actor?.partyRole === "CPO" ? "emsp" : "cpo",
                    title: actor?.partyRole === "CPO" ? "eMSP" : "CPO",
                  },
                  { key: "locationId", title: "Location" },
                  { key: "evseUid", title: "EVSE" },
                  {
                    key: "stage",
                    title: "Status",
                    render: (r) => <Badge value={r.stage} />,
                  },
                  {
                    key: "energyKwh",
                    title: "Energy (kWh)",
                    render: (r) => number(r.energyKwh),
                  },
                  {
                    key: "cdrs",
                    title: "Recorded amount",
                    render: (r: Transaction) =>
                      r.cdrs
                        ?.map((c) =>
                          money(c.recordedAmount, c.currency ?? "INR"),
                        )
                        .join(" / ") || "-",
                  },
                ]}
              />
              <footer className="transactions-pagination"><span>{rows.length ? `Showing ${(page - 1) * limit + 1} to ${(page - 1) * limit + rows.length} transactions` : "No transactions"}</span><div><label>Rows per page<select aria-label="Rows per page" value={limit} onChange={event => { setLimit(Number(event.target.value)); setPage(1); }}>{[10, 20, 50].map(value => <option key={value}>{value}</option>)}</select></label><Button variant="outline" size="icon" aria-label="Previous page" disabled={page === 1} onClick={() => setPage(page - 1)}><ChevronLeft size={16} /></Button><span className="transactions-current-page" aria-current="page">{page}</span><Button variant="outline" size="icon" aria-label="Next page" disabled={!list.data?.meta.hasMore} onClick={() => setPage(page + 1)}><ChevronRight size={16} /></Button></div></footer>
            </>
          )}
          </section>
        </div>
        {selected && (
          <Detail title="Transaction details" description="Complete information about this charging transaction." icon={Receipt} wide className="transaction-detail-sheet" close={() => setParams(previous => { previous.delete("id"); previous.delete("tab"); return previous; })}>
            {detail.loading || detail.error ? (
              <State
                loading={detail.loading}
                error={detail.error}
                retry={detail.reload}
              />
            ) : (
              t && <TransactionDetails key={`${selected}-${params.get("tab") ?? "overview"}`} transaction={t} initialTab={params.get("tab") ?? "overview"} />
            )}
          </Detail>
        )}
      </div>
    </div>
  );
}
