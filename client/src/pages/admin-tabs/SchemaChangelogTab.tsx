import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  GitCommit, Plus, Pencil, Trash2, X, Check, RefreshCw, ChevronDown, ChevronUp,
  Table2, Layers, Zap, FileText, Settings2, HelpCircle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { createFetcher } from "../admin-shared";

type ChangeType = "add_table" | "add_column" | "add_index" | "modify" | "remove" | "other";
type Entry = {
  id: number;
  changeDate: string;
  description: string;
  changeType: string;
  tableName: string | null;
  author: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

const CHANGE_TYPES: { value: ChangeType; label: string; icon: typeof Plus }[] = [
  { value: "add_table",  label: "New table",    icon: Table2 },
  { value: "add_column", label: "New column",   icon: Layers },
  { value: "add_index",  label: "New index",    icon: Zap },
  { value: "modify",     label: "Modify",       icon: Settings2 },
  { value: "remove",     label: "Remove",       icon: Trash2 },
  { value: "other",      label: "Other",        icon: FileText },
];

const TYPE_COLORS: Record<string, string> = {
  add_table:  "bg-emerald-100 text-emerald-900",
  add_column: "bg-primary/10 text-primary",
  add_index:  "bg-amber-100 text-amber-900",
  modify:     "bg-secondary/30 text-foreground",
  remove:     "bg-red-100 text-red-900",
  other:      "bg-muted text-muted-foreground",
};

function typeLabel(t: string) {
  return CHANGE_TYPES.find((c) => c.value === t)?.label ?? t;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

const EMPTY_FORM = {
  changeDate: today(),
  description: "",
  changeType: "other" as ChangeType,
  tableName: "",
  author: "",
  notes: "",
};

function EntryForm({
  initial,
  onSave,
  onCancel,
  isSaving,
}: {
  initial: typeof EMPTY_FORM;
  onSave: (v: typeof EMPTY_FORM) => void;
  onCancel: () => void;
  isSaving: boolean;
}) {
  const [form, setForm] = useState(initial);
  const [showNotes, setShowNotes] = useState(!!initial.notes);
  const set = (k: keyof typeof EMPTY_FORM, v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="border rounded-md bg-muted/30 p-4 space-y-3" data-testid="form-changelog-entry">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Date</label>
          <Input
            type="date"
            value={form.changeDate}
            onChange={(e) => set("changeDate", e.target.value)}
            data-testid="input-changelog-date"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Type of change</label>
          <Select value={form.changeType} onValueChange={(v) => set("changeType", v)}>
            <SelectTrigger data-testid="select-changelog-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CHANGE_TYPES.map((ct) => (
                <SelectItem key={ct.value} value={ct.value}>{ct.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Description <span className="text-destructive">*</span>
        </label>
        <Input
          placeholder="e.g. Added email column to users table"
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          data-testid="input-changelog-description"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Table name <span className="text-muted-foreground/60">(optional)</span>
          </label>
          <Input
            placeholder="e.g. users"
            value={form.tableName}
            onChange={(e) => set("tableName", e.target.value)}
            data-testid="input-changelog-table"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Who made this change <span className="text-muted-foreground/60">(optional)</span>
          </label>
          <Input
            placeholder="e.g. Rahul / Replit Agent"
            value={form.author}
            onChange={(e) => set("author", e.target.value)}
            data-testid="input-changelog-author"
          />
        </div>
      </div>

      {!showNotes ? (
        <button
          type="button"
          className="text-xs text-muted-foreground flex items-center gap-1 hover:text-foreground transition-colors"
          onClick={() => setShowNotes(true)}
        >
          <ChevronDown className="w-3.5 h-3.5" /> Add longer notes
        </button>
      ) : (
        <div className="space-y-1">
          <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Notes <span className="text-muted-foreground/60">(optional — any extra context)</span>
          </label>
          <textarea
            className="w-full min-h-[72px] rounded-md border border-input bg-background px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="Why was this change made? Any migration notes, gotchas, or rollback instructions…"
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
            data-testid="textarea-changelog-notes"
          />
        </div>
      )}

      <div className="flex items-center justify-end gap-2 pt-1">
        <Button variant="outline" size="sm" onClick={onCancel} data-testid="button-changelog-cancel">
          <X className="w-3.5 h-3.5 mr-1" /> Cancel
        </Button>
        <Button
          size="sm"
          onClick={() => onSave(form)}
          disabled={!form.description.trim() || !form.changeDate || isSaving}
          data-testid="button-changelog-save"
        >
          <Check className="w-3.5 h-3.5 mr-1" />
          {isSaving ? "Saving…" : "Save entry"}
        </Button>
      </div>
    </div>
  );
}

function SchemaChangelogTab({ adminToken }: { adminToken?: string }) {
  const { toast } = useToast();
  const fetcher = createFetcher(adminToken);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<typeof EMPTY_FORM | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const { data: entries = [], isLoading, refetch, isFetching } = useQuery<Entry[]>({
    queryKey: ["/api/admin/schema-changelog"],
    queryFn: () => fetcher("/api/admin/schema-changelog"),
    staleTime: 30_000,
  });

  const headers = adminToken ? { "x-admin-token": adminToken, "content-type": "application/json" } : { "content-type": "application/json" };

  const createMutation = useMutation<Entry, Error, typeof EMPTY_FORM>({
    mutationFn: async (data) => {
      const r = await fetch("/api/admin/schema-changelog", {
        method: "POST",
        headers,
        body: JSON.stringify(data),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.message || "Failed");
      return j;
    },
    onSuccess: () => {
      toast({ title: "Entry added", description: "Schema change logged successfully." });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/schema-changelog"] });
      setShowForm(false);
    },
    onError: (e) => toast({ title: "Failed to save", description: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation<Entry, Error, { id: number; data: typeof EMPTY_FORM }>({
    mutationFn: async ({ id, data }) => {
      const r = await fetch(`/api/admin/schema-changelog/${id}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify(data),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.message || "Failed");
      return j;
    },
    onSuccess: () => {
      toast({ title: "Entry updated" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/schema-changelog"] });
      setEditingId(null);
      setEditForm(null);
    },
    onError: (e) => toast({ title: "Failed to update", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation<void, Error, number>({
    mutationFn: async (id) => {
      const r = await fetch(`/api/admin/schema-changelog/${id}`, {
        method: "DELETE",
        headers: adminToken ? { "x-admin-token": adminToken } : {},
      });
      if (!r.ok) { const j = await r.json().catch(() => ({})); throw new Error(j.message || "Failed"); }
    },
    onSuccess: () => {
      toast({ title: "Entry deleted" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/schema-changelog"] });
    },
    onError: (e) => toast({ title: "Failed to delete", description: e.message, variant: "destructive" }),
  });

  const startEdit = (entry: Entry) => {
    setEditingId(entry.id);
    setEditForm({
      changeDate: entry.changeDate,
      description: entry.description,
      changeType: entry.changeType as ChangeType,
      tableName: entry.tableName || "",
      author: entry.author || "",
      notes: entry.notes || "",
    });
    setShowForm(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-serif text-primary flex items-center gap-2" data-testid="page-title-schema-changelog">
            <GitCommit className="w-7 h-7" />
            Schema Changelog
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl mt-1">
            A plain-English record of every database structure change. Stored in the database and pushed to GitHub
            via <span className="font-mono">shared/schema.ts</span>. Anyone on the team can see exactly what changed and why.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            data-testid="button-changelog-refresh"
          >
            <RefreshCw className={`w-4 h-4 mr-1.5 ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          {!showForm && (
            <Button
              size="sm"
              onClick={() => { setShowForm(true); setEditingId(null); }}
              data-testid="button-changelog-add"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Log a change
            </Button>
          )}
        </div>
      </div>

      {/* Add form */}
      {showForm && (
        <EntryForm
          initial={EMPTY_FORM}
          onSave={(v) => createMutation.mutate(v)}
          onCancel={() => setShowForm(false)}
          isSaving={createMutation.isPending}
        />
      )}

      {/* Help card */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <HelpCircle className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div className="text-xs text-muted-foreground space-y-1">
              <p>
                <span className="font-semibold text-foreground">When to add an entry:</span> any time a developer edits
                <span className="font-mono"> shared/schema.ts</span> — adding a table, column, or index, or making a structural change.
              </p>
              <p>
                <span className="font-semibold text-foreground">Why it matters:</span> this log + the
                <span className="font-mono"> DATABASE.md</span> file in the repo give any future developer (or AI agent)
                a full picture of how the database evolved, without needing to diff Git history.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary badges */}
      {entries.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground">{entries.length} entr{entries.length === 1 ? "y" : "ies"} ·</span>
          {CHANGE_TYPES.map((ct) => {
            const n = entries.filter((e) => e.changeType === ct.value).length;
            if (!n) return null;
            return (
              <Badge key={ct.value} variant="secondary" className={`text-[10px] ${TYPE_COLORS[ct.value]}`}>
                {typeLabel(ct.value)}: {n}
              </Badge>
            );
          })}
        </div>
      )}

      {/* Entries list */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full rounded-md" />)}
        </div>
      ) : entries.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center space-y-3">
            <GitCommit className="w-8 h-8 text-muted-foreground mx-auto" />
            <div className="text-sm font-medium text-foreground">No entries yet</div>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Click <span className="font-medium text-foreground">Log a change</span> to record the first schema change.
              Start with the 30 database indexes that were added on 15 May 2026.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="border rounded-md bg-card overflow-hidden">
          <div className="grid grid-cols-12 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground bg-muted px-4 py-2 gap-2">
            <div className="col-span-2">Date</div>
            <div className="col-span-2">Type</div>
            <div className="col-span-4">Description</div>
            <div className="col-span-2">Table / Author</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>
          <div className="divide-y divide-secondary/60">
            {entries.map((entry) => (
              <div key={entry.id}>
                {editingId === entry.id && editForm ? (
                  <div className="p-3">
                    <EntryForm
                      initial={editForm}
                      onSave={(v) => updateMutation.mutate({ id: entry.id, data: v })}
                      onCancel={() => { setEditingId(null); setEditForm(null); }}
                      isSaving={updateMutation.isPending}
                    />
                  </div>
                ) : (
                  <>
                    <div
                      className="grid grid-cols-12 px-4 py-3 text-xs items-start gap-2"
                      data-testid={`changelog-row-${entry.id}`}
                    >
                      <div className="col-span-2 font-mono text-muted-foreground pt-0.5">
                        {entry.changeDate}
                      </div>
                      <div className="col-span-2 pt-0.5">
                        <Badge
                          variant="secondary"
                          className={`text-[10px] font-medium ${TYPE_COLORS[entry.changeType] || TYPE_COLORS.other}`}
                          data-testid={`badge-change-type-${entry.id}`}
                        >
                          {typeLabel(entry.changeType)}
                        </Badge>
                      </div>
                      <div className="col-span-4 text-foreground leading-relaxed">
                        {entry.description}
                        {entry.notes && (
                          <button
                            className="ml-2 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                            onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
                            data-testid={`button-expand-${entry.id}`}
                          >
                            {expandedId === entry.id ? <ChevronUp className="w-3 h-3 inline" /> : <ChevronDown className="w-3 h-3 inline" />} notes
                          </button>
                        )}
                      </div>
                      <div className="col-span-2 text-muted-foreground space-y-0.5">
                        {entry.tableName && (
                          <div className="font-mono text-[11px] flex items-center gap-1">
                            <Table2 className="w-3 h-3 flex-shrink-0" />{entry.tableName}
                          </div>
                        )}
                        {entry.author && (
                          <div className="text-[11px] text-muted-foreground/80">{entry.author}</div>
                        )}
                      </div>
                      <div className="col-span-2 flex items-center justify-end gap-1">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => startEdit(entry)}
                          data-testid={`button-edit-${entry.id}`}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            if (confirm("Delete this changelog entry?")) deleteMutation.mutate(entry.id);
                          }}
                          disabled={deleteMutation.isPending && deleteMutation.variables === entry.id}
                          data-testid={`button-delete-${entry.id}`}
                        >
                          <Trash2 className="w-3.5 h-3.5 text-destructive" />
                        </Button>
                      </div>
                    </div>
                    {expandedId === entry.id && entry.notes && (
                      <div className="px-4 pb-3 -mt-1">
                        <div className="bg-muted rounded p-3 text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">
                          {entry.notes}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default SchemaChangelogTab;
