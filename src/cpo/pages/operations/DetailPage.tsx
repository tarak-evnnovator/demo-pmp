import { useCallback, useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { api } from "../../api/client";
import type { DataRow } from "../../api/types";
import { RecordDetails } from "../../../components/data/RecordDetails";
import { ErrorState, LoadingState, PageHeader } from "../../components/ui";

const endpoints: Record<string, string> = { emsps: "/cpo/v1/emsps", locations: "/cpo/v1/locations", tariffs: "/cpo/v1/tariffs", authorizations: "/cpo/v1/authorizations", sessions: "/cpo/v1/sessions", cdrs: "/cpo/v1/cdrs", commands: "/cpo/v1/commands", deliveries: "/cpo/v1/deliveries", processes: "/cpo/v1/processes", "debug-logs": "/cpo/v1/debug-logs" };

export function DetailPage({ kind }: { kind: string }) {
  const params = useParams(); const id = params.id ?? params.correlationId ?? ""; const [data, setData] = useState<DataRow | DataRow[] | null>(null); const [error, setError] = useState(""); const [loading, setLoading] = useState(true);
  const load = useCallback(async () => { if (!id || !endpoints[kind]) { setError("Resource not found"); setLoading(false); return; } setLoading(true); setError(""); try { setData(await api(`${endpoints[kind]}/${encodeURIComponent(id)}`)); } catch (e) { setError(e instanceof Error ? e.message : "Request failed"); } finally { setLoading(false); } }, [id, kind]);
  useEffect(() => { void load(); }, [load]);
  const rows = Array.isArray(data) ? data : data ? [data] : [];
  const title = ({ cdrs: "CDR", processes: "Process", "debug-logs": "API log", deliveries: "Delivery", authorizations: "Authorization" } as Record<string, string>)[kind] ?? kind.slice(0, -1);
  return <><PageHeader title={`${title} detail`} description="Tenant-scoped operational evidence from ChargeIndia Hub." actions={<Link className="button secondary" to={`/${kind}`}><ArrowLeft/>Back</Link>}/>{loading ? <LoadingState/> : error ? <ErrorState message={error} retry={load}/> : <RecordDetails rows={rows}/>}</>;
}
