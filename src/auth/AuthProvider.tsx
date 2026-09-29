import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import type { PartnerActor } from "../api/types";

interface AuthState {
  actor: PartnerActor | null;
  loading: boolean;
  login(email: string, password: string): Promise<void>;
  logout(): Promise<void>;
  refresh(): Promise<void>;
  can(permission: string): boolean;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [actor, setActor] = useState<PartnerActor | null>(null);
  const [loading, setLoading] = useState(true);
  const refresh = useCallback(async () => {
    try { setActor(await api<PartnerActor>("/portal/v1/auth/me")); }
    catch { setActor(null); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void refresh(); }, [refresh]);
  const value = useMemo<AuthState>(() => ({
    actor, loading,
    async login(email, password) {
      await api("/portal/v1/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
      await refresh();
    },
    async logout() { await api("/portal/v1/auth/logout", { method: "POST" }); setActor(null); },
    refresh,
    can: (permission) => actor?.permissions.includes(permission) ?? false,
  }), [actor, loading, refresh]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used within AuthProvider");
  return value;
}

