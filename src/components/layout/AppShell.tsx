import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import {
  Activity, BellRing, Cable, FileClock, Gauge, LogOut, MapPin, Menu,
  Network, ReceiptText, Settings, Tags, TerminalSquare, Users, X, Building2,
  ListTree,
} from "lucide-react";
import { useAuth } from "../../auth/AuthProvider";
import { Brand } from "../ui";

type NavItem = readonly [string, string, LucideIcon, string];

const commonOperations = [
  ["/", "Dashboard", Gauge, "dashboard.read"],
  ["/locations", "Locations", MapPin, "locations.read"],
  ["/sessions", "Sessions", Activity, "sessions.read"],
  ["/cdrs", "CDRs", ReceiptText, "cdrs.read"],
  ["/tariffs", "Tariffs", Tags, "locations.read"],
  ["/commands", "Commands", TerminalSquare, "commands.read"],
  ["/deliveries", "Deliveries", Network, "process.read"],
] as const;

const telemetry = [
  ["/processes", "Process Monitor", ListTree, "process.read"],
  ["/alerts", "Alerts", BellRing, "orphans.read"],
  ["/connectivity", "Connection Status", Cable, "connection.read"],
  ["/debug-logs", "API Logs", FileClock, "debug.read"],
] as const;

const governance = [
  ["/team", "Team Management", Users, "team.manage"],
  ["/audit", "Audit Trail", FileClock, "audit.read"],
  ["/settings/security", "Security", Settings, "security.read"],
] as const;

export function AppShell() {
  const [open, setOpen] = useState(false);
  const { actor, can, logout } = useAuth();
  const navigate = useNavigate();
  const cpo = actor?.partyRole === "CPO";
  const operations = [commonOperations[0], [cpo ? "/emsps" : "/cpos", cpo ? "Connected eMSPs" : "Connected CPOs", Building2, "partners.read"] as const, ...commonOperations.slice(1), ...(cpo ? [["/authorizations", "Authorizations", FileClock, "authorizations.read"] as const] : [])];

  async function signOut() {
    await logout();
    navigate("/login");
  }

  function group(title: string, links: readonly NavItem[]) {
    const visible = links.filter(([, , , permission]) => permission === "security.read" || can(permission));
    if (!visible.length) return null;
    return <div className="nav-group" key={title}><p className="nav-heading">{title}</p>{visible.map(([to, label, Icon]) =>
      <NavLink key={to} to={to} end={to === "/"} onClick={() => setOpen(false)}><Icon/><span>{label}</span></NavLink>
    )}</div>;
  }

  return <div className="app-shell">
    <aside className={open ? "sidebar open" : "sidebar"}>
      <div className="sidebar-brand"><Brand subtitle={cpo ? "CPO Partner Portal" : "eMSP Partner Portal"}/><button className="icon mobile-only" onClick={() => setOpen(false)} aria-label="Close menu"><X/></button></div>
      <nav aria-label="Partner navigation">{group("Operations", operations)}{group("System & Telemetry", telemetry)}{group("Governance", governance)}</nav>
      <div className="sidebar-bottom"><button onClick={signOut}><LogOut/><span>Sign out</span></button></div>
    </aside>
    {open && <button className="backdrop" onClick={() => setOpen(false)} aria-label="Close navigation"/>}
    <section className="workspace">
      <header className="topbar">
        <button className="icon mobile-only" onClick={() => setOpen(true)} aria-label="Open menu"><Menu/></button>
        <div className="tenant"><strong>{actor?.partyId}</strong><span>{actor?.countryCode}-{actor?.partyId}</span></div>
        <div className="environment">Demo data</div>
        <div className="top-spacer"/>
        <div className="profile"><div className="avatar">{actor?.partyId.slice(0, 2).toUpperCase()}</div><div><strong>{actor?.email}</strong><span>{actor?.role.replaceAll("_", " ")}</span></div></div>
      </header>
      <main><Outlet/></main>
      <footer><span>{"\u00a9"} {new Date().getFullYear()} ChargeIndia. All rights reserved.</span><span>Privacy Policy&nbsp;&nbsp; | &nbsp;&nbsp;Terms of Service</span></footer>
    </section>
  </div>;
}
