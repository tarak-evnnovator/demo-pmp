import { useState } from "react";
import { Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthProvider";
import { AuthLayout } from "./AuthLayout";

export function LoginPage() {
  const { actor, login } = useAuth(); const navigate = useNavigate();
  const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [show, setShow] = useState(false); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  if (actor) return <Navigate to="/" replace/>;
  async function submit(event: React.FormEvent) { event.preventDefault(); setBusy(true); setError(""); try { await login(email, password); navigate("/"); } catch { setError("Sign in failed. Check your email and password."); } finally { setBusy(false); } }
  async function openDemo(role: "emsp" | "cpo") { setBusy(true); setError(""); try { await login(role === "emsp" ? "xyz.admin@example.com" : "mnq.admin@example.com", "demo"); navigate("/"); } catch { setError("Could not open demo."); } finally { setBusy(false); } }
  return <AuthLayout><section className="auth-card"><div className="auth-title"><h2>Welcome back</h2><p>Sign in to your partner workspace.</p></div>{error && <div className="form-error">{error}</div>}
    <form onSubmit={submit}><label>Email address<div className="input-icon"><Mail/><input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" required autoComplete="email"/></div></label>
      <label>Password<div className="input-icon"><LockKeyhole/><input type={show ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password" required autoComplete="current-password"/><button type="button" onClick={() => setShow(!show)} aria-label="Toggle password">{show ? <EyeOff/> : <Eye/>}</button></div></label>
      <div className="form-row"><span/><Link to="/forgot-password">Forgot password?</Link></div><button className="button primary full" disabled={busy}>{busy ? "Signing in..." : "Sign in"}</button></form><div className="demo-entry"><span>Frontend only. Demo password: demo. No backend connection.</span><div><button className="button secondary" onClick={() => openDemo("emsp")} disabled={busy}>Open eMSP demo</button><button className="button secondary" onClick={() => openDemo("cpo")} disabled={busy}>Open CPO demo</button></div></div></section></AuthLayout>;
}

