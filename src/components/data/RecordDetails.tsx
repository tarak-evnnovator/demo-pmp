import { Copy } from "lucide-react";
import type { DataRow } from "../../api/types";
import { Status } from "../ui";
import { display } from "./DataTable";

function label(key: string) {
  return key.replace(/([A-Z])/g, " $1").replaceAll("_", " ").replace(/^./, char => char.toUpperCase());
}

export function RecordDetails({ rows }: { rows: DataRow[] }) {
  return <div className="record-details">{rows.map((row, index) => <section className="record-section" key={index}>
    {rows.length > 1 && <h2>Event {index + 1}</h2>}
    <dl className="record-list">{Object.entries(row).filter(([key]) => key !== "payload").map(([key, value]) => <div className="record-item" key={key}>
      <dt>{label(key)}</dt><dd>{/status|severity/i.test(key) ? <Status value={value}/> : value && typeof value === "object" ? <pre>{JSON.stringify(value, null, 2)}</pre> : <span>{display(value)}</span>}
      {/correlationId/i.test(key) && Boolean(value) && <button className="icon-button inline-copy" title="Copy correlation ID" aria-label="Copy correlation ID" onClick={() => navigator.clipboard.writeText(String(value))}><Copy/></button>}</dd>
    </div>)}</dl>
    {row.payload !== undefined && <div className="record-payload"><h2>OCPI payload</h2><pre>{JSON.stringify(row.payload, null, 2)}</pre></div>}
  </section>)}</div>;
}
