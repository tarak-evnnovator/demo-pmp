import { useEffect, useState } from "react";
import { Activity, Building2, MapPin, Radio, ReceiptText, TerminalSquare } from "lucide-react";
import { api } from "../../api/client";
import type { DataRow, PageResult } from "../../api/types";
import { useAuth } from "../../auth/AuthProvider";
import { ErrorState, LoadingState, PageHeader } from "../../components/ui";

interface Dashboard { connectedEmsps: number; locations: number; sessions: number; cdrs: number; commands: number }
const metrics = [["connectedEmsps", "Connected eMSPs", Building2], ["locations", "Published locations", MapPin], ["sessions", "Sessions", Activity], ["cdrs", "CDRs", ReceiptText], ["commands", "Commands", TerminalSquare]] as const;
export function DashboardPage() {
  const { actor, can } = useAuth(); const [data, setData] = useState<Dashboard | null>(null); const [emsps, setEmsps] = useState<DataRow[]>([]); const [error, setError] = useState("");
  const mayReadPartners = can("partners.read");
  useEffect(() => { Promise.all([api<Dashboard>("/cpo/v1/dashboard"), mayReadPartners ? api<PageResult>("/cpo/v1/emsps?limit=100") : Promise.resolve({ data: [] })]).then(([summary, routed]) => { setData(summary); setEmsps(routed.data); }).catch(e => setError(e.message)); }, [mayReadPartners]);
  return <><PageHeader title={`Welcome, ${actor?.partyId}`} description="Current operational view of your CPO network and routed eMSPs."/>{!data && !error ? <section className="panel"><LoadingState/></section> : error ? <section className="panel"><ErrorState message={error}/></section> : <><div className="metrics">{metrics.map(([key, label, Icon]) => <article key={key}><div className="metric-icon"><Icon/></div><div><span>{label}</span><strong>{data?.[key] ?? 0}</strong></div></article>)}<article className="metric-context"><Radio/><div><span>Data boundary</span><strong>{actor?.countryCode}-{actor?.partyId}</strong></div></article></div><section className="panel welcome-panel"><div><span className="eyebrow">STRICT ROUTING SCOPE</span><h2>Only enabled eMSP relationships are visible.</h2><p>Your locations remain CPO-owned; transactional views additionally require an enabled route to the related eMSP.</p></div><div className="route-visual"><span>{actor?.partyId}</span>{emsps.length ? emsps.map(emsp => <span className="route-node" key={String(emsp.id ?? `${emsp.countryCode}-${emsp.partyId}`)}><i/><span>{String(emsp.partyId)}</span></span>) : <span className="route-empty">No enabled eMSP route</span>}</div></section></>}</>;
}
