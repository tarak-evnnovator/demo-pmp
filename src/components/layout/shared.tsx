import { type ReactNode } from "react";
import { Copy, ChevronLeft, ChevronRight, X, RefreshCw, type LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { label } from "@/lib/format";
export function Badge({ value }: { value?: string | null }) {
  const v = (value ?? "").toLowerCase();
  const tone = /active|completed|success|received|^2\d\d$/.test(v)
    ? "good"
    : /fail|rejected|suspended|invalid|^4\d\d$|^5\d\d$/.test(v)
      ? "bad"
      : /charging|inbound/.test(v)
        ? "blue"
        : /start|pending|open/.test(v)
          ? "warn"
          : "";
  return <span className={`badge ${tone}`}>{label(value)}</span>;
}
export function CopyId({ value }: { value: string }) {
  return (
    <>
      <span>{value}</span>
      <button
        className="copy"
        aria-label="Copy identifier"
        title="Copy identifier"
        onClick={(e) => {
          e.stopPropagation();
          void navigator.clipboard.writeText(value).then(
            () => toast.success("Copied"),
            () => toast.error("Could not copy"),
          );
        }}
      >
        <Copy size={14} />
      </button>
    </>
  );
}
export function State({
  loading,
  error,
  retry,
}: {
  loading?: boolean;
  error?: string | null;
  retry?: () => void;
}) {
  return (
    <div className="state" role="status">
      <h3>
        {loading
          ? "Loading…"
          : error
            ? "Could not load this view"
            : "No records found"}
      </h3>
      {error && <p>{error}</p>}
      {error && retry && (
        <Button variant="outline" onClick={retry}>
          <RefreshCw size={16} />
          Try again
        </Button>
      )}
    </div>
  );
}
export function Header({ title }: { title: string }) {
  return (
    <header className="page-head">
      <h1>{title}</h1>
      <div className="breadcrumb">
        Home <span>›</span> {title}
      </div>
    </header>
  );
}
export function Detail({
  title,
  description = "Complete information",
  wide = false,
  className = "",
  icon: Icon,
  close,
  children,
}: {
  title: string;
  description?: string;
  wide?: boolean;
  className?: string;
  icon?: LucideIcon;
  close: () => void;
  children: ReactNode;
}) {
  return (
    <Sheet open onOpenChange={(open) => { if (!open) close(); }}>
    <SheetContent side="right" showCloseButton={false} className={`partner-detail-sheet${wide ? " partner-connection-sheet" : ""} ${className}`}>
      <header className="detail-head">
        {Icon && <span className="detail-heading-icon"><Icon size={27} /></span>}
        <div>
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </div>
        <Button
          variant="outline"
          size="icon"
          aria-label="Close details"
          onClick={close}
        >
          <X size={18} />
        </Button>
      </header>
      <div className="detail detail-body">{children}</div>
    </SheetContent>
    </Sheet>
  );
}
export function Facts({ values }: { values: Record<string, ReactNode> }) {
  return (
    <div className="facts">
      {Object.entries(values).map(([key, value]) => (
        <div className="fact" key={key}>
          <small>{key}</small>
          <div>{value ?? "-"}</div>
        </div>
      ))}
    </div>
  );
}
export function Table({
  columns,
  rows,
  selected,
  click,
}: {
  columns: { key: string; title: string; render?: (row: any) => ReactNode }[];
  rows: any[];
  selected?: string;
  click?: (row: any) => void;
}) {
  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key}>{c.title}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr
              key={row.id ?? row.membershipId ?? index}
              data-clickable={Boolean(click)}
              className={selected !== undefined && selected === row.id ? "selected" : ""}
              tabIndex={click ? 0 : undefined}
              onClick={() => click?.(row)}
              onKeyDown={(e) => {
                if (e.key === "Enter") click?.(row);
              }}
            >
              {columns.map((c) => (
                <td
                  key={c.key}
                  title={
                    typeof row[c.key] === "string" ? row[c.key] : undefined
                  }
                >
                  {c.render ? c.render(row) : String(row[c.key] ?? "-")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {!rows.length && <State />}
    </div>
  );
}
export function Pager({
  page,
  more,
  setPage,
}: {
  page: number;
  more: boolean;
  setPage: (page: number) => void;
}) {
  return (
    <div className="pager">
      <span>Page {page} · 10 per page</span>
      <div className="actions">
        <Button
          variant="outline"
          size="icon"
          aria-label="Previous page"
          disabled={page === 1}
          onClick={() => setPage(page - 1)}
        >
          <ChevronLeft size={16} />
        </Button>
        <Button
          variant="outline"
          size="icon"
          aria-label="Next page"
          disabled={!more}
          onClick={() => setPage(page + 1)}
        >
          <ChevronRight size={16} />
        </Button>
      </div>
    </div>
  );
}
export function Metric({ title, value, icon: Icon = RefreshCw, tone = "orange" }: { title: string; value: ReactNode; icon?: LucideIcon; tone?: "orange" | "green" | "red" | "blue" }) {
  return (
    <div className="metric">
      <div className={`metric-icon ${tone}`}>
        <Icon size={20} />
      </div>
      <div>
        <small>{title}</small>
        <strong>{value}</strong>
      </div>
    </div>
  );
}
