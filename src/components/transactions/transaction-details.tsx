import type { ReactNode } from "react";
import { CalendarDays, Clock3, Coins, FileText, Play, Square, Zap, X, type LucideIcon } from "lucide-react";
import type { Cdr, Transaction } from "@/api/types";
import { Badge, CopyId, State } from "@/components/layout/shared";
import { CodeBlock } from "@/components/layout/code-block";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { dateTime, label, money, number } from "@/lib/format";

function object(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}
function numeric(value: unknown) { return typeof value === "number" && Number.isFinite(value) ? value : null; }
function timestamp(value: unknown) { return typeof value === "string" && Number.isFinite(Date.parse(value)) ? dateTime(value) : "-"; }
function SectionHeading({ title, subtitle, icon: Icon }: { title: string; subtitle: string; icon: LucideIcon }) {
  return <header className="transaction-section-heading"><span><Icon size={23} /></span><div><h3>{title}</h3><p>{subtitle}</p></div></header>;
}
function Information({ values }: { values: [string, ReactNode][] }) {
  return <dl className="transaction-information">{values.map(([title, value]) => <div key={title}><dt>{title}</dt><dd>{value ?? "-"}</dd></div>)}</dl>;
}
function CdrInformation({ cdr, transaction }: { cdr: Cdr; transaction: Transaction }) {
  const payload = object(cdr.payload);
  const currency = cdr.currency ?? (typeof payload.currency === "string" ? payload.currency : null);
  const amount = (value: unknown) => numeric(value) == null ? "-" : currency ? money(numeric(value), currency) : number(numeric(value));
  const components = [
    ["Energy cost", "total_energy_cost"], ["Time cost", "total_time_cost"],
    ["Parking cost", "total_parking_cost"], ["Fixed cost", "total_fixed_cost"],
    ["Reservation cost", "total_reservation_cost"], ["Total amount", "total_cost"],
  ].flatMap(([title, key]) => {
    const cost = object(payload[key]);
    return numeric(cost.excl_vat) != null || numeric(cost.incl_vat) != null ? [{ title, key, cost }] : [];
  });
  const periods = Array.isArray(payload.charging_periods) ? payload.charging_periods.map(object) : [];
  return <article className="transaction-cdr-record">
    <section className="transaction-detail-section">
      <SectionHeading title="CDR information" subtitle="Details of the charging record received from CPO." icon={FileText} />
      <Information values={[
        ["CDR ID", <CopyId value={cdr.cdrId} />], ["Linked Session ID", <CopyId value={transaction.sessionId} />],
        ["Received (IST)", dateTime(cdr.receivedAt)], ["Forwarded (IST)", dateTime(cdr.forwardedAt)],
        ["Currency", currency], ["Recorded amount", cdr.recordedAmount == null ? "-" : currency ? money(cdr.recordedAmount, currency) : number(cdr.recordedAmount)],
      ]} />
    </section>
    <section className="transaction-detail-section">
      <SectionHeading title="Cost breakdown" subtitle="Cost components recorded in the CDR." icon={Coins} />
      {components.length ? <div className="table-wrap"><table className="transaction-detail-table"><thead><tr><th>Description</th><th>Excl. VAT{currency ? ` (${currency})` : ""}</th><th>Incl. VAT{currency ? ` (${currency})` : ""}</th></tr></thead><tbody>{components.map(({ title, key, cost }) => <tr key={key} className={key === "total_cost" ? "transaction-total" : ""}><td>{title}</td><td>{amount(cost.excl_vat)}</td><td>{amount(cost.incl_vat)}</td></tr>)}</tbody></table></div> : <p className="transaction-empty">No cost breakdown was included in this CDR.</p>}
    </section>
    {/* <section className="transaction-detail-section">
      <SectionHeading title="Charging periods" subtitle="Charging period details from the CDR." icon={Clock3} />
      {periods.length ? <div className="table-wrap"><table className="transaction-detail-table"><thead><tr><th>#</th><th>Start time (IST)</th><th>End time (IST)</th><th>Energy (kWh)</th><th>Tariff</th><th>Amount{currency ? ` (${currency})` : ""}</th></tr></thead><tbody>{periods.map((period, index) => {
        const dimensions = Array.isArray(period.dimensions) ? period.dimensions.map(object) : [];
        const energy = numeric(dimensions.find(dimension => dimension.type === "ENERGY")?.volume);
        return <tr key={index}><td>{index + 1}</td><td>{timestamp(period.start_date_time)}</td><td>{timestamp(period.end_date_time ?? periods[index + 1]?.start_date_time ?? payload.end_date_time)}</td><td>{energy == null ? "-" : number(energy)}</td><td>{typeof period.tariff_id === "string" ? period.tariff_id : "-"}</td><td>{amount(object(period.total_cost).incl_vat)}</td></tr>;
      })}</tbody></table></div> : <p className="transaction-empty">No charging periods were included in this CDR.</p>}
    </section> */}
    <div className="transaction-raw-cdr"><CodeBlock title="Full CDR object" value={cdr.payload} copyLabel="Copy JSON" emptyLabel="The raw CDR object is not available." /></div>
  </article>;
}

export function TransactionDetails({ transaction: t, initialTab = "overview" }: { transaction: Transaction; initialTab?: string }) {
  const recorded = t.cdrs?.map(cdr => cdr.recordedAmount == null ? null : cdr.currency ? money(cdr.recordedAmount, cdr.currency) : number(cdr.recordedAmount)).filter(Boolean).join(" / ");
  return <div className="transaction-detail-content">
    <div className="transaction-detail-summary"><div><h2><CopyId value={t.sessionId} /></h2><Badge value={t.stage} /></div><div className="transaction-updated"><small>Last updated (IST)</small><span><CalendarDays size={17} />{dateTime(t.lastUpdated)}</span></div></div>
    <Tabs defaultValue={initialTab === "cdr" ? "cdr" : "overview"}>
      <TabsList className="transaction-detail-tabs"><TabsTrigger value="overview"><FileText size={18} />Overview</TabsTrigger><TabsTrigger value="timeline"><Clock3 size={18} />Timeline</TabsTrigger><TabsTrigger value="cdr"><FileText size={18} />CDR details</TabsTrigger></TabsList>
      <TabsContent value="overview"><section className="transaction-detail-section"><SectionHeading title="Session information" subtitle="Basic details of the charging session." icon={FileText} /><Information values={[
        ["Session ID", <CopyId value={t.sessionId} />], ["CPO", t.cpo], ["eMSP", t.emsp], ["Location ID", t.locationId],
        ["EVSE ID", t.evseUid], ["Status", <Badge value={t.sessionStatus} />], ["Energy (kWh)", t.energyKwh == null ? "-" : number(t.energyKwh)], ["Recorded amount", recorded || "-"], ["Last updated (IST)", dateTime(t.lastUpdated)],
      ]} /></section></TabsContent>
      <TabsContent value="timeline"><section className="transaction-detail-section"><SectionHeading title="Charging lifecycle" subtitle="Sequence of events for this transaction." icon={Clock3} />{t.steps?.length ? <ol className="transaction-lifecycle">{t.steps.map((step, index) => {
        const type = step.type.toLowerCase();
        const Icon = type.includes("fail") ? X : type.includes("cdr") ? FileText : type.includes("stop") || type.includes("complete") ? Square : type.includes("charg") ? Zap : Play;
        const tone = type.includes("fail") ? "red" : type.includes("cdr") ? "blue" : type.includes("stop") || type.includes("complete") ? "orange" : "green";
        return <li key={index}><span className={`transaction-event-icon ${tone}`}><Icon size={21} /></span><div><strong>{label(step.type)}</strong><small>{dateTime(step.at)}</small>{step.status && <Badge value={step.status} />}</div></li>;
      })}</ol> : <State />}</section></TabsContent>
      <TabsContent value="cdr">{t.cdrs?.length ? t.cdrs.map(cdr => <CdrInformation key={cdr.id} cdr={cdr} transaction={t} />) : <div className="transaction-detail-section"><p className="transaction-empty">No CDR has been received for this transaction.</p></div>}</TabsContent>
    </Tabs>
  </div>;
}
