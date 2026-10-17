import { useEffect, useState } from "react";
import { RotateCcw, Pause, Play, Unlink } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/auth/AuthProvider";
import { useResource } from "@/hooks/use-resource";
import { api } from "@/api/client";
import type { Partner, RoutingRequest } from "@/api/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Detail,
  Facts,
  Badge,
  State,
} from "@/components/layout/shared";
import { ConnectedPartnerDetails } from "@/components/partners/connected-partner-details";
import { PartnerListing } from "@/components/partners/partner-listing";
export function PartnersPage({ available = false }: { available?: boolean }) {
  const { actor, base, can } = useAuth();
  const noun = actor?.partyRole === "CPO" ? "eMSPs" : "CPOs";
  const path = `${base}/${actor?.partyRole === "CPO" ? "emsps" : "cpos"}`;
  const list = useResource<Partner[]>(
    `${path}/${available ? "available" : "connected"}`,
    15000,
  );
  const [selected, setSelected] = useState<Partner | null>(null);
  const detail = useResource<Partner>(
    selected && !available ? `${path}/connected/${selected.id}` : null,
    15000,
  );
  const requestType = available ? "CONNECT" : "REMOVE";
  const history = useResource<RoutingRequest[]>(`${path}/routing-requests?requestType=${requestType}`, 15000);
  const [selectedRequest, setSelectedRequest] = useState<RoutingRequest | null>(null);
  useEffect(() => {
    setSelected(null);
    setSelectedRequest(null);
  }, [available, path]);
  useEffect(() => {
    if (selected && list.data && !list.data.some(partner => partner.id === selected.id)) setSelected(null);
  }, [list.data, selected]);
  const [action, setAction] = useState<{
    partner: Partner;
    type: string;
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const [reason, setReason] = useState("");
  const [remarks, setRemarks] = useState("");
  const needsReason = action?.type === "suspend" || action?.type === "removal-requests";
  async function perform() {
    if (!action) return;
    setBusy(true);
    try {
      const result = await api<{ notificationStatus?: string }>(`${path}/${action.partner.id}/${action.type}`, {
        method: "POST",
        ...(needsReason || action.type === "connection-requests" ? { body: JSON.stringify({ reason: reason.trim(), remarks: remarks.trim() }) } : {}),
      });
      if (result.notificationStatus === "FAILED") toast.warning(action.type.endsWith("requests") ? "Request saved as Pending. Notification failed; retry from Routing requests." : "Routing disabled, but the notification could not be delivered. Contact support.");
      else toast.success(action.type.endsWith("requests") ? "Request submitted for review" : "Routing status updated");
      setAction(null);
      setReason("");
      setRemarks("");
      list.reload();
      detail.reload();
      history.reload();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const p = detail.data;
  const currentRequest = history.data?.find(request => request.id === selectedRequest?.id) ?? selectedRequest;
  async function retryNotification(request: RoutingRequest) {
    setBusy(true);
    try {
      const result = await api<RoutingRequest>(`${path}/routing-requests/${request.id}/notification-retry`, { method: "POST" });
      if (result.notificationStatus === "FAILED") toast.error("Notification failed. The request remains Pending.");
      else toast.success("Notification sent to Hub Operations");
      list.reload(); detail.reload(); history.reload();
    } catch (error) { toast.error((error as Error).message); }
    finally { setBusy(false); }
  }
  return (
    <>
      <div className={`work-area ${selected && !available ? "with-detail" : ""}`}>
        <PartnerListing available={available} noun={noun} list={list} history={history} selectedId={selected?.id} busy={busy}
          onPartner={partner => {
            setSelectedRequest(null);
            if (!available) { setSelected(partner); return; }
            if (partner.routingRequest?.requestType === "CONNECT" && partner.routingRequest.status === "PENDING") { setSelectedRequest(partner.routingRequest); return; }
            if (!can("connection.manage")) { toast.error("You do not have permission to request connections"); return; }
            setReason(""); setRemarks(""); setAction({ partner, type: "connection-requests" });
          }}
          onRequest={request => { setSelected(null); setSelectedRequest(request); }}
          onRetry={request => void retryNotification(request)}
          onRefresh={() => { history.reload(); list.reload(); detail.reload(); }}
        />
        {selected && !available && (
          <Detail wide title={`${noun === "eMSPs" ? "eMSP" : "CPO"} details`} close={() => setSelected(null)}>
            {detail.loading || detail.error ? (
              <State
                loading={detail.loading}
                error={detail.error}
                retry={detail.reload}
              />
            ) : (
              p && (
                <ConnectedPartnerDetails key={p.id} partner={p} actions={<>
                  {can("connection.manage") && (
                    <div className="actions">
                      <Button
                        onClick={() =>
                          setAction({
                            partner: p,
                            type:
                              p.routingStatus === "ACTIVE"
                                ? "suspend"
                                : "reactivate",
                          })
                        }
                      >
                        {p.routingStatus === "ACTIVE" ? (
                          <Pause size={16} />
                        ) : (
                          <Play size={16} />
                        )}{" "}
                        {p.routingStatus === "ACTIVE"
                          ? "Disable routing"
                          : "Make available"}
                      </Button>
                      {p.routingStatus === "SUSPENDED" && (
                        <Button
                          variant="outline"
                          disabled={busy || p.routingRequest?.status === "PENDING"}
                          onClick={() =>
                            setAction({ partner: p, type: "removal-requests" })
                          }
                        >
                          <Unlink size={16} />
                          {p.routingRequest?.status === "PENDING" ? "Pending review" : "Request routing removal"}
                        </Button>
                      )}
                    </div>
                  )}
                </>} />
              )
            )}
          </Detail>
        )}
      </div>
      {currentRequest && <Detail title="Routing request details" close={() => setSelectedRequest(null)}>
        <Badge value={currentRequest.status} />
        <Facts values={{
          "Request ID": currentRequest.id,
          "Request type": currentRequest.requestType === "CONNECT" ? "Connection" : "Removal",
          CPO: currentRequest.cpo ? `${currentRequest.cpo.name} (${currentRequest.cpo.countryCode}-${currentRequest.cpo.partyId})` : "-",
          eMSP: currentRequest.emsp ? `${currentRequest.emsp.name} (${currentRequest.emsp.countryCode}-${currentRequest.emsp.partyId})` : "-",
          Reason: currentRequest.reason || "-", Remarks: currentRequest.remarks || "-",
          Notification: <Badge value={currentRequest.notificationStatus} />,
          "Review comment": currentRequest.reviewComment,
          "Reviewed by": currentRequest.reviewedBy,
          "Reviewed at": currentRequest.reviewedAt ? new Date(currentRequest.reviewedAt).toLocaleString() : "-",
        }} />
        {currentRequest.status === "PENDING" && currentRequest.notificationStatus === "FAILED" && can("connection.manage") && <Button disabled={busy} onClick={() => void retryNotification(currentRequest)}><RotateCcw size={16} />Retry notification</Button>}
      </Detail>}
      <Dialog
        open={Boolean(action)}
        onOpenChange={(open) => {
          if (!open && !busy) { setAction(null); setReason(""); setRemarks(""); }
        }}
      >
        <DialogContent>
          <DialogTitle>Confirm action</DialogTitle>
          <DialogDescription>
            {action?.type === "suspend" ? "Disable routing" : action?.type === "removal-requests" ? "Request routing removal" : action?.type.replaceAll("-", " ")} for {action?.partner.name}?
          </DialogDescription>
          {needsReason && <>
            <label className="field">Reason (required)
              <textarea rows={4} maxLength={2000} value={reason} onChange={(e) => setReason(e.target.value)} />
            </label>
            <label className="field">Last comments / remarks
              <textarea rows={3} maxLength={2000} value={remarks} onChange={(e) => setRemarks(e.target.value)} />
            </label>
          </>}
          {action?.type === "connection-requests" && <>
            <label className="field">Reason (optional)<textarea rows={3} maxLength={2000} value={reason} onChange={event => setReason(event.target.value)} /></label>
            <label className="field">Remarks (optional)<textarea rows={2} maxLength={2000} value={remarks} onChange={event => setRemarks(event.target.value)} /></label>
          </>}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => { setAction(null); setReason(""); setRemarks(""); }}
              disabled={busy}
            >
              Cancel
            </Button>
            <Button disabled={busy || (needsReason && !reason.trim())} onClick={() => void perform()}>
              {busy ? "Please wait…" : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
