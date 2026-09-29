import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useAuth } from "./auth/AuthProvider";
import { AppShell } from "./components/layout/AppShell";
import { AcceptInvitationPage, ForgotPasswordPage, ResetPasswordPage } from "./pages/auth/PasswordFlows";
import { LoginPage } from "./pages/auth/LoginPage";
import { AlertDetailPage, AlertsPage } from "./pages/operations/AlertsPage";
import { ConnectivityPage } from "./pages/operations/ConnectivityPage";
import { DashboardPage } from "./pages/operations/DashboardPage";
import { DetailPage } from "./pages/operations/DetailPage";
import { ResourcePage, resourceConfigs } from "./pages/operations/ResourcePage";
import { AuditPage, SecurityPage } from "./pages/operations/SettingsPages";
import { TeamPage } from "./pages/operations/TeamPage";
import CpoApp from "./cpo/App";

function Protected() {
  const { actor, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="boot-loader">Loading Partner Portal...</div>;
  if (!actor) return <Navigate to="/login" replace state={{ from: location.pathname }}/>;
  return <AppShell/>;
}

function Permission({ name, children }: { name: string; children: React.ReactNode }) {
  const { can } = useAuth();
  return can(name) ? <>{children}</> : <Navigate to="/" replace/>;
}

const permissions: Record<string, string> = {
  cpos: "partners.read", locations: "locations.read", tariffs: "locations.read",
  sessions: "sessions.read", cdrs: "cdrs.read", commands: "commands.read",
  deliveries: "process.read", processes: "process.read", "debug-logs": "debug.read",
};

function ResourceRoute({ kind }: { kind: string }) {
  return <Permission name={permissions[kind]}><ResourcePage config={resourceConfigs[kind]}/></Permission>;
}
function DetailRoute({ kind }: { kind: string }) {
  return <Permission name={permissions[kind]}><DetailPage kind={kind}/></Permission>;
}

function EmspApp() {
  return <Routes>
    <Route path="/login" element={<LoginPage/>}/>
    <Route path="/forgot-password" element={<ForgotPasswordPage/>}/>
    <Route path="/reset-password" element={<ResetPasswordPage/>}/>
    <Route path="/accept-invitation" element={<AcceptInvitationPage/>}/>
    <Route path="/cpo/accept-invitation" element={<AcceptInvitationPage/>}/>
    <Route path="/cpo/reset-password" element={<ResetPasswordPage/>}/>
    <Route element={<Protected/>}>
      <Route index element={<DashboardPage/>}/>
      {Object.keys(resourceConfigs).map(kind => <Route key={kind} path={`/${kind}`} element={<ResourceRoute kind={kind}/>}/>) }
      {["cpos", "locations", "tariffs", "sessions", "cdrs", "commands", "deliveries", "debug-logs"].map(kind => <Route key={`${kind}-detail`} path={`/${kind}/:id`} element={<DetailRoute kind={kind}/>}/>) }
      <Route path="/processes/:correlationId" element={<DetailRoute kind="processes"/>}/>
      <Route path="/alerts" element={<Permission name="orphans.read"><AlertsPage/></Permission>}/>
      <Route path="/alerts/:type/:id" element={<Permission name="orphans.read"><AlertDetailPage/></Permission>}/>
      <Route path="/connectivity" element={<Permission name="connection.read"><ConnectivityPage/></Permission>}/>
      <Route path="/team" element={<Permission name="team.manage"><TeamPage/></Permission>}/>
      <Route path="/audit" element={<Permission name="audit.read"><AuditPage/></Permission>}/>
      <Route path="/settings/security" element={<SecurityPage/>}/>
      <Route path="*" element={<Navigate to="/" replace/>}/>
    </Route>
  </Routes>;
}

export default function App() {
  const { actor } = useAuth();
  const { pathname } = useLocation();
  const publicPage = ["/login", "/forgot-password", "/reset-password", "/accept-invitation", "/cpo/reset-password", "/cpo/accept-invitation"].includes(pathname);
  return !publicPage && actor?.partyRole === "CPO" ? <CpoApp/> : <EmspApp/>;
}
