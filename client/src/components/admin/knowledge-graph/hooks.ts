import { useMutation, useQueries, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { CsvPreview, Definition, Detail, EnablementReport, Entity, EntityType, Page, PublicProjection, PublicState, Rule } from "./types";

const base = "/api/admin/knowledge-graph";
const get = <T,>(url: string) => async () => {
  const response = await fetch(url, { credentials: "include" });
  if (!response.ok) throw new Error(`${response.status}: ${(await response.text()) || response.statusText}`);
  return response.json() as Promise<T>;
};
const qs = (params: Record<string, string | number | undefined>) => `${base}/entities?${new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined) as [string, string][]).toString()}`;
export const key = (...v: unknown[]) => ["knowledge-graph", ...v];
export function useDefinitions() { return useQuery({ queryKey: key("definitions"), queryFn: get<Definition[]>(`${base}/relationship-definitions`) }); }
export function useSummary() { return useQuery({ queryKey: key("summary"), queryFn: get<any>(`${base}/summary`) }); }
export function useEntities(filters: Record<string, string | number | undefined>) { return useQuery({ queryKey: key("entities", filters), queryFn: get<Page<Entity>>(qs(filters)) }); }
export function useTargetSearches(types: EntityType[], term: string) {
  const supported = types.filter(t => t !== "TIRTH" && t !== "TEMPLE");
  return useQueries({ queries: supported.map(type => ({ queryKey: key("target-search", type, term), queryFn: get<Page<Entity>>(qs({ type, term: term || undefined, page: 1, limit: 8 })) })) });
}
export function useDetail(ref: Pick<Entity, "type" | "id" | "discriminator"> | null) { const suffix = ref ? `${ref.type}/${ref.id}${ref.discriminator ? `?discriminator=${ref.discriminator}` : ""}` : ""; return useQuery({ queryKey: key("detail", suffix), queryFn: get<Detail>(`${base}/entities/${suffix}`), enabled: !!ref }); }
export function useOrphans(filters: Record<string, string | number | undefined>) { const search = new URLSearchParams(Object.entries(filters).filter(([, v]) => v !== undefined) as [string, string][]); return useQuery({ queryKey: key("orphans", filters), queryFn: get<Page<Entity>>(`${base}/orphans?${search}`) }); }
export function useHealth(filters: Record<string, string | number | undefined>) { const search = new URLSearchParams(Object.entries(filters).filter(([, v]) => v !== undefined) as [string, string][]); return useQuery({ queryKey: key("health", filters), queryFn: get<Page<{ entity: Entity; state: string; connectionCount: number }>>(`${base}/health?${search}`) }); }
export function useRules() { return useQuery({ queryKey: key("rules"), queryFn: get<Rule[]>(`${base}/quality-rules`) }); }
export function usePublicState() { return useQuery({ queryKey: key("public-state"), queryFn: get<PublicState>(`${base}/public-state`) }); }
export function useEnablement() { return useQuery({ queryKey: key("enablement"), queryFn: get<EnablementReport>(`${base}/public-state/enablement`) }); }
export function usePublicPreview(ref: Pick<Entity, "type" | "id" | "discriminator"> | null) {
  const suffix = ref ? `${ref.type}/${ref.id}${ref.discriminator ? `?discriminator=${encodeURIComponent(ref.discriminator)}` : ""}` : "";
  return useQuery({ queryKey: key("public-preview", suffix), queryFn: get<PublicProjection>(`${base}/preview/${suffix}`), enabled: !!ref });
}
export function usePublicStateMutation() {
  return useMutation({
    mutationFn: async (enabled: boolean) => {
      const response = await fetch(`${base}/public-state`, { method: "PATCH", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ enabled }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) { const error: Error & { status?: number; report?: EnablementReport } = new Error(data.message || response.statusText); error.status = response.status; error.report = data.report; throw error; }
      return data as { state: PublicState; report?: EnablementReport };
    },
    onSuccess: invalidate,
  });
}
export function useCsvPreview() {
  return useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData(); form.append("file", file);
      const response = await fetch(`${base}/relationships/csv/preview`, { method: "POST", credentials: "include", body: form });
      if (!response.ok) throw new Error(`${response.status}: ${(await response.text()) || response.statusText}`);
      return response.json() as Promise<CsvPreview>;
    },
  });
}
export function useCsvApply() { return useMutation({ mutationFn: (previewToken: string) => apiRequest("POST", `${base}/relationships/csv/apply`, { previewToken }).then(async r => { if (!r.ok) throw new Error((await r.json().catch(() => ({}))).message || r.statusText); return r.json().catch(() => null); }), onSuccess: invalidate }); }
const invalidate = () => queryClient.invalidateQueries({ queryKey: key() });
export function useGraphMutation(method: "POST" | "PATCH" | "DELETE", path: string) { return useMutation({ mutationFn: (data?: unknown) => apiRequest(method, `${base}${path}`, data).then(r => r.json().catch(() => null)), onSuccess: invalidate }); }