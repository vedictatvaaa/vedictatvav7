import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Send, Eye, Mail } from "lucide-react";

interface NewsletterCampaign {
  id: number;
  subject: string;
  previewText: string | null;
  bodyHtml: string;
  bodyText: string | null;
  segment: string;
  recipientCount: number;
  sentCount: number;
  failureCount: number;
  status: string;
  createdAt: string;
  sentAt: string | null;
}

const composeSchema = z.object({
  subject: z.string().min(3, "Subject is required"),
  previewText: z.string().optional(),
  bodyHtml: z.string().min(10, "Email body is required"),
  segment: z.enum(["all", "last_30_days", "csv"]),
  csvEmails: z.string().optional(),
});

type ComposeValues = z.infer<typeof composeSchema>;

export function EmailMarketingTab({ adminToken }: { adminToken?: string }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);

  const headers: Record<string, string> = adminToken ? { "x-admin-token": adminToken } : {};
  const fetcher = (url: string) =>
    fetch(url, { headers }).then((r) => {
      if (!r.ok) throw new Error("Fetch failed");
      return r.json();
    });

  const { data, isLoading } = useQuery<{ campaigns: NewsletterCampaign[] }>({
    queryKey: ["/api/admin/newsletter/campaigns"],
    queryFn: () => fetcher("/api/admin/newsletter/campaigns"),
    // Poll every 3s while any campaign is in flight so admins see live
    // sent/failure counters update without manual refresh.
    refetchInterval: (query) => {
      const campaigns = (query.state.data as { campaigns?: NewsletterCampaign[] } | undefined)?.campaigns || [];
      return campaigns.some((c) => c.status === "sending" || c.status === "queued") ? 3000 : false;
    },
  });

  const form = useForm<ComposeValues>({
    resolver: zodResolver(composeSchema),
    defaultValues: { subject: "", previewText: "", bodyHtml: "", segment: "all", csvEmails: "" },
  });

  const segment = form.watch("segment");

  const createAndSendMut = useMutation({
    mutationFn: async (values: ComposeValues) => {
      const create = await fetch("/api/admin/newsletter/campaigns", {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: values.subject,
          previewText: values.previewText || null,
          bodyHtml: values.bodyHtml,
          bodyText: null,
          segment: values.segment,
        }),
      });
      if (!create.ok) throw new Error((await create.json()).message || "Failed to create campaign");
      const { campaign } = await create.json();
      const emails = values.segment === "csv"
        ? (values.csvEmails || "").split(/[\s,;]+/).map((s) => s.trim()).filter(Boolean)
        : [];
      const send = await fetch(`/api/admin/newsletter/campaigns/${campaign.id}/send`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ segment: values.segment, emails }),
      });
      if (!send.ok) throw new Error((await send.json()).message || "Send failed");
      return send.json();
    },
    onSuccess: (r: { queued: number }) => {
      toast({ title: "Broadcast queued", description: `Sending to ${r.queued} subscriber(s).` });
      form.reset({ subject: "", previewText: "", bodyHtml: "", segment: "all", csvEmails: "" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/newsletter/campaigns"] });
    },
    onError: (e: any) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  const previewMut = useMutation({
    mutationFn: async (values: ComposeValues) => {
      const res = await fetch("/api/admin/newsletter/preview", {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: values.subject,
          previewText: values.previewText || null,
          bodyHtml: values.bodyHtml,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).message || "Preview failed");
      return res.json() as Promise<{ subject: string; html: string; text: string | null }>;
    },
    onSuccess: (r) => setPreviewHtml(r.html),
    onError: (e: any) => toast({ title: "Preview failed", description: e.message, variant: "destructive" }),
  });

  const onSubmit = (values: ComposeValues) => createAndSendMut.mutate(values);
  const onPreview = () => previewMut.mutate(form.getValues());

  const campaigns = data?.campaigns || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif text-primary mb-1" data-testid="page-title-email-marketing">Email Marketing</h1>
        <p className="text-sm text-muted-foreground">
          Cart abandonment sequence and welcome emails are sent automatically every 15 minutes. Compose a broadcast here to reach your newsletter subscribers.
        </p>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Mail className="h-5 w-5 text-primary" /> Compose broadcast</CardTitle>
          <CardDescription>Sends to subscribers who have not unsubscribed. Each email includes a one-click unsubscribe link.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="subject" render={({ field }) => (
                <FormItem>
                  <FormLabel>Subject</FormLabel>
                  <FormControl><Input placeholder="A blessing from Vedic Tatva" {...field} data-testid="input-subject" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="previewText" render={({ field }) => (
                <FormItem>
                  <FormLabel>Preview text (optional)</FormLabel>
                  <FormControl><Input placeholder="Shown next to the subject in the inbox" {...field} data-testid="input-preview-text" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="bodyHtml" render={({ field }) => (
                <FormItem>
                  <FormLabel>Email body (HTML)</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={10}
                      placeholder={'<p>Namaste,</p>\n<p>This week we are honoring...</p>'}
                      className="font-mono text-sm"
                      {...field}
                      data-testid="input-body-html"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="segment" render={({ field }) => (
                <FormItem>
                  <FormLabel>Send to</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-segment"><SelectValue /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="all">All active subscribers</SelectItem>
                      <SelectItem value="last_30_days">Subscribers from the last 30 days</SelectItem>
                      <SelectItem value="csv">Custom list (paste emails)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              {segment === "csv" && (
                <FormField control={form.control} name="csvEmails" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Recipient emails</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={4}
                        placeholder="one@example.com, two@example.com"
                        {...field}
                        data-testid="input-csv-emails"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              )}

              <div className="flex flex-wrap items-center gap-3">
                <Button type="submit" disabled={createAndSendMut.isPending} data-testid="button-send-broadcast">
                  <Send className="h-4 w-4 mr-2" />
                  {createAndSendMut.isPending ? "Queuing..." : "Send broadcast"}
                </Button>
                <Button type="button" variant="outline" onClick={onPreview} disabled={previewMut.isPending} data-testid="button-preview">
                  <Eye className="h-4 w-4 mr-2" />
                  {previewMut.isPending ? "Loading..." : "Preview"}
                </Button>
              </div>
            </form>
          </Form>

          {previewHtml && (
            <div className="mt-6 space-y-2">
              <Label>Preview</Label>
              <div className="rounded-md border border-border overflow-hidden bg-white">
                <iframe
                  title="Email preview"
                  srcDoc={previewHtml}
                  className="w-full h-[480px] bg-white"
                  data-testid="iframe-email-preview"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Recent campaigns</CardTitle>
          <CardDescription>Each row tracks how many subscribers received the email and any failures.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-md" />)}</div>
          ) : campaigns.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground" data-testid="text-empty-campaigns">
              No campaigns sent yet.
            </div>
          ) : (
            <div className="space-y-3">
              {campaigns.map((c) => (
                <div
                  key={c.id}
                  className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-md border border-border"
                  data-testid={`campaign-row-${c.id}`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-foreground truncate" data-testid={`text-campaign-subject-${c.id}`}>{c.subject}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {new Date(c.createdAt).toLocaleString()} &middot; segment: {c.segment}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-muted-foreground">Recipients: <strong className="text-foreground" data-testid={`text-campaign-recipients-${c.id}`}>{c.recipientCount}</strong></span>
                    <span className="text-muted-foreground">Sent: <strong className="text-emerald-700" data-testid={`text-campaign-sent-${c.id}`}>{c.sentCount}</strong></span>
                    {c.failureCount > 0 && (
                      <span className="text-muted-foreground">Failed: <strong className="text-red-700">{c.failureCount}</strong></span>
                    )}
                    <span className="text-xs px-2 py-1 rounded-full bg-muted capitalize" data-testid={`text-campaign-status-${c.id}`}>{c.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
