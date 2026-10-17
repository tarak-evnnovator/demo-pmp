import { Copy, X } from "lucide-react";
import { toast } from "sonner";
import type { Log } from "@/api/types";
import { Facts, Badge, CopyId } from "@/components/layout/shared";
import { CodeBlock } from "@/components/layout/code-block";
import { Button } from "@/components/ui/button";

function timeIst(value: string) {
  if (Number.isNaN(Date.parse(value))) return "Not captured";
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata", day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true,
  }).format(new Date(value));
}

export function LogDetails({ log, close }: { log: Log; close: () => void }) {
  const direction = log.direction.toLowerCase();
  const directionLabel = ["in", "inbound"].includes(direction) ? "Inbound" : ["out", "outbound"].includes(direction) ? "Outbound" : log.direction;
  return <>
    <Facts values={{
      Direction: directionLabel,
      Party: log.party ?? (log.countryCode && log.partyId ? `${log.countryCode}-${log.partyId}` : log.partyId ?? "Not captured"),
      Module: log.module ?? "Not captured",
      Method: log.method,
      URL: log.requestUrl ? <a className="log-url" href={log.requestUrl} target="_blank" rel="noopener noreferrer">{log.requestUrl}</a> : "Not captured",
      ...(!log.requestUrl ? { "Recorded path": log.path } : {}),
      Status: log.statusCode !== null ? <Badge value={String(log.statusCode)} /> : "Not captured",
      Duration: log.durationMs !== null ? `${log.durationMs} ms` : "Not captured",
      "Request ID": log.requestId ? <CopyId value={log.requestId} /> : "Not captured",
      "Correlation ID": log.correlationId ? <CopyId value={log.correlationId} /> : "Not captured",
      "Time (IST)": timeIst(log.createdAt),
      Authorization: log.authorization ? <code>{log.authorization}</code> : "Not captured",
      ...(log.errorMessage ? { "Recorded error": log.errorMessage } : {}),
    }} />
    <CodeBlock title="Request headers" value={log.requestHeaders} emptyLabel="Not captured" />
    <CodeBlock title="Response headers" value={log.responseHeaders} emptyLabel="Not captured" />
    <CodeBlock title="Request object" value={log.requestBody} emptyLabel="Not captured" />
    <CodeBlock title="Response object" value={log.responseBody} emptyLabel="Not captured" />
    <CodeBlock title="Request cURL" value={log.requestCurl} emptyLabel="Not captured" />
    <div className="actions log-detail-actions">
      <Button disabled={!log.requestCurl} onClick={() => void navigator.clipboard.writeText(log.requestCurl!).then(() => toast.success("cURL copied"), () => toast.error("Could not copy cURL"))}><Copy size={16} />Copy as cURL</Button>
      <Button variant="outline" onClick={close}><X size={16} />Close</Button>
    </div>
  </>;
}
