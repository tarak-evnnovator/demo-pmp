import { useEffect, useState } from "react";
import { Activity, Building2, MapPin, Radio, ReceiptText, TerminalSquare } from "lucide-react";
import { api } from "../../api/client";
import type { DataRow, PageResult } from "../../api/types";
import { useAuth } from "../../auth/AuthProvider";
import { ErrorState, LoadingState, PageHeader } from "../../components/ui";

interface Dashboard { connectedCpos: number; routedLocations: number; sessions: number; cdrs: number; commands: number }
const metrics = [["connectedCpos", "Connected CPOs", Building2], ["routedLocations", "Routed locations", MapPin], ["sessions", "Sessions", Activity], ["cdrs", "CDRs", ReceiptText], ["commands", "Commands", TerminalSquare]] as const;
export function DashboardPage() {
  const { actor } = useAuth(); const [data, setData] = useState<Dashboard | null>(null); const [cpos, setCpos] = useState<DataRow[]>([]); const [error, setError] = useState("");
  useEffect(() => { Promise.all([api<Dashboard>("/partner/v1/dashboard"), api<PageResult>("/partner/v1/cpos?limit=100")]).then(([summary, routed]) => { setData(summary); setCpos(routed.data); }).catch(e => setError(e.message)); }, []);
  return <><PageHeader title={`Welcome, ${actor?.partyId}`} description="Current operational view of your routed CPO network."/>{!data && !error ? <section className="panel"><LoadingState/></section> : error ? <section className="panel"><ErrorState message={error}/></section> : <><div className="metrics">{metrics.map(([key, label, Icon]) => <article key={key}><div className="metric-icon"><Icon/></div><div><span>{label}</span><strong>{data?.[key] ?? 0}</strong></div></article>)}<article className="metric-context"><Radio/><div><span>Data boundary</span><strong>{actor?.countryCode}-{actor?.partyId}</strong></div></article></div><section className="panel welcome-panel"><div><span className="eyebrow">STRICT ROUTING SCOPE</span><h2>Your workspace only contains enabled CPO relationships.</h2><p>Open any list to inspect current records. Identifiers outside your tenant return a protected not-found response.</p></div><div className="route-visual"><span>{actor?.partyId}</span>{cpos.length ? cpos.map(cpo => <span className="route-node" key={String(cpo.id ?? `${cpo.countryCode}-${cpo.partyId}`)}><i/><span>{String(cpo.partyId)}</span></span>) : <span className="route-empty">No enabled CPO route</span>}</div></section></>}</>;
}
