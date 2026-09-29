import { useCallback, useEffect, useState } from "react";
import { Eye } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { api, qs } from "../../api/client";
import type { DataRow } from "../../api/types";
import { DataTable, Pagination } from "../../components/data/DataTable";
import { RecordDetails } from "../../components/data/RecordDetails";
import { ErrorState, Field, LoadingState, PageHeader } from "../../components/ui";

interface AlertResult { data: { sessionOrphans: DataRow[]; cdrHygiene: DataRow[] }; meta: { page: number; limit: number; hasMore: boolean } }
const action = (type: string) => (row: DataRow) => <Link className="icon-button" to={`/alerts/${type}/${String(row.id)}`}><Eye/></Link>;
export function AlertsPage() {
  const [result, setResult] = useState<AlertResult | null>(null); const [status, setStatus] = useState(""); const [page, setPage] = useState(1); const [error, setError] = useState("");
  const load = useCallback(() => { setError(""); api<AlertResult>(`/partner/v1/alerts${qs({ page, limit: 20, status: status || undefined })}`).then(setResult).catch(e => setError(e.message)); }, [page, status]);
  useEffect(load, [load]);
  return <><PageHeader title="Alerts" description="Session orphan and CDR hygiene evidence related to your tenant."/><section className="panel filters"><Field label="Status"><input placeholder="e.g. open" value={status} onChange={e => { setPage(1); setStatus(e.target.value); }}/></Field></section>{error ? <section className="panel"><ErrorState message={error} retry={load}/></section> : !result ? <section className="panel"><LoadingState/></section> : <><section className="panel table-panel"><h2>Session orphans</h2><DataTable rows={result.data.sessionOrphans} columns={[{ key: "sessionId", label: "Session ID" }, { key: "reason", label: "Reason" }, { key: "severity", label: "Severity" }, { key: "status", label: "Status" }, { key: "firstDetectedAt", label: "Detected" }, { key: "action", label: "Action", render: action("session") }]}/></section><section className="panel table-panel"><h2>CDR hygiene</h2><DataTable rows={result.data.cdrHygiene} columns={[{ key: "reason", label: "Reason" }, { key: "severity", label: "Severity" }, { key: "status", label: "Status" }, { key: "createdAt", label: "Detected" }, { key: "action", label: "Action", render: action("cdr") }]}/><Pagination page={page} hasMore={result.meta.hasMore} onPage={setPage}/></section></>}</>;
}

export function AlertDetailPage() {
  const { type = "", id = "" } = useParams();
  const [data, setData] = useState<DataRow | null>(null); const [error, setError] = useState("");
  useEffect(() => { api<DataRow>(`/partner/v1/alerts/${type}/${id}`).then(setData).catch(e => setError(e.message)); }, [type, id]);
  return <><PageHeader title="Alert detail" description="Safe operational evidence for this alert." actions={<Link className="button secondary" to="/alerts">Back to alerts</Link>}/>{error ? <ErrorState message={error}/> : !data ? <LoadingState/> : <RecordDetails rows={[data]}/>}</>;
}
