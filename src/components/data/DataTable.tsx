import { ChevronLeft, ChevronRight, Eye } from "lucide-react";
import { Link } from "react-router-dom";
import type { DataRow } from "../../api/types";
import { EmptyState, Status } from "../ui";

export interface Column { key: string; label: string; render?: (row: DataRow) => React.ReactNode }

function valueAt(row: DataRow, key: string): unknown {
  return key.split(".").reduce<unknown>((value, part) => value && typeof value === "object" ? (value as DataRow)[part] : undefined, row);
}

export function display(value: unknown): string {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "object") return JSON.stringify(value);
  if (/^\d{4}-\d{2}-\d{2}T/.test(String(value))) return new Date(String(value)).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
  return String(value).replaceAll("_", " ");
}

export function DataTable({ rows, columns, detailBase, detailKey = "id" }: { rows: DataRow[]; columns: Column[]; detailBase?: string; detailKey?: string | ((row: DataRow) => unknown) }) {
  if (!rows.length) return <EmptyState/>;
  return <div className="table-scroll"><table><thead><tr>{columns.map((column) => <th key={column.key}>{column.label}</th>)}{detailBase && <th>Action</th>}</tr></thead>
    <tbody>{rows.map((row, index) => <tr key={String(row.id ?? index)}>{columns.map((column) => {
      const value = valueAt(row, column.key);
      return <td key={column.key}>{column.render ? column.render(row) : /status|severity/i.test(column.key) ? <Status value={value}/> : display(value)}</td>;
    })}{detailBase && (() => { const value = typeof detailKey === "function" ? detailKey(row) : valueAt(row, detailKey); return <td>{value === null || value === undefined || value === "" ? <span aria-label="Details unavailable">-</span> : <Link className="icon-button" to={`${detailBase}/${encodeURIComponent(String(value))}`} aria-label="View details"><Eye/></Link>}</td>; })()}</tr>)}</tbody></table></div>;
}

export function Pagination({ page, hasMore, onPage }: { page: number; hasMore: boolean; onPage(page: number): void }) {
  return <div className="pagination"><span>Page {page}</span><button className="icon-button" disabled={page === 1} onClick={() => onPage(page - 1)} aria-label="Previous page"><ChevronLeft/></button><button className="icon-button" disabled={!hasMore} onClick={() => onPage(page + 1)} aria-label="Next page"><ChevronRight/></button></div>;
}
