import { FlaskConical, ShieldCheck } from "lucide-react";
import { Brand } from "../../components/ui";

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return <div className="auth-page"><header><Brand subtitle="Partner Portal"/><div className="auth-env"><FlaskConical/>Frontend demo</div></header>
    <div className="auth-main"><section className="auth-aside"><div><span className="eyebrow">CHARGEINDIA NETWORK</span><h1>Roaming operations,<br/>in one clear view.</h1><p>Explore sample partner records, sessions, CDRs and process evidence.</p></div><div className="trust"><ShieldCheck/><span><strong>Frontend sample data</strong><small>No backend, database, or email service is connected.</small></span></div></section>{children}</div>
    <footer><span>© {new Date().getFullYear()} ChargeIndia</span><span>Privacy Policy&nbsp;&nbsp; | &nbsp;&nbsp;Terms of Service</span></footer></div>;
}

