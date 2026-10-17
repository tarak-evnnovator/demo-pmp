import { NavLink, Outlet, Navigate, useLocation } from "react-router-dom";
import { PageErrorBoundary } from "./error-boundary";
import {
  LayoutDashboard,
  Users,
  Receipt,
  FileText,
  Bell,
  User,
  LogOut,
  Menu,
  ChevronDown,
} from "lucide-react";
import { useAuth } from "@/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { State } from "./shared";
import { toast } from "sonner";
import { useState } from "react";
import { useResource } from "@/hooks/use-resource";
import { api } from "@/api/client";
export function AppShell() {
  const location = useLocation();
  const { actor, loading, can, logout } = useAuth();
  const environments = useResource<{ availableEnvironments: ("stage" | "production")[] }>(actor ? "/portal/v1/auth/environment" : null);
  const [switching, setSwitching] = useState(false);
  async function changeEnvironment(environment: string) {
    setSwitching(true);
    try {
      await api("/portal/v1/auth/environment", { method: "POST", body: JSON.stringify({ environment }) });
      window.location.reload();
    } catch (error) { toast.error((error as Error).message); setSwitching(false); }
  }
  if (loading) return <State loading />;
  if (!actor) return <Navigate to="/login" replace />;
  const counterpart = actor.partyRole === "CPO" ? "eMSPs" : "CPOs";
  const items = [
    {
      section: "",
      to: "/",
      text: "Dashboard",
      icon: LayoutDashboard,
      p: "dashboard.read",
    },
    {
      section: counterpart,
      to: "/partners/connected",
      text: `Connected ${counterpart}`,
      icon: Users,
      p: "partners.read",
    },
    {
      section: "",
      to: "/partners/available",
      text: `Available ${counterpart}`,
      icon: Users,
      p: "partners.read",
    },
    {
      section: "",
      to: "/transactions",
      text: "Transactions",
      icon: Receipt,
      p: "transactions.read",
    },
    {
      section: "Operations",
      to: "/logs",
      text: "Logs",
      icon: FileText,
      p: "debug.read",
    },
    {
      section: "",
      to: "/alerts",
      text: "Alerts",
      icon: Bell,
      p: "orphans.read",
    },
    {
      section: "Administrator",
      to: "/team",
      text: "Team Management",
      icon: Users,
      p: "team.manage",
    },
    {
      section: "",
      to: "/audit",
      text: "Audit Trail",
      icon: FileText,
      p: "audit.read",
    },
    { section: "Support", to: "/profile", text: "Profile", icon: User, p: "" },
  ];
  const nav = (
    <nav>
      {items
        .filter((i) => !i.p || can(i.p))
        .map((i) => (
          <div key={i.to}>
            {i.section && <div className="nav-title">{i.section}</div>}
            <NavLink
              to={i.to}
              end
              className={({ isActive }) =>
                `nav-link ${isActive ? "active" : ""}`
              }
            >
              <i.icon size={20} />
              {i.text}
            </NavLink>
          </div>
        ))}
      <button
        className="nav-link"
        onClick={() => void logout().catch((e) => toast.error(e.message))}
      >
        <LogOut size={20} />
        Logout
      </button>
    </nav>
  );
  const brand = (
    <div className="brand">
      <img src="/icon.png" alt="" />
      <div>
        <strong>ChargeIndia Hub</strong>
        <small>
          {actor.partyRole === "CPO" ? "CPO" : "eMSP"} Partner Portal
        </small>
      </div>
    </div>
  );
  return (
    <div className="shell">
      <aside className="sidebar">
        {brand}
        {nav}
        <div className="identity">
          <strong>{actor.email}</strong>
          <span className="muted">{actor.role.replaceAll("_", " ")}</span>
        </div>
      </aside>
      <main className="main">
        <header className="topbar">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                className="mobile-menu"
                size="icon"
                variant="outline"
                aria-label="Open navigation"
              >
                <Menu size={20} />
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
              <SheetTitle>Partner Portal</SheetTitle>
              {nav}
            </SheetContent>
          </Sheet>
          <strong className="navbar-party">
            {actor.countryCode}-{actor.partyId}
          </strong>
          <div className="navbar-environment" aria-busy={switching}>
          <span className={`navbar-environment-dot ${actor.environment === "production" ? "production" : "stage"}`} aria-hidden="true" />
          <select aria-label="Environment" value={actor.environment ?? "stage"} disabled={switching || environments.loading || Boolean(environments.error)} onChange={event => void changeEnvironment(event.target.value)}>
            <option value="stage" disabled={!environments.data?.availableEnvironments.includes("stage")}>Stage / UAT</option>
            <option value="production" disabled={!environments.data?.availableEnvironments.includes("production")}>Production Environment</option>
          </select>
          <ChevronDown size={16} className="navbar-environment-chevron" aria-hidden="true" />
          </div>
        </header>
        <div className="content">
          <PageErrorBoundary key={location.pathname}><Outlet /></PageErrorBoundary>
        </div>
        <footer className="footer">
          © {new Date().getFullYear()} ChargeIndia. All rights reserved.
        </footer>
      </main>
    </div>
  );
}
