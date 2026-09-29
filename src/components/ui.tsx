import { LoaderCircle, TriangleAlert, Zap } from "lucide-react";

export function Brand({ subtitle = "Partner Portal" }: { subtitle?: string }) {
  return <div className="brand"><span className="brand-mark"><Zap fill="none"/></span><span className="brand-copy"><span className="brand-name">ChargeIndia</span><span className="brand-subtitle">{subtitle}</span></span></div>;
}

export function PageHeader({ title, description, actions }: { title: string; description: string; actions?: React.ReactNode }) {
  return <div className="page-header"><div><h1>{title}</h1><p>{description}</p></div>{actions && <div className="page-actions">{actions}</div>}</div>;
}

export function LoadingState() {
  return <div className="state"><LoaderCircle className="spin"/><strong>Loading current data</strong></div>;
}

export function EmptyState({ title = "No records found", message = "Try changing the filters or date range." }: { title?: string; message?: string }) {
  return <div className="state"><div className="state-icon">0</div><strong>{title}</strong><span>{message}</span></div>;
}

export function ErrorState({ message, retry }: { message: string; retry?: () => void }) {
  return <div className="state error-state"><TriangleAlert/><strong>Could not load this view</strong><span>{message}</span>{retry && <button className="button secondary" onClick={retry}>Try again</button>}</div>;
}

export function Status({ value }: { value: unknown }) {
  const text = String(value ?? "Unknown");
  const bad = /fail|error|blocked|invalid|disabled|offline/i.test(text);
  const warn = /pending|open|warning|delay|invited/i.test(text);
  return <span className={`status ${bad ? "bad" : warn ? "warn" : "good"}`}><i/>{text.replaceAll("_", " ")}</span>;
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="field"><span>{label}</span>{children}</label>;
}

