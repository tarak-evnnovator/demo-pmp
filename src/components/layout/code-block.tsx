import { Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function CodeBlock({ title, value, emptyLabel, copyLabel }: { title: string; value: unknown; emptyLabel?: string; copyLabel?: string }) {
  const missing = value === null || value === undefined;
  const text = missing && emptyLabel ? emptyLabel : typeof value === "string" ? value : JSON.stringify(value ?? null, null, 2);
  return <section className="code-section">
    <div className="code-heading"><h3>{title}</h3><Button variant="outline" size={copyLabel ? "sm" : "icon"} disabled={missing && Boolean(emptyLabel)} title={`Copy ${title}`} aria-label={copyLabel ?? `Copy ${title}`} onClick={() => void navigator.clipboard.writeText(text).then(() => toast.success("Copied"), () => toast.error("Could not copy"))}><Copy size={16} />{copyLabel}</Button></div>
    <pre className="code-block"><code>{text}</code></pre>
  </section>;
}
