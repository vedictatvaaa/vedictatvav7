import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Settings, BellRing, CheckCircle, XCircle, Phone, Mail, MessageCircle, Type, RefreshCw, FileText, Send, Zap, ChevronDown, ChevronUp } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

import { Button } from "@/components/ui/button";

import { Skeleton } from "@/components/ui/skeleton";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { Pandit, Order } from "@shared/schema";

import { createFetcher } from "../admin-shared";

// ============================================================
// Quick Test Bar
// ============================================================

type ChannelResult = { ok: boolean; reason?: string };
type TestResults = { sms?: ChannelResult; whatsapp?: ChannelResult; email?: ChannelResult };

function QuickTestBar({ adminToken }: { adminToken?: string }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState(() => localStorage.getItem("qt_phone") || "");
  const [email, setEmail] = useState(() => localStorage.getItem("qt_email") || "");
  const [sending, setSending] = useState<"all" | "email" | "sms_wa" | null>(null);
  const [results, setResults] = useState<TestResults | null>(null);
  const clearTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { localStorage.setItem("qt_phone", phone); }, [phone]);
  useEffect(() => { localStorage.setItem("qt_email", email); }, [email]);

  const clearResultsAfter = (ms: number) => {
    if (clearTimer.current) clearTimeout(clearTimer.current);
    clearTimer.current = setTimeout(() => setResults(null), ms);
  };

  const fire = async (mode: "all" | "email" | "sms_wa") => {
    const p = phone.trim();
    const e = email.trim();
    if (mode === "email" && !e) { toast({ title: "Enter an email address first", variant: "destructive" }); return; }
    if (mode === "sms_wa" && !p) { toast({ title: "Enter a mobile number first", variant: "destructive" }); return; }
    if (mode === "all" && !p && !e) { toast({ title: "Enter a phone or email first", variant: "destructive" }); return; }

    setSending(mode);
    setResults(null);
    try {
      const body: any = {};
      if (mode === "email") { body.email = e; }
      else if (mode === "sms_wa") { body.phone = p; }
      else { if (p) body.phone = p; if (e) body.email = e; }

      const res = await fetch("/api/admin/notifications/test", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-token": adminToken || "" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Test failed");
      setResults(json.results ?? {});
      clearResultsAfter(30_000);
    } catch (err: any) {
      toast({ title: "Test failed", description: err?.message || String(err), variant: "destructive" });
    } finally {
      setSending(null);
    }
  };

  const ResultBadge = ({ label, r }: { label: string; r?: ChannelResult }) => {
    if (!r) return null;
    return (
      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium border ${r.ok ? "bg-emerald-50 border-emerald-300 text-emerald-800" : "bg-red-50 border-red-200 text-red-800"}`}>
        {r.ok ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
        {label}{!r.ok && r.reason ? `: ${r.reason.slice(0, 40)}` : ""}
      </span>
    );
  };

  const anyResult = results && (results.sms || results.whatsapp || results.email);

  return (
    <Card className="border-primary/30 bg-primary/5" data-testid="card-quick-test">
      <CardContent className="py-3">
        <button
          className="w-full flex items-center justify-between gap-3 text-left"
          onClick={() => setOpen(v => !v)}
          data-testid="button-toggle-quick-test"
        >
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            <span className="font-semibold text-primary text-sm">Quick Channel Test</span>
            <span className="text-xs text-muted-foreground hidden sm:inline">— verify SendGrid &amp; MSG91 with one click</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {anyResult && !open && (
              <div className="flex gap-1">
                <ResultBadge label="Email" r={results?.email} />
                <ResultBadge label="SMS" r={results?.sms} />
                <ResultBadge label="WA" r={results?.whatsapp} />
              </div>
            )}
            {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </div>
        </button>

        {open && (
          <div className="mt-4 space-y-4" data-testid="quick-test-panel">
            {/* Inputs */}
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="qt-phone" className="text-xs uppercase tracking-wide text-secondary mb-1 block">
                  <Phone className="w-3 h-3 inline mr-1" />Mobile (SMS &amp; WhatsApp)
                </Label>
                <Input
                  id="qt-phone"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="9999911111"
                  data-testid="input-qt-phone"
                />
                <p className="text-[10px] text-muted-foreground mt-1">Saved automatically for next time.</p>
              </div>
              <div>
                <Label htmlFor="qt-email" className="text-xs uppercase tracking-wide text-secondary mb-1 block">
                  <Mail className="w-3 h-3 inline mr-1" />Email
                </Label>
                <Input
                  id="qt-email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="admin@vedictatva.com"
                  data-testid="input-qt-email"
                />
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                onClick={() => fire("all")}
                disabled={!!sending}
                data-testid="button-qt-all"
              >
                {sending === "all" ? "Sending…" : <><Zap className="w-3.5 h-3.5 mr-1" />Test All Channels</>}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => fire("email")}
                disabled={!!sending}
                data-testid="button-qt-email"
              >
                {sending === "email" ? "Sending…" : <><Mail className="w-3.5 h-3.5 mr-1" />Email only</>}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => fire("sms_wa")}
                disabled={!!sending}
                data-testid="button-qt-sms"
              >
                {sending === "sms_wa" ? "Sending…" : <><Phone className="w-3.5 h-3.5 mr-1" />SMS &amp; WhatsApp</>}
              </Button>
              {anyResult && (
                <Button size="sm" variant="ghost" onClick={() => setResults(null)} data-testid="button-qt-clear">
                  Clear results
                </Button>
              )}
            </div>

            {/* Results */}
            {anyResult && (
              <div className="grid sm:grid-cols-3 gap-2" data-testid="qt-results">
                {(["email", "sms", "whatsapp"] as const).map(ch => {
                  const r = results?.[ch];
                  if (!r) return null;
                  return (
                    <div
                      key={ch}
                      className={`rounded-lg border p-3 ${r.ok ? "border-emerald-300 bg-emerald-50" : "border-red-200 bg-red-50"}`}
                      data-testid={`qt-result-${ch}`}
                    >
                      <div className="flex items-center gap-1.5 text-sm font-semibold capitalize mb-1">
                        {r.ok
                          ? <CheckCircle className="w-4 h-4 text-emerald-700" />
                          : <XCircle className="w-4 h-4 text-red-700" />}
                        {ch === "sms" ? "SMS" : ch === "whatsapp" ? "WhatsApp" : "Email"}
                      </div>
                      <p className={`text-xs ${r.ok ? "text-emerald-800" : "text-red-800"}`}>
                        {r.ok ? "Delivered successfully ✓" : r.reason || "Failed"}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}

            <p className="text-[11px] text-muted-foreground">
              Sends a sample &ldquo;new puja booking&rdquo; notification to the numbers above using your configured MSG91 and SendGrid credentials.
              Results auto-clear after 30 seconds.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================
interface NotificationsStatus {
  msg91: {
    authKey: boolean;
    senderId: boolean;
    smsTemplateId: boolean;
    smsTemplateIdPandit: boolean;
    smsTemplateIdCustomer: boolean;
    whatsappIntegratedNumber: boolean;
    whatsappTemplateName: boolean;
    whatsappTemplateNamePandit: boolean;
    whatsappTemplateNameCustomer: boolean;
    whatsappTemplateLang: string;
    whatsappTemplateNamespace: boolean;
  };
  sendgrid: { apiKey: boolean; mailFrom: string; mailFromName: string };
  ready: { sms: boolean; whatsapp: boolean; email: boolean };
}

function NotificationsTab({ adminToken }: { adminToken?: string }) {
  const { toast } = useToast();
  const fetcher = createFetcher(adminToken);
  const { data, isLoading, refetch } = useQuery<NotificationsStatus>({
    queryKey: ["/api/admin/notifications/status"],
    queryFn: () => fetcher("/api/admin/notifications/status"),
  });

  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [panditName, setPanditName] = useState("");
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<Record<string, { ok: boolean; reason?: string }> | null>(null);

  const runTest = async () => {
    setTesting(true);
    setResults(null);
    try {
      const res = await fetch("/api/admin/notifications/test", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-token": adminToken || "" },
        body: JSON.stringify({ phone: phone.trim(), email: email.trim(), panditName: panditName.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Test failed");
      setResults(json.results);
      toast({ title: "Test triggered", description: "Check the result panel below." });
    } catch (err: any) {
      toast({ title: "Test failed", description: err?.message || String(err), variant: "destructive" });
    } finally {
      setTesting(false);
    }
  };

  const StatusRow = ({ label, ok, hint }: { label: string; ok: boolean; hint?: string }) => (
    <div className="flex items-start justify-between gap-3 py-2 border-b border-muted last:border-b-0" data-testid={`status-row-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}>
      <div className="min-w-0">
        <div className="text-sm font-medium text-foreground">{label}</div>
        {hint && <div className="text-xs text-muted-foreground mt-0.5">{hint}</div>}
      </div>
      <div className={`shrink-0 inline-flex items-center gap-1 text-xs font-semibold ${ok ? "text-emerald-700" : "text-red-700"}`}>
        {ok ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
        {ok ? "Configured" : "Missing"}
      </div>
    </div>
  );

  const ChannelBadge = ({ label, ok }: { label: string; ok: boolean }) => (
    <div className={`px-3 py-2 rounded-md border flex items-center gap-2 text-sm font-medium ${ok ? "border-emerald-300 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-800"}`} data-testid={`channel-${label.toLowerCase()}`}>
      {ok ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
      {label}: {ok ? "Live" : "Not configured"}
    </div>
  );

  return (
    <div className="space-y-6" data-testid="notifications-tab">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-primary">Booking Notifications</h2>
          <p className="text-sm text-muted-foreground mt-1">
            When a yajman books a puja, the assigned pandit is automatically notified via SMS, WhatsApp and Email.
            Configure MSG91 (for SMS + WhatsApp) and SendGrid (for Email) below.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} data-testid="button-refresh-status">
          <RefreshCw className="w-4 h-4 mr-1" /> Refresh status
        </Button>
      </div>

      <QuickTestBar adminToken={adminToken} />

      {isLoading || !data ? (
        <Skeleton className="h-40 w-full" />
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Channel readiness</CardTitle>
              <CardDescription>Quick check of whether each delivery channel is fully configured.</CardDescription>
            </CardHeader>
            <CardContent className="grid sm:grid-cols-3 gap-3">
              <ChannelBadge label="SMS" ok={data.ready.sms} />
              <ChannelBadge label="WhatsApp" ok={data.ready.whatsapp} />
              <ChannelBadge label="Email" ok={data.ready.email} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><MessageCircle className="w-4 h-4" /> MSG91 (SMS + WhatsApp)</CardTitle>
              <CardDescription>
                These are loaded from environment secrets. Add or update them in the project's Secrets tab — they take effect after the next workflow restart.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-1">
              <StatusRow label="MSG91_AUTH_KEY" ok={data.msg91.authKey} hint="Required for both SMS and WhatsApp." />
              <StatusRow label="MSG91_SENDER_ID" ok={data.msg91.senderId} hint="6-character DLT-approved sender ID." />
              <StatusRow label="MSG91_SMS_TEMPLATE_ID" ok={data.msg91.smsTemplateId} hint="Default SMS DLT template ID. Used for both pandit and customer if no role-specific override is set." />
              <StatusRow label="MSG91_SMS_TEMPLATE_ID_PANDIT" ok={data.msg91.smsTemplateIdPandit} hint="Optional: separate DLT template for pandit alerts." />
              <StatusRow label="MSG91_SMS_TEMPLATE_ID_CUSTOMER" ok={data.msg91.smsTemplateIdCustomer} hint="Optional: separate DLT template for customer confirmations." />
              <StatusRow label="MSG91_WHATSAPP_INTEGRATED_NUMBER" ok={data.msg91.whatsappIntegratedNumber} hint="Your WhatsApp Business number registered on MSG91." />
              <StatusRow label="MSG91_WHATSAPP_TEMPLATE_NAME" ok={data.msg91.whatsappTemplateName} hint="Default approved WhatsApp template name." />
              <StatusRow label="MSG91_WHATSAPP_TEMPLATE_NAME_PANDIT" ok={data.msg91.whatsappTemplateNamePandit} hint="Optional: separate WhatsApp template for pandits." />
              <StatusRow label="MSG91_WHATSAPP_TEMPLATE_NAME_CUSTOMER" ok={data.msg91.whatsappTemplateNameCustomer} hint="Optional: separate WhatsApp template for customers." />
              <div className="flex items-start justify-between gap-3 py-2 border-b border-muted last:border-b-0">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-foreground">MSG91_WHATSAPP_TEMPLATE_LANG</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Template language code. Defaults to <code>en</code>.</div>
                </div>
                <div className="text-xs font-mono px-2 py-1 rounded bg-muted text-muted-foreground">{data.msg91.whatsappTemplateLang}</div>
              </div>
              <StatusRow label="MSG91_WHATSAPP_TEMPLATE_NAMESPACE" ok={data.msg91.whatsappTemplateNamespace} hint="Optional: WhatsApp namespace if your template requires it." />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><Mail className="w-4 h-4" /> SendGrid (Email)</CardTitle>
              <CardDescription>Used for the email notification sent to the assigned pandit.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1">
              <StatusRow label="SENDGRID_API_KEY" ok={data.sendgrid.apiKey} hint="Required to send emails. Without it, emails are logged to the server console only." />
              <div className="flex items-start justify-between gap-3 py-2 border-b border-muted last:border-b-0">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-foreground">MAIL_FROM</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Sender email address (must be verified in SendGrid).</div>
                </div>
                <div className="text-xs font-mono px-2 py-1 rounded bg-muted text-muted-foreground">{data.sendgrid.mailFrom}</div>
              </div>
              <div className="flex items-start justify-between gap-3 py-2">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-foreground">MAIL_FROM_NAME</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Friendly sender name shown in inboxes.</div>
                </div>
                <div className="text-xs font-mono px-2 py-1 rounded bg-muted text-muted-foreground">{data.sendgrid.mailFromName}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><FileText className="w-4 h-4" /> MSG91 template requirements</CardTitle>
              <CardDescription>What your DLT-approved templates must contain so variables substitute correctly.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-relaxed">
              <div>
                <div className="font-semibold text-foreground mb-1">SMS DLT template (6 variables)</div>
                <p className="text-muted-foreground">Order matters. Use these placeholders in your DLT template body:</p>
                <ul className="list-disc list-inside mt-2 text-muted-foreground space-y-0.5">
                  <li><code>{"{{var1}}"}</code> — recipient name (pandit name or customer name)</li>
                  <li><code>{"{{var2}}"}</code> — puja name</li>
                  <li><code>{"{{var3}}"}</code> — date (e.g. <em>15 May 2026</em>)</li>
                  <li><code>{"{{var4}}"}</code> — time slot (e.g. <em>morning</em>)</li>
                  <li><code>{"{{var5}}"}</code> — other party name (customer name in pandit SMS, pandit name in customer SMS)</li>
                  <li><code>{"{{var6}}"}</code> — other party mobile</li>
                </ul>
              </div>
              <div>
                <div className="font-semibold text-foreground mb-1">WhatsApp template (5 body variables)</div>
                <p className="text-muted-foreground">Approve a Business Initiated template on MSG91 with 5 body parameters in this order:</p>
                <ol className="list-decimal list-inside mt-2 text-muted-foreground space-y-0.5">
                  <li>Recipient name</li>
                  <li>Puja name</li>
                  <li>Date + time slot (e.g. <em>15 May 2026 (morning)</em>)</li>
                  <li>Other party name</li>
                  <li>Other party mobile</li>
                </ol>
              </div>
              <div className="rounded-md border border-muted bg-muted p-3 text-[13px] text-muted-foreground">
                <strong>Note:</strong> Indian mobile numbers are auto-normalized to <code>91XXXXXXXXXX</code> before sending.
                If any required secret is missing, that channel is silently skipped — bookings always succeed and the skip reason is logged on the server.
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><BellRing className="w-4 h-4" /> Send a test notification</CardTitle>
              <CardDescription>Sends a sample &quot;new booking&quot; alert via SMS, WhatsApp, and Email to verify your setup.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid sm:grid-cols-3 gap-3">
                <div>
                  <Label htmlFor="test-pandit-name" className="text-xs uppercase tracking-wide text-secondary">Pandit name (optional)</Label>
                  <Input id="test-pandit-name" value={panditName} onChange={(e) => setPanditName(e.target.value)} placeholder="Pandit Sharma" data-testid="input-test-pandit-name" />
                </div>
                <div>
                  <Label htmlFor="test-phone" className="text-xs uppercase tracking-wide text-secondary">Mobile (SMS + WhatsApp)</Label>
                  <Input id="test-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="9999911111" data-testid="input-test-phone" />
                </div>
                <div>
                  <Label htmlFor="test-email" className="text-xs uppercase tracking-wide text-secondary">Email</Label>
                  <Input id="test-email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="pandit@example.com" data-testid="input-test-email" />
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Button onClick={runTest} disabled={testing || (!phone.trim() && !email.trim())} data-testid="button-send-test">
                  {testing ? "Sending..." : "Send test notification"}
                </Button>
                <span className="text-xs text-muted-foreground">Provide at least a mobile number or an email.</span>
              </div>

              {results && (
                <div className="mt-3 grid sm:grid-cols-3 gap-2" data-testid="test-results">
                  {(["sms", "whatsapp", "email"] as const).map((k) => (
                    <div key={k} className={`p-3 rounded-md border ${results[k]?.ok ? "border-emerald-300 bg-emerald-50" : "border-red-200 bg-red-50"}`} data-testid={`test-result-${k}`}>
                      <div className="flex items-center gap-2 text-sm font-semibold capitalize">
                        {results[k]?.ok ? <CheckCircle className="w-4 h-4 text-emerald-700" /> : <XCircle className="w-4 h-4 text-red-700" />}
                        {k}
                      </div>
                      {!results[k]?.ok && results[k]?.reason && (
                        <div className="mt-1 text-xs text-red-800 break-words">{results[k]?.reason}</div>
                      )}
                      {results[k]?.ok && (
                        <div className="mt-1 text-xs text-emerald-800">Sent successfully.</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <OrderJourneyNotificationsSection adminToken={adminToken} />
        </>
      )}
    </div>
  );
}

// ============================================================
// Order-journey notifications (Task #20)
// ============================================================
const NOTIF_KINDS: { value: string; label: string }[] = [
  { value: "payment_received", label: "Payment received" },
  { value: "order_confirmed", label: "Order confirmed" },
  { value: "order_shipped", label: "Order shipped" },
  { value: "out_for_delivery", label: "Out for delivery" },
  { value: "delivered", label: "Delivered" },
  { value: "refund_initiated", label: "Refund initiated" },
  { value: "abandoned_cart_wa", label: "Abandoned cart (WhatsApp)" },
  { value: "review_request_2", label: "Review reminder (WhatsApp)" },
];
const SETTING_KEY_BY_KIND: Record<string, string> = {
  payment_received: "paymentReceived",
  order_confirmed: "orderConfirmed",
  order_shipped: "orderShipped",
  out_for_delivery: "outForDelivery",
  delivered: "delivered",
  refund_initiated: "refundInitiated",
  abandoned_cart_wa: "abandonedCartWa",
  review_request_2: "reviewRequest2",
};

interface NotificationLogRow {
  id: number;
  orderId: number | null;
  recipientPhone: string | null;
  recipientEmail: string | null;
  channel: string;
  kind: string;
  status: string;
  reason: string | null;
  createdAt: string;
}
interface NotificationLogResponse {
  rows: NotificationLogRow[];
  total: number;
  kpis: { sent: number; failed: number; skipped: number };
}

function OrderJourneyNotificationsSection({ adminToken }: { adminToken?: string }) {
  const { toast } = useToast();
  const fetcher = createFetcher(adminToken);
  const queryClient = useQueryClient();

  const [filterChannel, setFilterChannel] = useState<string>("all");
  const [filterKind, setFilterKind] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterSince, setFilterSince] = useState<string>("");
  const [filterUntil, setFilterUntil] = useState<string>("");
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 25;

  const logQuery = useQuery<NotificationLogResponse>({
    queryKey: ["/api/admin/notifications/log", filterChannel, filterKind, filterStatus, filterSince, filterUntil, page],
    queryFn: () => {
      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        offset: String(page * PAGE_SIZE),
        channel: filterChannel,
        kind: filterKind,
        status: filterStatus,
      });
      if (filterSince) params.set("since", filterSince);
      if (filterUntil) params.set("until", filterUntil);
      return fetcher(`/api/admin/notifications/log?${params.toString()}`);
    },
  });

  const settingsQuery = useQuery<Record<string, any>>({
    queryKey: ["/api/admin/notifications/settings"],
    queryFn: () => fetcher("/api/admin/notifications/settings"),
  });

  const settingsMutation = useMutation({
    mutationFn: async (patch: Record<string, boolean>) => {
      const res = await fetch("/api/admin/notifications/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-admin-token": adminToken || "" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({})))?.message || "update failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/notifications/settings"] });
      toast({ title: "Settings updated" });
    },
    onError: (e: any) => toast({ title: "Update failed", description: e?.message, variant: "destructive" }),
  });

  const [testChannel, setTestChannel] = useState<"whatsapp" | "sms">("whatsapp");
  const [testKind, setTestKind] = useState<string>("payment_received");
  const [testPhone, setTestPhone] = useState<string>("");
  const [testEmail, setTestEmail] = useState<string>("");
  const [testOrderId, setTestOrderId] = useState<string>("");
  const [testing, setTesting] = useState(false);

  const runOrderTest = async () => {
    if (!testPhone.trim()) {
      toast({ title: "Phone required", variant: "destructive" });
      return;
    }
    setTesting(true);
    try {
      const body: any = { channel: testChannel, kind: testKind, phone: testPhone.trim() };
      if (testEmail.trim()) body.email = testEmail.trim();
      if (testOrderId.trim()) body.orderId = testOrderId.trim();
      const res = await fetch("/api/admin/notifications/order-test", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-token": adminToken || "" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        toast({ title: "Test failed", description: json?.reason || json?.message || "send failed", variant: "destructive" });
      } else {
        toast({ title: "Test sent", description: `${testChannel} -> ${testPhone}` });
      }
      logQuery.refetch();
    } catch (e: any) {
      toast({ title: "Test failed", description: e?.message, variant: "destructive" });
    } finally {
      setTesting(false);
    }
  };

  const kpis = logQuery.data?.kpis || { sent: 0, failed: 0, skipped: 0 };
  const settings = settingsQuery.data || {};
  const total = logQuery.data?.total || 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const fmtTime = (iso: string) => {
    try {
      return new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
    } catch { return iso; }
  };
  const statusBadgeClass = (s: string) => {
    if (s === "sent") return "border-emerald-300 bg-emerald-50 text-emerald-800";
    if (s === "failed") return "border-red-200 bg-red-50 text-red-800";
    return "border-amber-200 bg-amber-50 text-amber-800";
  };
  const channelLabel = (c: string) => c.charAt(0).toUpperCase() + c.slice(1);
  const kindLabel = (k: string) => NOTIF_KINDS.find(x => x.value === k)?.label || k;

  return (
    <>
      {/* KPI strip */}
      <Card data-testid="card-notif-kpis">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><BellRing className="w-4 h-4" /> Order journey notifications — today</CardTitle>
          <CardDescription>Counts of WhatsApp + SMS notifications dispatched since midnight (IST).</CardDescription>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-3 gap-3">
          <div className="rounded-md border p-3" data-testid="kpi-sent">
            <div className="text-xs uppercase tracking-wide text-secondary">Sent</div>
            <div className="text-2xl font-bold text-emerald-700 mt-1">{kpis.sent}</div>
          </div>
          <div className="rounded-md border p-3" data-testid="kpi-failed">
            <div className="text-xs uppercase tracking-wide text-secondary">Failed</div>
            <div className="text-2xl font-bold text-red-700 mt-1">{kpis.failed}</div>
          </div>
          <div className="rounded-md border p-3" data-testid="kpi-skipped">
            <div className="text-xs uppercase tracking-wide text-secondary">Skipped</div>
            <div className="text-2xl font-bold text-amber-700 mt-1">{kpis.skipped}</div>
          </div>
        </CardContent>
      </Card>

      {/* Per-kind toggles */}
      <Card data-testid="card-notif-settings">
        <CardHeader>
          <CardTitle className="text-base">Per-event toggles</CardTitle>
          <CardDescription>Disable a milestone here and future sends are silently skipped (and logged) without redeploying.</CardDescription>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-2 gap-3">
          {NOTIF_KINDS.map((k) => {
            const key = SETTING_KEY_BY_KIND[k.value];
            const enabled = settings?.[key] !== false;
            return (
              <div key={k.value} className="flex items-center justify-between gap-3 rounded-md border p-3">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-foreground">{k.label}</div>
                  <div className="text-xs text-muted-foreground">{enabled ? "Active" : "Disabled"}</div>
                </div>
                <Switch
                  checked={enabled}
                  onCheckedChange={(v) => settingsMutation.mutate({ [key]: !!v })}
                  disabled={settingsMutation.isPending || settingsQuery.isLoading}
                  data-testid={`switch-notif-${k.value}`}
                />
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Order-journey send-test */}
      <Card data-testid="card-notif-order-test">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><BellRing className="w-4 h-4" /> Send a journey test message</CardTitle>
          <CardDescription>Verify each WhatsApp/SMS template by sending a sample to a real number. Sample variables are injected.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <Label className="text-xs uppercase tracking-wide text-secondary">Channel</Label>
              <Select value={testChannel} onValueChange={(v) => setTestChannel(v === "sms" ? "sms" : "whatsapp")}>
                <SelectTrigger data-testid="select-test-channel"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wide text-secondary">Event kind</Label>
              <Select value={testKind} onValueChange={setTestKind}>
                <SelectTrigger data-testid="select-test-kind"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {NOTIF_KINDS.map((k) => (
                    <SelectItem key={k.value} value={k.value}>{k.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wide text-secondary">Mobile</Label>
              <Input value={testPhone} onChange={(e) => setTestPhone(e.target.value)} placeholder="9999911111" data-testid="input-order-test-phone" />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wide text-secondary">Email (optional)</Label>
              <Input value={testEmail} onChange={(e) => setTestEmail(e.target.value)} placeholder="devotee@example.com" data-testid="input-order-test-email" />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wide text-secondary">Fake order id (optional)</Label>
              <Input value={testOrderId} onChange={(e) => setTestOrderId(e.target.value)} placeholder="12345" data-testid="input-order-test-orderid" />
            </div>
          </div>
          <Button onClick={runOrderTest} disabled={testing} data-testid="button-order-test-send">
            {testing ? "Sending..." : "Send journey test"}
          </Button>
        </CardContent>
      </Card>

      {/* Log table */}
      <Card data-testid="card-notif-log">
        <CardHeader>
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <CardTitle className="text-base">Notification log</CardTitle>
              <CardDescription>Every WhatsApp + SMS send is recorded here for audit and deliverability tracking.</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => logQuery.refetch()} data-testid="button-refresh-log">
              <RefreshCw className="w-4 h-4 mr-1" /> Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <div>
              <Label className="text-xs uppercase tracking-wide text-secondary">Channel</Label>
              <Select value={filterChannel} onValueChange={(v) => { setPage(0); setFilterChannel(v); }}>
                <SelectTrigger data-testid="select-filter-channel"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All channels</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wide text-secondary">Kind</Label>
              <Select value={filterKind} onValueChange={(v) => { setPage(0); setFilterKind(v); }}>
                <SelectTrigger data-testid="select-filter-kind"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All kinds</SelectItem>
                  {NOTIF_KINDS.map((k) => (
                    <SelectItem key={k.value} value={k.value}>{k.label}</SelectItem>
                  ))}
                  <SelectItem value="test">Test</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wide text-secondary">Status</Label>
              <Select value={filterStatus} onValueChange={(v) => { setPage(0); setFilterStatus(v); }}>
                <SelectTrigger data-testid="select-filter-status"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="skipped">Skipped</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wide text-secondary">From</Label>
              <Input type="date" value={filterSince} onChange={(e) => { setPage(0); setFilterSince(e.target.value); }} data-testid="input-filter-since" />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wide text-secondary">To</Label>
              <Input type="date" value={filterUntil} onChange={(e) => { setPage(0); setFilterUntil(e.target.value); }} data-testid="input-filter-until" />
            </div>
          </div>

          {logQuery.isLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <table className="min-w-full text-sm">
                <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-secondary">
                  <tr>
                    <th className="py-2 px-3 font-medium">When</th>
                    <th className="py-2 px-3 font-medium">Channel</th>
                    <th className="py-2 px-3 font-medium">Kind</th>
                    <th className="py-2 px-3 font-medium">Order</th>
                    <th className="py-2 px-3 font-medium">Recipient</th>
                    <th className="py-2 px-3 font-medium">Status</th>
                    <th className="py-2 px-3 font-medium">Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {(logQuery.data?.rows || []).length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-6 px-3 text-center text-muted-foreground" data-testid="text-log-empty">No notifications match these filters yet.</td>
                    </tr>
                  ) : (
                    (logQuery.data?.rows || []).map((row) => (
                      <tr key={row.id} className="border-t" data-testid={`row-notif-${row.id}`}>
                        <td className="py-2 px-3 text-xs whitespace-nowrap">{fmtTime(row.createdAt)}</td>
                        <td className="py-2 px-3 text-xs">{channelLabel(row.channel)}</td>
                        <td className="py-2 px-3 text-xs">{kindLabel(row.kind)}</td>
                        <td className="py-2 px-3 text-xs">{row.orderId ?? "—"}</td>
                        <td className="py-2 px-3 text-xs">{row.recipientPhone || row.recipientEmail || "—"}</td>
                        <td className="py-2 px-3">
                          <span className={`inline-block px-2 py-0.5 text-xs font-semibold rounded border ${statusBadgeClass(row.status)}`}>{row.status}</span>
                        </td>
                        <td className="py-2 px-3 text-xs text-muted-foreground max-w-xs break-words">{row.reason || ""}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="text-xs text-muted-foreground">
              Showing {(logQuery.data?.rows.length || 0)} of {total} record{total === 1 ? "" : "s"} (page {page + 1} / {totalPages})
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0} data-testid="button-log-prev">Previous</Button>
              <Button variant="outline" size="sm" onClick={() => setPage((p) => (p + 1 < totalPages ? p + 1 : p))} disabled={page + 1 >= totalPages} data-testid="button-log-next">Next</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

export default NotificationsTab;
