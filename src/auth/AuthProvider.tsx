import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { api } from "@/api/client";
import type { Actor } from "@/api/types";

const AuthContext = createContext<{
  actor: Actor | null;
  loading: boolean;
  refresh: () => Promise<void>;
  login: (email: string, password: string, environment?: "stage" | "production") => Promise<void>;
  logout: () => Promise<void>;
  can: (permission: string) => boolean;
  base: string;
} | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const [actor, setActor] = useState<Actor | null>(null);
  const [loading, setLoading] = useState(true);
  async function refresh() {
    try {
      setActor(await api<Actor>("/portal/v1/auth/me"));
    } catch {
      setActor(null);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void refresh();
    const expired = () => setActor(null);
    window.addEventListener("session-expired", expired);
    return () => window.removeEventListener("session-expired", expired);
  }, []);
  async function login(email: string, password: string, environment: "stage" | "production" = "stage") {
    await api(`/portal/v1/auth/login?environment=${environment}`, {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    await refresh();
  }
  async function logout() {
    await api("/portal/v1/auth/logout", { method: "POST" });
    setActor(null);
  }
  return (
    <AuthContext.Provider
      value={{
        actor,
        loading,
        refresh,
        login,
        logout,
        can: (permission) => Boolean(actor?.permissions.includes(permission)),
        base: actor?.partyRole === "CPO" ? "/cpo/v1" : "/partner/v1",
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("AuthProvider is missing");
  return value;
}
