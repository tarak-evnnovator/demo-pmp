import { useState } from "react";
import { CheckCircle2, Mail } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api, ApiError } from "../../api/client";
import { AuthLayout } from "./AuthLayout";

function Message({ children }: { children: React.ReactNode }) { return <div className="success-message"><CheckCircle2/>{children}</div>; }

export function ForgotPasswordPage() {
  const [email, setEmail] = useState(""); const [sent, setSent] = useState(false); const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) { e.preventDefault(); setBusy(true); try { await api("/portal/v1/auth/forgot-password", { method: "POST", body: JSON.stringify({ email }) }); setSent(true); } finally { setBusy(false); } }
  return <AuthLayout><section className="auth-card"><div className="auth-title"><h2>Forgot password?</h2><p>This frontend demo does not send email.</p></div>{sent ? <Message>Demo request received. No reset link was sent.</Message> : <form onSubmit={submit}><label>Email address<div className="input-icon"><Mail/><input type="email" value={email} onChange={e => setEmail(e.target.value)} required/></div></label><button className="button primary full" disabled={busy}>Preview request</button></form>}<Link className="back-link" to="/login">Back to sign in</Link></section></AuthLayout>;
}

function TokenPasswordForm({ mode }: { mode: "invitation" | "reset" }) {
  const [params] = useSearchParams(); const token = params.get("token") ?? ""; const navigate = useNavigate();
  const rolePath = window.location.pathname.startsWith("/cpo/") ? "/cpo/v1" : "/partner/v1";
  const [password, setPassword] = useState(""); const [confirm, setConfirm] = useState(""); const [error, setError] = useState(""); const [done, setDone] = useState(false); const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) { e.preventDefault(); if (password !== confirm) return setError("Passwords do not match."); setBusy(true); setError(""); try { const path = `${rolePath}/auth/${mode === "invitation" ? "accept-invitation" : "reset-password"}`; const body = mode === "invitation" ? { token, password } : { token, newPassword: password }; await api(path, { method: "POST", body: JSON.stringify(body) }); setDone(true); } catch (err) { setError(err instanceof ApiError ? err.message : "The link is invalid or expired."); } finally { setBusy(false); } }
  if (!token) return <AuthLayout><section className="auth-card"><div className="form-error">This link does not contain a valid token.</div><Link className="back-link" to="/login">Go to sign in</Link></section></AuthLayout>;
  if (done) return <AuthLayout><section className="auth-card"><Message>{mode === "invitation" ? "Your account is ready." : "Your password has been reset."}</Message><button className="button primary full" onClick={() => navigate("/login")}>Continue to sign in</button></section></AuthLayout>;
  return <AuthLayout><section className="auth-card"><div className="auth-title"><h2>{mode === "invitation" ? "Accept your invitation" : "Reset your password"}</h2><p>Choose a password with at least 12 characters.</p></div>{error && <div className="form-error">{error}</div>}<form onSubmit={submit}><label>New password<input type="password" minLength={12} value={password} onChange={e => setPassword(e.target.value)} required/></label><label>Confirm password<input type="password" minLength={12} value={confirm} onChange={e => setConfirm(e.target.value)} required/></label><button className="button primary full" disabled={busy}>{busy ? "Saving..." : mode === "invitation" ? "Accept invitation" : "Reset password"}</button></form></section></AuthLayout>;
}
export function AcceptInvitationPage() { return <TokenPasswordForm mode="invitation"/>; }
export function ResetPasswordPage() { return <TokenPasswordForm mode="reset"/>; }

