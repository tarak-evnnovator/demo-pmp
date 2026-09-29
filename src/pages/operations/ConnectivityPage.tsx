import { useEffect, useState } from "react";
import { Cable, Globe2 } from "lucide-react";
import { api } from "../../api/client";
import type { DataRow } from "../../api/types";
import { DataTable } from "../../components/data/DataTable";
import { ErrorState, LoadingState, PageHeader } from "../../components/ui";

interface Connectivity { credential: DataRow | null; endpoints: DataRow[] }
export function ConnectivityPage() {
  const [data, setData] = useState<Connectivity | null>(null); const [error, setError] = useState("");
  useEffect(() => { api<Connectivity>("/partner/v1/connectivity").then(setData).catch(e => setError(e.message)); }, []);
  return <><PageHeader title="Connection Status" description="Negotiated OCPI metadata and discovered endpoints for your eMSP."/>{error ? <section className="panel"><ErrorState message={error}/></section> : !data ? <section className="panel"><LoadingState/></section> : <><div className="metrics compact"><article><div className="metric-icon"><Cable/></div><div><span>OCPI version</span><strong>{String(data.credential?.negotiatedVersion ?? "-")}</strong></div></article><article><div className="metric-icon"><Globe2/></div><div><span>Partner URL</span><strong className="small-value">{String(data.credential?.partnerUrl ?? "Not configured")}</strong></div></article></div><section className="panel table-panel"><h2>Discovered modules</h2><DataTable rows={data.endpoints} columns={[{ key: "identifier", label: "Module" }, { key: "role", label: "Role" }, { key: "version", label: "Version" }, { key: "url", label: "Endpoint URL" }, { key: "lastDiscoveredAt", label: "Last discovered" }]}/></section></>}</>;
}

