import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Sparkles, Wallet, Plus, Zap, RefreshCw, Trash2, Pencil, CheckCircle2,
  XCircle, Power, ExternalLink, Wand2, Eye, EyeOff,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { providersByKind, getProvider, type ProviderDef, type ProviderKind } from "@shared/api-providers";

interface CredentialRow {
  id: number;
  kind: ProviderKind;
  provider: string;
  label: string;
  mode: "test" | "live";
  isActive: boolean;
  masked: Record<string, string>;
  lastTestedAt: string | null;
  lastTestResult: { ok: boolean; message: string } | null;
  createdAt: string;
  updatedAt: string;
}

interface ProvidersTabProps { kind: ProviderKind; }

function adminToken() {
  return typeof window !== "undefined" ? localStorage.getItem("adminToken") || "" : "";
}

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "x-admin-token": adminToken(),
      ...(init?.headers || {}),
    },
  });
  if (!res.ok) {
    let msg = `Request failed (${res.status})`;
    try { const j = await res.json(); msg = j.message || msg; } catch {}
    throw new Error(msg);
  }
  return res.json();
}

export default function ProvidersTab({ kind }: ProvidersTabProps) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [editing, setEditing] = useState<CredentialRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);

  const providers = providersByKind(kind);
  const { data: rows, isLoading } = useQuery<CredentialRow[]>({
    queryKey: ["/api/admin/api-credentials", kind],
    queryFn: () => api(`/api/admin/api-credentials?kind=${kind}`),
  });

  const title = kind === "payment" ? "Payment Gateways" : "AI Providers";
  const subtitle = kind === "payment"
    ? "Add Razorpay, Stripe, Cashfree, PayU, PhonePe, Paytm. One active gateway per provider drives live checkout."
    : "Add OpenAI, Gemini, Anthropic, Mistral, OpenRouter. The active key for each provider feeds AI features site-wide.";
  const Icon = kind === "payment" ? Wallet : Sparkles;

  const grouped = useMemo(() => {
    const map = new Map<string, CredentialRow[]>();
    for (const p of providers) map.set(p.id, []);
    for (const row of rows || []) {
      if (!map.has(row.provider)) map.set(row.provider, []);
      map.get(row.provider)!.push(row);
    }
    return map;
  }, [rows, providers]);

  const activate = async (id: number) => {
    setBusyId(id);
    try {
      await api(`/api/admin/api-credentials/${id}/activate`, { method: "POST" });
      toast({ title: "Activated", description: "This credential is now live." });
      qc.invalidateQueries({ queryKey: ["/api/admin/api-credentials", kind] });
    } catch (e: any) {
      toast({ title: "Activation failed", description: e.message, variant: "destructive" });
    } finally { setBusyId(null); }
  };

  const deactivate = async (id: number) => {
    setBusyId(id);
    try {
      await api(`/api/admin/api-credentials/${id}/deactivate`, { method: "POST" });
      toast({ title: "Deactivated" });
      qc.invalidateQueries({ queryKey: ["/api/admin/api-credentials", kind] });
    } catch (e: any) {
      toast({ title: "Failed", description: e.message, variant: "destructive" });
    } finally { setBusyId(null); }
  };

  const test = async (id: number) => {
    setBusyId(id);
    try {
      const r = await api<{ ok: boolean; message: string }>(`/api/admin/api-credentials/${id}/test`, { method: "POST" });
      toast({
        title: r.ok ? "Test passed" : "Test failed",
        description: r.message,
        variant: r.ok ? "default" : "destructive",
      });
      qc.invalidateQueries({ queryKey: ["/api/admin/api-credentials", kind] });
    } catch (e: any) {
      toast({ title: "Test error", description: e.message, variant: "destructive" });
    } finally { setBusyId(null); }
  };

  const remove = async (id: number) => {
    if (!confirm("Delete this credential? This cannot be undone.")) return;
    setBusyId(id);
    try {
      await api(`/api/admin/api-credentials/${id}`, { method: "DELETE" });
      toast({ title: "Deleted" });
      qc.invalidateQueries({ queryKey: ["/api/admin/api-credentials", kind] });
    } catch (e: any) {
      toast({ title: "Delete failed", description: e.message, variant: "destructive" });
    } finally { setBusyId(null); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-md bg-primary/10 text-primary">
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-3xl font-serif text-primary" data-testid={`page-title-${kind}`}>{title}</h1>
            <p className="text-sm text-muted-foreground max-w-2xl">{subtitle}</p>
          </div>
        </div>
        <Button onClick={() => setCreating(true)} data-testid="btn-add-credential">
          <Plus className="w-4 h-4" /> Add credential
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}</div>
      ) : (
        <div className="space-y-4">
          {providers.map((def) => {
            const items = grouped.get(def.id) || [];
            const hasActive = items.some((i) => i.isActive);
            return (
              <Card key={def.id} className="bg-card border-border" data-testid={`card-provider-${def.id}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <CardTitle className="text-base text-primary font-serif">{def.label}</CardTitle>
                      <CardDescription className="text-xs">
                        {items.length === 0 ? "Not configured" : `${items.length} credential${items.length > 1 ? "s" : ""}`}
                        {hasActive && <span className="ml-2 text-emerald-700">• Active</span>}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" asChild>
                        <a href={def.docs} target="_blank" rel="noreferrer"><ExternalLink className="w-3 h-3" /> Docs</a>
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                {items.length > 0 && (
                  <CardContent className="space-y-2">
                    {items.map((row) => (
                      <div
                        key={row.id}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border p-3 bg-background"
                        data-testid={`row-credential-${row.id}`}
                      >
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium" data-testid={`text-label-${row.id}`}>{row.label}</span>
                            <Badge className={row.mode === "live" ? "bg-amber-100 text-amber-900" : "bg-muted text-muted-foreground"}>
                              {row.mode}
                            </Badge>
                            {row.isActive && (
                              <Badge className="bg-emerald-100 text-emerald-900">
                                <CheckCircle2 className="w-3 h-3" /> Active
                              </Badge>
                            )}
                            {row.lastTestResult && (
                              <Badge className={row.lastTestResult.ok ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"}>
                                {row.lastTestResult.ok ? "✓" : "✗"} {row.lastTestResult.message}
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs font-mono text-muted-foreground truncate">
                            {Object.entries(row.masked).map(([k, v]) => `${k}: ${v}`).join("  ·  ")}
                          </div>
                        </div>
                        <div className="flex gap-1 flex-wrap">
                          <Button size="sm" variant="outline" onClick={() => test(row.id)} disabled={busyId === row.id} data-testid={`btn-test-${row.id}`}>
                            {busyId === row.id ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />} Test
                          </Button>
                          {row.isActive ? (
                            <Button size="sm" variant="outline" onClick={() => deactivate(row.id)} disabled={busyId === row.id} data-testid={`btn-deactivate-${row.id}`}>
                              <Power className="w-3 h-3" /> Deactivate
                            </Button>
                          ) : (
                            <Button size="sm" onClick={() => activate(row.id)} disabled={busyId === row.id} data-testid={`btn-activate-${row.id}`}>
                              <Power className="w-3 h-3" /> Activate
                            </Button>
                          )}
                          <Button size="sm" variant="outline" onClick={() => setEditing(row)} data-testid={`btn-edit-${row.id}`}>
                            <Pencil className="w-3 h-3" /> Edit
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => remove(row.id)} disabled={busyId === row.id} data-testid={`btn-delete-${row.id}`}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <Card className="bg-muted border-border">
        <CardContent className="pt-6 text-xs text-muted-foreground space-y-1">
          <p><strong>Activation</strong> writes the credential into the running server's environment. Existing checkout / AI calls pick it up immediately — no restart needed.</p>
          <p><strong>Encryption.</strong> All secrets are stored AES-256-GCM encrypted, derived from <code>SESSION_SECRET</code>. The masked preview above is the only readable form after save.</p>
          <p><strong>Test mode keys</strong> only work against sandbox endpoints. Switch to <em>Live</em> mode and add a separate live credential before going to production.</p>
        </CardContent>
      </Card>

      {(creating || editing) && (
        <CredentialEditor
          kind={kind}
          editing={editing}
          providers={providers}
          onClose={() => { setCreating(false); setEditing(null); }}
          onSaved={() => { setCreating(false); setEditing(null); qc.invalidateQueries({ queryKey: ["/api/admin/api-credentials", kind] }); }}
        />
      )}
    </div>
  );
}

// =====================================================================
// Editor dialog — manual fields + AI auto-detect from a pasted secret
// =====================================================================

function CredentialEditor({
  kind, editing, providers, onClose, onSaved,
}: {
  kind: ProviderKind;
  editing: CredentialRow | null;
  providers: ProviderDef[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const { toast } = useToast();
  const [providerId, setProviderId] = useState<string>(editing?.provider || providers[0]?.id || "");
  const [label, setLabel] = useState(editing?.label || "");
  const [mode, setMode] = useState<"test" | "live">(editing?.mode || "test");
  const [fields, setFields] = useState<Record<string, string>>({});
  const [showSecret, setShowSecret] = useState<Record<string, boolean>>({});
  const [paste, setPaste] = useState("");
  const [detecting, setDetecting] = useState(false);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activate, setActivate] = useState(!editing); // default ON for new

  const def = getProvider(providerId);

  useEffect(() => {
    if (!def) return;
    // When provider changes, reset fields to empty (or to masked placeholder when editing)
    setFields((prev) => {
      const next: Record<string, string> = {};
      for (const f of def.fields) next[f.key] = prev[f.key] || "";
      return next;
    });
  }, [providerId]);

  useEffect(() => {
    if (editing && !label) setLabel(`${getProvider(editing.provider)?.label || editing.provider} (${editing.mode})`);
  }, [editing]);

  const runDetect = async () => {
    if (!paste.trim()) return;
    setDetecting(true);
    try {
      const r = await api<any>("/api/admin/api-credentials/detect", {
        method: "POST", body: JSON.stringify({ secret: paste.trim() }),
      });
      if (r.provider) {
        const matchedDef = getProvider(r.provider);
        if (matchedDef && matchedDef.kind !== kind) {
          toast({
            title: "Wrong section",
            description: `That key is a ${matchedDef.kind} credential — switch to the ${matchedDef.kind === "payment" ? "Payment Gateways" : "AI Providers"} tab.`,
            variant: "destructive",
          });
          setDetecting(false);
          return;
        }
        setProviderId(r.provider);
        if (r.mode) setMode(r.mode);
        if (matchedDef) {
          setFields((prev) => ({ ...prev, [r.field || "apiKey"]: paste.trim() }));
          if (!label) setLabel(`${matchedDef.label} (${r.mode || mode})`);
        }
        toast({
          title: r.confidence === "high" ? "Detected!" : "Best guess",
          description: `${r.reason}. Fill any remaining required fields, then save.`,
        });
        setPaste("");
      } else {
        toast({ title: "Could not auto-detect", description: r.reason, variant: "destructive" });
      }
    } catch (e: any) {
      toast({ title: "Detect failed", description: e.message, variant: "destructive" });
    } finally { setDetecting(false); }
  };

  const runTestDraft = async () => {
    if (!def) return;
    setTesting(true);
    try {
      const r = await api<{ ok: boolean; message: string }>("/api/admin/api-credentials/test-draft", {
        method: "POST", body: JSON.stringify({ provider: providerId, fields }),
      });
      toast({
        title: r.ok ? "Test passed" : "Test failed",
        description: r.message,
        variant: r.ok ? "default" : "destructive",
      });
    } catch (e: any) {
      toast({ title: "Test error", description: e.message, variant: "destructive" });
    } finally { setTesting(false); }
  };

  const save = async () => {
    if (!def) return;
    if (!label.trim()) return toast({ title: "Label required", variant: "destructive" });
    setSaving(true);
    try {
      if (editing) {
        // Strip empty fields so we don't overwrite stored secrets with blank
        const fieldsToSend: Record<string, string> = {};
        for (const [k, v] of Object.entries(fields)) if (v.trim()) fieldsToSend[k] = v.trim();
        await api(`/api/admin/api-credentials/${editing.id}`, {
          method: "PATCH",
          body: JSON.stringify({ label: label.trim(), mode, fields: fieldsToSend }),
        });
        toast({ title: "Updated" });
      } else {
        await api("/api/admin/api-credentials", {
          method: "POST",
          body: JSON.stringify({ kind, provider: providerId, label: label.trim(), mode, fields, activate }),
        });
        toast({ title: "Saved" + (activate ? " & activated" : "") });
      }
      onSaved();
    } catch (e: any) {
      toast({ title: "Save failed", description: e.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit credential" : "Add credential"}</DialogTitle>
          <DialogDescription>
            {editing
              ? "Leave any field blank to keep its existing encrypted value."
              : "Paste a key for AI auto-detect, or fill the form manually."}
          </DialogDescription>
        </DialogHeader>

        {!editing && (
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-serif text-primary flex items-center gap-2">
                <Wand2 className="w-4 h-4" /> AI auto-detect
              </CardTitle>
              <CardDescription className="text-xs">
                Paste an API key, secret, or webhook secret — we'll identify the provider, mode, and fill the form.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Textarea
                value={paste}
                onChange={(e) => setPaste(e.target.value)}
                placeholder="sk-proj-... / rzp_test_... / AIza... / sk-ant-... / sk_live_..."
                rows={2}
                className="font-mono text-xs"
                data-testid="input-detect-paste"
              />
              <Button
                onClick={runDetect}
                disabled={!paste.trim() || detecting}
                size="sm"
                data-testid="btn-detect"
              >
                {detecting ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
                Detect & fill
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="provider">Provider</Label>
            <Select value={providerId} onValueChange={setProviderId} disabled={!!editing}>
              <SelectTrigger id="provider" data-testid="select-provider"><SelectValue /></SelectTrigger>
              <SelectContent>
                {providers.map((p) => <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="mode">Mode</Label>
            <Select value={mode} onValueChange={(v) => setMode(v as any)}>
              <SelectTrigger id="mode" data-testid="select-mode"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="test">Test / Sandbox</SelectItem>
                <SelectItem value="live">Live / Production</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="label">Label</Label>
          <Input
            id="label"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder={`e.g. ${def?.label || "Provider"} ${mode === "test" ? "Sandbox" : "Production"}`}
            data-testid="input-label"
          />
        </div>

        {def && (
          <div className="space-y-3">
            {def.fields.map((f) => {
              const isShown = showSecret[f.key];
              return (
                <div key={f.key} className="space-y-1.5">
                  <Label htmlFor={`f-${f.key}`} className="flex items-center gap-2">
                    {f.label}
                    {!f.optional && <span className="text-red-700 text-xs">*</span>}
                    {f.optional && <span className="text-muted-foreground text-xs">(optional)</span>}
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id={`f-${f.key}`}
                      type={f.secret && !isShown ? "password" : "text"}
                      value={fields[f.key] || ""}
                      onChange={(e) => setFields({ ...fields, [f.key]: e.target.value })}
                      placeholder={editing ? `(unchanged: ${editing.masked[f.key] || "—"})` : f.placeholder || ""}
                      className="font-mono text-sm"
                      data-testid={`input-field-${f.key}`}
                    />
                    {f.secret && (
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        onClick={() => setShowSecret({ ...showSecret, [f.key]: !isShown })}
                        data-testid={`btn-show-${f.key}`}
                      >
                        {isShown ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!editing && (
          <label className="flex items-center gap-2 text-sm cursor-pointer" data-testid="label-activate-on-save">
            <input
              type="checkbox"
              checked={activate}
              onChange={(e) => setActivate(e.target.checked)}
              className="h-4 w-4"
              data-testid="checkbox-activate-on-save"
            />
            Activate immediately (deactivates any other {def?.label || "provider"} credential)
          </label>
        )}

        <DialogFooter className="flex-wrap gap-2">
          <Button variant="outline" onClick={runTestDraft} disabled={testing || !def} data-testid="btn-test-draft">
            {testing ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />} Test before save
          </Button>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={saving} data-testid="btn-save-credential">
            {saving ? <RefreshCw className="w-3 h-3 animate-spin" /> : null}
            {editing ? "Save changes" : "Save credential"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
