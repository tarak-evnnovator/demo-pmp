import { Routes, Route, Navigate } from "react-router-dom";
import { type ReactNode } from "react";
import { useAuth } from "@/auth/AuthProvider";
import { AppShell } from "@/components/layout/app-shell";
import { State } from "@/components/layout/shared";
import { AuthPage } from "@/pages/auth";
import { DashboardPage } from "@/pages/dashboard";
import { PartnersPage } from "@/pages/partners";
import { TransactionsPage } from "@/pages/transactions";
import { OperationsPage } from "@/pages/operations";
import {
  AuditPage,
  ProfilePage,
} from "@/pages/settings";
import { TeamPage } from "@/pages/team";
function Permit({
  permission,
  children,
}: {
  permission: string;
  children: ReactNode;
}) {
  const { can } = useAuth();
  return can(permission) ? (
    children
  ) : (
    <State error="You do not have access to this page." />
  );
}
export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<AuthPage mode="login" />} />
      <Route path="/forgot-password" element={<AuthPage mode="forgot" />} />
      {["/accept-invitation", "/cpo/accept-invitation"].map((path) => (
        <Route key={path} path={path} element={<AuthPage mode="invite" />} />
      ))}
      {["/reset-password", "/cpo/reset-password"].map((path) => (
        <Route key={path} path={path} element={<AuthPage mode="reset" />} />
      ))}
      <Route element={<AppShell />}>
        <Route
          index
          element={
            <Permit permission="dashboard.read">
              <DashboardPage />
            </Permit>
          }
        />
        <Route
          path="partners/connected"
          element={
            <Permit permission="partners.read">
              <PartnersPage />
            </Permit>
          }
        />
        <Route
          path="partners/available"
          element={
            <Permit permission="partners.read">
              <PartnersPage available />
            </Permit>
          }
        />
        <Route
          path="transactions"
          element={
            <Permit permission="transactions.read">
              <TransactionsPage />
            </Permit>
          }
        />
        <Route
          path="logs"
          element={
            <Permit permission="debug.read">
              <OperationsPage />
            </Permit>
          }
        />
        <Route
          path="alerts"
          element={
            <Permit permission="orphans.read">
              <OperationsPage alerts />
            </Permit>
          }
        />
        <Route
          path="team"
          element={
            <Permit permission="team.manage">
              <TeamPage />
            </Permit>
          }
        />
        <Route
          path="audit"
          element={
            <Permit permission="audit.read">
              <AuditPage />
            </Permit>
          }
        />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="security" element={<Navigate to="/profile" replace />} />
        <Route path="settings" element={<Navigate to="/profile" replace />} />
        <Route path="*" element={<State error="Page not found" />} />
      </Route>
    </Routes>
  );
}
