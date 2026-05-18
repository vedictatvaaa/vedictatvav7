import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle, XCircle, Phone, Mail, MessageCircle, Type, FileText, Send } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

import { Label } from "@/components/ui/label";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";

import { useToast } from "@/hooks/use-toast";
import type { Pandit, PanditApplication } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

import { createFetcher } from "../admin-shared";

// ============================================================
const APP_STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-100 text-red-800",
};

const APP_FILTERS: { id: "pending" | "approved" | "rejected" | "all"; label: string }[] = [
  { id: "pending", label: "Pending" },
  { id: "approved", label: "Approved" },
  { id: "rejected", label: "Rejected" },
  { id: "all", label: "All" },
];

function toIndianWhatsAppNumber(raw?: string | null): string | null {
  if (!raw) return null;
  let digits = raw.replace(/\D+/g, "");
  if (!digits) return null;
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.length === 10) digits = "91" + digits;
  else if (digits.length === 11 && digits.startsWith("0")) digits = "91" + digits.slice(1);
  else if (digits.length === 12 && digits.startsWith("91")) {
    // already E.164 without +
  } else if (digits.length === 13 && digits.startsWith("091")) {
    digits = digits.slice(1);
  }
  if (digits.length < 11 || digits.length > 15) return null;
  return digits;
}

function buildApprovalWhatsAppMessage(name: string, city: string, note: string): string {
  const greeting = name ? `Namaste ${name} ji,` : "Namaste,";
  const noteLine = note.trim() ? `\n\nNote from our team: ${note.trim()}` : "";
  return `${greeting}

Aapki Vedic Tatva pandit application *approve* ho gayi hai. Aapka profile ab humari pandit directory${city ? ` (${city})` : ""} mein live hai aur devotees aapko booking ke liye contact kar sakte hain.

Agle steps:
• Apna phone reachable rakhein — booking requests forward karenge
• Photo, bio ya fees update karni ho to humein reply karein
• Listing dekhein: https://vedictatva.com/pandit-directory${noteLine}

Vedic Tatva parivaar mein aapka swagat hai.

— Vedic Tatva Team`;
}

function buildRejectionWhatsAppMessage(name: string, note: string): string {
  const greeting = name ? `Namaste ${name} ji,` : "Namaste,";
  const reasonLine = note.trim()
    ? `\n\nReview team se feedback:\n${note.trim()}`
    : "";
  return `${greeting}

Vedic Tatva pandit ke liye apply karne ke liye dhanyawaad. Sankhep mein review ke baad, hum is samay aapki application *approve* nahi kar paa rahe hain.${reasonLine}

Aap bhavishya mein dobara apply kar sakte hain. Agar koi prashn ho, to is message ka reply karein — humari team aapse jaldi sampark karegi.

Aapki spiritual yatra ke liye shubhkamnaayein.

— Vedic Tatva Team`;
}

function openWhatsApp(phone: string | null | undefined, message: string): boolean {
  const num = toIndianWhatsAppNumber(phone);
  if (!num) return false;
  const url = `https://wa.me/${num}?text=${encodeURIComponent(message)}`;
  window.open(url, "_blank", "noopener,noreferrer");
  return true;
}

function PanditApplicationsTab({ adminToken }: { adminToken?: string }) {
  const fetcher = createFetcher(adminToken);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected" | "all">("pending");

  const { data: stats } = useQuery<{ pendingPanditApplications: number; approvedPanditApplications: number; rejectedPanditApplications: number; totalPanditApplications: number }>({
    queryKey: ["/api/admin/stats", "pandit-apps-tab"],
    queryFn: () => fetcher("/api/admin/stats"),
  });
  const pillCount = (id: "pending" | "approved" | "rejected" | "all"): number | null => {
    if (!stats) return null;
    if (id === "pending") return stats.pendingPanditApplications ?? 0;
    if (id === "approved") return stats.approvedPanditApplications ?? 0;
    if (id === "rejected") return stats.rejectedPanditApplications ?? 0;
    return stats.totalPanditApplications ?? 0;
  };
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [adminNote, setAdminNote] = useState("");
  const [sortKey, setSortKey] = useState<"createdAt" | "fullName" | "city" | "status">("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const toggleSort = (key: typeof sortKey) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir(key === "createdAt" ? "desc" : "asc"); }
  };

  const listKey = ["/api/admin/pandit-applications", filter];
  const { data: apps, isLoading } = useQuery<PanditApplication[]>({
    queryKey: listKey,
    queryFn: () => fetcher(filter === "all" ? "/api/admin/pandit-applications" : `/api/admin/pandit-applications?status=${filter}`),
  });

  const { data: selected } = useQuery<PanditApplication>({
    queryKey: ["/api/admin/pandit-applications", "detail", selectedId],
    queryFn: () => fetcher(`/api/admin/pandit-applications/${selectedId}`),
    enabled: selectedId !== null,
  });

  useEffect(() => {
    if (selected) setAdminNote(selected.adminNote || "");
  }, [selected]);

  const decisionMutation = useMutation({
    mutationFn: async ({ id, action, note }: { id: number; action: "approve" | "reject"; note: string }) => {
      const res = await fetch(`/api/admin/pandit-applications/${id}/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-token": adminToken || "" },
        body: JSON.stringify({ note }),
      });
      const body = await res.json().catch(() => ({} as any));
      if (!res.ok) {
        const err: any = new Error(body?.message || "Request failed");
        err.status = res.status;
        err.body = body;
        throw err;
      }
      return { ...body, action } as { success: boolean; action: "approve" | "reject"; message?: string };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pandit-applications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/book-pandit-online", "admin"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({
        title: data.action === "approve" ? "Application Approved" : "Application Rejected",
        description: data.action === "approve" ? "A public pandit profile has been created." : "Application marked as rejected.",
      });
      setSelectedId(null);
    },
    onError: (err: any) => {
      if (err?.status === 409) {
        toast({ title: "Already Processed", description: err.message || "This application was already approved or rejected.", variant: "destructive" });
        queryClient.invalidateQueries({ queryKey: ["/api/admin/pandit-applications"] });
      } else {
        toast({ title: "Action Failed", description: err?.message || "Could not update application.", variant: "destructive" });
      }
    },
  });

  const sortedApps = (apps || []).slice().sort((a, b) => {
    let av: any = (a as any)[sortKey];
    let bv: any = (b as any)[sortKey];
    if (sortKey === "createdAt") {
      av = av ? new Date(av).getTime() : 0;
      bv = bv ? new Date(bv).getTime() : 0;
    } else {
      av = (av || "").toString().toLowerCase();
      bv = (bv || "").toString().toLowerCase();
    }
    if (av < bv) return sortDir === "asc" ? -1 : 1;
    if (av > bv) return sortDir === "asc" ? 1 : -1;
    return 0;
  });

  const counts = {
    total: apps?.length || 0,
    pending: (apps || []).filter(a => a.status === "pending").length,
    approved: (apps || []).filter(a => a.status === "approved").length,
    rejected: (apps || []).filter(a => a.status === "rejected").length,
  };

  return (
    <div className="space-y-6" data-testid="pandit-apps-tab">
      <div>
        <h1 className="text-3xl font-serif text-primary" data-testid="page-title-pandit-apps">Pandit Applications</h1>
        <p className="text-sm text-muted-foreground">Review and moderate pandit registrations</p>
      </div>

      <div className="flex flex-wrap gap-2" data-testid="status-filter-pills">
        {APP_FILTERS.map((f) => {
          const c = pillCount(f.id);
          const active = filter === f.id;
          return (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors inline-flex items-center gap-2 ${
                active
                  ? "bg-primary text-white border-primary"
                  : "bg-card text-muted-foreground border-border hover-elevate"
              }`}
              data-testid={`filter-${f.id}`}
            >
              <span>{f.label}</span>
              {c !== null && (
                <span
                  className={`text-[11px] font-semibold px-1.5 py-0.5 rounded-full ${
                    active ? "bg-white/20 text-white" : "bg-muted text-foreground"
                  }`}
                  data-testid={`filter-count-${f.id}`}
                >
                  {c}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg text-primary font-serif">Applications</CardTitle>
          <CardDescription className="text-muted-foreground">{counts.total} {filter === "all" ? "total" : filter} application{counts.total === 1 ? "" : "s"}</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : !apps || apps.length === 0 ? (
            <div className="text-center py-12" data-testid="empty-state">
              <FileText className="w-12 h-12 mx-auto text-border mb-3" />
              <p className="text-sm text-muted-foreground">
                No {filter === "all" ? "" : filter} applications {filter === "pending" ? "to review right now" : "yet"}.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm" data-testid="applications-table">
                <thead className="text-left border-b border-border">
                  <tr className="text-xs uppercase tracking-wide text-secondary">
                    <SortHeader label="Name" k="fullName" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} />
                    <SortHeader label="City" k="city" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} />
                    <th className="py-2 pr-3 font-medium hidden md:table-cell">Contact</th>
                    <th className="py-2 pr-3 font-medium hidden sm:table-cell">Exp</th>
                    <th className="py-2 pr-3 font-medium hidden lg:table-cell">Fees</th>
                    <SortHeader label="Submitted" k="createdAt" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} className="hidden lg:table-cell" />
                    <SortHeader label="Status" k="status" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} />
                  </tr>
                </thead>
                <tbody>
                  {sortedApps.map((app) => (
                    <tr
                      key={app.id}
                      onClick={() => setSelectedId(app.id)}
                      className="border-b border-muted cursor-pointer hover-elevate"
                      data-testid={`row-application-${app.id}`}
                    >
                      <td className="py-3 pr-3 text-foreground font-medium" data-testid={`text-name-${app.id}`}>{app.fullName}</td>
                      <td className="py-3 pr-3 text-muted-foreground" data-testid={`text-city-${app.id}`}>{app.city}</td>
                      <td className="py-3 pr-3 text-muted-foreground hidden md:table-cell">
                        <div className="text-xs">{app.email}</div>
                        <div className="text-xs text-secondary">{app.phone}</div>
                      </td>
                      <td className="py-3 pr-3 text-muted-foreground hidden sm:table-cell">{app.yearsExperience}y</td>
                      <td className="py-3 pr-3 text-muted-foreground hidden lg:table-cell whitespace-nowrap">₹{app.feeRangeMin.toLocaleString("en-IN")}–₹{app.feeRangeMax.toLocaleString("en-IN")}</td>
                      <td className="py-3 pr-3 text-secondary hidden lg:table-cell whitespace-nowrap text-xs">
                        {app.createdAt ? new Date(app.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                      </td>
                      <td className="py-3 pr-3">
                        <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${APP_STATUS_COLORS[app.status] || "bg-muted text-foreground"}`} data-testid={`badge-status-${app.id}`}>
                          {app.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={selectedId !== null} onOpenChange={(open) => { if (!open) setSelectedId(null); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="application-detail-dialog">
          {!selected ? (
            <div className="py-10"><Skeleton className="h-32 w-full" /></div>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl text-primary font-serif" data-testid="detail-title">
                  {selected.fullName}
                </DialogTitle>
                <DialogDescription className="flex items-center gap-2">
                  <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${APP_STATUS_COLORS[selected.status] || "bg-muted text-foreground"}`}>
                    {selected.status}
                  </span>
                  <span className="text-muted-foreground">{selected.city}</span>
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 mt-2">
                <div className="flex items-start gap-4">
                  {selected.photo ? (
                    <img src={selected.photo} alt={selected.fullName} className="w-24 h-24 rounded-lg object-cover border border-border" data-testid="img-applicant-photo" />
                  ) : (
                    <div className="w-24 h-24 rounded-lg bg-muted border border-border flex items-center justify-center text-center text-[10px] text-secondary p-2" data-testid="img-photo-placeholder">
                      Photo not stored (too large or not provided)
                    </div>
                  )}
                  <div className="flex-1 space-y-1 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground"><Mail className="w-3.5 h-3.5" /> {selected.email}</div>
                    <div className="flex items-center gap-2 text-muted-foreground"><Phone className="w-3.5 h-3.5" /> {selected.phone}</div>
                    <div className="text-muted-foreground"><span className="text-secondary">Experience:</span> {selected.yearsExperience} years</div>
                    <div className="text-muted-foreground"><span className="text-secondary">Fees:</span> ₹{selected.feeRangeMin.toLocaleString("en-IN")} – ₹{selected.feeRangeMax.toLocaleString("en-IN")}</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <DetailField label="Regional Origin" value={selected.regionalOrigin} />
                  <DetailField label="Service Area" value={selected.serviceArea} />
                  <DetailField label="Gotra" value={selected.gotra} />
                  <DetailField label="Parampara" value={selected.parampara} />
                  <DetailField label="Veda Specialization" value={selected.vedaSpecialization} />
                  <DetailField label="Languages" value={selected.languages} />
                  <DetailField label="Education" value={selected.education} />
                  <DetailField label="Certificates" value={selected.certificates} />
                </div>

                <DetailField label="Puja Types" value={selected.pujaTypes} block />
                <DetailField label="Bio" value={selected.bio} block />

                {selected.createdAt && (
                  <div className="text-xs text-secondary">
                    Submitted {new Date(selected.createdAt).toLocaleString("en-IN")}
                    {selected.reviewedAt && <> · Reviewed {new Date(selected.reviewedAt).toLocaleString("en-IN")}</>}
                  </div>
                )}

                <div className="space-y-2 pt-2 border-t border-border">
                  <Label className="text-sm text-muted-foreground">Internal Admin Note</Label>
                  <Textarea
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    placeholder="Optional note saved with this decision..."
                    className="min-h-[80px]"
                    data-testid="input-admin-note"
                    disabled={selected.status !== "pending"}
                  />
                </div>
              </div>

              {(() => {
                const waNumber = toIndianWhatsAppNumber(selected.phone);
                const noteForMessage = selected.status === "pending" ? adminNote : (selected.adminNote || "");
                const sendOnWhatsApp = (kind: "approval" | "rejection") => {
                  const message = kind === "approval"
                    ? buildApprovalWhatsAppMessage(selected.fullName, selected.city, noteForMessage)
                    : buildRejectionWhatsAppMessage(selected.fullName, noteForMessage);
                  const ok = openWhatsApp(selected.phone, message);
                  if (!ok) {
                    toast({
                      title: "Invalid phone number",
                      description: "Could not build a WhatsApp link from this applicant's phone.",
                      variant: "destructive",
                    });
                  }
                };
                return (
                  <div className="pt-3 mt-2 border-t border-border space-y-3">
                    <div>
                      <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-secondary mb-1.5">
                        <MessageCircle className="w-3.5 h-3.5" /> WhatsApp ({waNumber ? `+${waNumber}` : "no valid +91 number"})
                      </div>
                      <div className="flex flex-wrap gap-2" data-testid="whatsapp-actions">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => sendOnWhatsApp("approval")}
                          disabled={!waNumber}
                          data-testid="btn-whatsapp-approval"
                          className="border-emerald-200 text-emerald-700"
                        >
                          <MessageCircle className="w-4 h-4 mr-1.5" /> Send approval message
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => sendOnWhatsApp("rejection")}
                          disabled={!waNumber}
                          data-testid="btn-whatsapp-rejection"
                          className="border-red-200 text-red-700"
                        >
                          <MessageCircle className="w-4 h-4 mr-1.5" /> Send rejection message
                        </Button>
                      </div>
                      <p className="text-[11px] text-secondary mt-1.5">
                        Opens WhatsApp with a prefilled Hindi/English message.
                        {selected.status === "pending"
                          ? " Uses the admin note above as the personalized line."
                          : selected.adminNote
                            ? " Uses the saved admin note as the personalized line."
                            : ""}
                      </p>
                    </div>

                    <DialogFooter className="gap-2 flex-wrap">
                      {selected.status === "pending" ? (
                        <>
                          <Button
                            variant="outline"
                            onClick={() => decisionMutation.mutate({ id: selected.id, action: "reject", note: adminNote })}
                            disabled={decisionMutation.isPending}
                            data-testid="btn-reject"
                            className="border-red-200 text-red-700"
                          >
                            <XCircle className="w-4 h-4 mr-1.5" /> Reject
                          </Button>
                          <Button
                            onClick={() => decisionMutation.mutate({ id: selected.id, action: "approve", note: adminNote })}
                            disabled={decisionMutation.isPending}
                            data-testid="btn-approve"
                            className="bg-primary text-white"
                          >
                            <CheckCircle className="w-4 h-4 mr-1.5" /> Approve & Publish
                          </Button>
                        </>
                      ) : (
                        <div className="text-sm text-muted-foreground">
                          This application has already been <span className="font-semibold">{selected.status}</span>.
                          {selected.adminNote && <div className="mt-2 text-xs text-secondary">Note: {selected.adminNote}</div>}
                        </div>
                      )}
                    </DialogFooter>
                  </div>
                );
              })()}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SortHeader({ label, k, sortKey, sortDir, onClick, className }: {
  label: string;
  k: "createdAt" | "fullName" | "city" | "status";
  sortKey: string;
  sortDir: "asc" | "desc";
  onClick: (k: any) => void;
  className?: string;
}) {
  const active = sortKey === k;
  return (
    <th className={`py-2 pr-3 font-medium ${className || ""}`}>
      <button
        type="button"
        onClick={() => onClick(k)}
        className="inline-flex items-center gap-1 uppercase tracking-wide text-secondary hover:text-primary"
        data-testid={`sort-${k}`}
      >
        {label}
        <span className="text-[10px]">{active ? (sortDir === "asc" ? "▲" : "▼") : "↕"}</span>
      </button>
    </th>
  );
}

function DetailField({ label, value, block }: { label: string; value: string | null | undefined; block?: boolean }) {
  if (!value) return (
    <div className={block ? "col-span-full" : ""}>
      <div className="text-[10px] uppercase tracking-wide text-secondary mb-0.5">{label}</div>
      <div className="text-sm text-muted-foreground/40 italic">—</div>
    </div>
  );
  return (
    <div className={block ? "col-span-full" : ""}>
      <div className="text-[10px] uppercase tracking-wide text-secondary mb-0.5">{label}</div>
      <div className="text-sm text-foreground whitespace-pre-wrap">{value}</div>
    </div>
  );
}

export default PanditApplicationsTab;
