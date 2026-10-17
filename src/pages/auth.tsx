import { useState } from "react";
import {
  Link,
  useNavigate,
  useSearchParams,
  useLocation,
} from "react-router-dom";
import { LogIn, Mail, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/api/client";
import { useAuth } from "@/auth/AuthProvider";
export function AuthPage({
  mode,
}: {
  mode: "login" | "forgot" | "reset" | "invite";
}) {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const location = useLocation();
  const [email, setEmail] = useState("xyz.admin@example.com");
  const [password, setPassword] = useState("demo");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const token = params.get("token");
  const [environment, setEnvironment] = useState<"stage" | "production">(params.get("environment") === "production" ? "production" : "stage");
  const title = {
    login: "Welcome back",
    forgot: "Forgot password",
    reset: "Reset your password",
    invite: "Accept invitation",
  }[mode];
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if ((mode === "reset" || mode === "invite") && password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    setBusy(true);
    try {
      if (mode === "login") {
        await login(email, password, environment);
        navigate("/", { replace: true });
      } else if (mode === "forgot") {
        await api(`/portal/v1/auth/forgot-password?environment=${environment}`, {
          method: "POST",
          body: JSON.stringify({ email }),
        });
        setDone(true);
      } else {
        const base = location.pathname.startsWith("/cpo/")
          ? "/cpo/v1"
          : "/partner/v1";
        await api(
          `${base}/auth/${mode === "invite" ? "accept-invitation" : "reset-password"}?environment=${encodeURIComponent(params.get("environment") ?? "stage")}`,
          {
            method: "POST",
            body: JSON.stringify(
              mode === "invite"
                ? { token, password }
                : { token, newPassword: password },
            ),
          },
        );
        setDone(true);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="auth-page">
      <form className="auth-form" onSubmit={submit}>
        <div className="brand">
          <img src="/icon.png" alt="" />
          <div>
            <strong>ChargeIndia Hub</strong>
            <small>Partner Portal</small>
          </div>
        </div>
        <h1>{title}</h1>
        {mode === "login" && <div className="actions">
          <Button type="button" variant="outline" onClick={() => { setEmail("xyz.admin@example.com"); setPassword("demo"); }}>eMSP demo</Button>
          <Button type="button" variant="outline" onClick={() => { setEmail("mnq.admin@example.com"); setPassword("demo"); }}>CPO demo</Button>
        </div>}
        {done ? (
          <>
            <p>
              {mode === "forgot"
                ? "If your account exists, a reset link has been sent to your email."
                : "Your account is ready. You can now sign in."}
            </p>
            <Link to="/login">Back to sign in</Link>
          </>
        ) : (
          <>
            {(mode === "login" || mode === "forgot") && <label className="field">Environment<select value={environment} onChange={e => setEnvironment(e.target.value as "stage" | "production")}><option value="stage">Stage / UAT</option><option value="production">Production</option></select></label>}
            {(mode === "login" || mode === "forgot") && (
              <label className="field">
                Email address
                <input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </label>
            )}
            {mode !== "forgot" && (
              <label className="field">
                Password
                <input
                  type="password"
                  autoComplete={
                    mode === "login" ? "current-password" : "new-password"
                  }
                  minLength={mode === "login" ? 1 : 12}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </label>
            )}
            {(mode === "reset" || mode === "invite") && (
              <label className="field">
                Confirm password
                <input
                  type="password"
                  autoComplete="new-password"
                  minLength={12}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                />
              </label>
            )}
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
            {(mode === "invite" || mode === "reset") && !token ? (
              <p className="error">
                This link is missing its token. Open the link from your email.
              </p>
            ) : (
              <div className="actions">
                <Button disabled={busy} type="submit">
                  {mode === "login" ? (
                    <LogIn size={16} />
                  ) : mode === "forgot" ? (
                    <Mail size={16} />
                  ) : (
                    <KeyRound size={16} />
                  )}{" "}
                  {busy
                    ? "Please wait…"
                    : mode === "login"
                      ? "Sign in"
                      : mode === "forgot"
                        ? "Send reset link"
                        : title}
                </Button>
              </div>
            )}
            <div className="actions">
              <Link to={mode === "login" ? "/forgot-password" : "/login"}>
                {mode === "login" ? "Forgot password?" : "Back to sign in"}
              </Link>
            </div>
          </>
        )}
      </form>
    </div>
  );
}
