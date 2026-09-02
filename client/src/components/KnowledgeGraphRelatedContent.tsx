import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { isSafeKnowledgeGraphPath } from "@/lib/knowledge-graph-path";

type Item = { type: string; name: string; url: string; summary: Record<string, string | number | boolean | null>; relationshipLabel: string };
type Projection = { groups: { relationshipType: string; label: string; items: Item[] }[] };
export function KnowledgeGraphRelatedContent({ type, id }: { type: "PRODUCT" | "ARTICLE" | "PANDIT"; id?: number }) {
  const query = useQuery<Projection>({
    queryKey: ["knowledge-graph-related", type, id],
    enabled: Number.isInteger(id) && (id || 0) > 0,
    retry: false,
    queryFn: async () => {
      const response = await fetch(`/api/knowledge-graph/related/${type}/${id}`, { credentials: "include" });
      if (!response.ok) throw new Error("Related content unavailable");
      return response.json();
    },
  });
  const groups = query.data?.groups?.map(group => ({ ...group, items: group.items.filter(item => isSafeKnowledgeGraphPath(item.url)) })).filter(group => group.items.length) || [];
  if (query.isLoading || query.isError || !groups.length) return null;
  return <section className="mt-14 border-t border-[#E8DCC4] pt-9" aria-labelledby={`knowledge-related-${type}-${id}`}>
    <p className="text-[10px] font-bold uppercase tracking-[.22em] text-[#A86C1B]">From the Vedic Tatva guide</p>
    <h2 id={`knowledge-related-${type}-${id}`} className="mt-2 text-2xl font-serif font-bold text-[#6D2B35]">Continue your exploration</h2>
    <div className="mt-5 space-y-5">
      {groups.map(group => <div key={group.relationshipType}><h3 className="mb-2 text-sm font-semibold text-[#5B1D27]">{group.label}</h3><div className="flex snap-x gap-3 overflow-x-auto pb-2">
        {group.items.map(item => <Link key={item.url} href={item.url} className="min-w-[210px] max-w-[270px] snap-start border border-[#D5AE59]/40 bg-[#FFFDF7] p-4 transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A86C1B]"><span className="text-[10px] font-bold tracking-[.16em] text-[#A86C1B]">{item.type}</span><span className="mt-1 block font-serif font-semibold leading-snug text-[#6D2B35]">{item.name}</span>{Object.values(item.summary).filter(Boolean).slice(0, 2).length ? <span className="mt-2 block text-xs text-[#6D5A50]">{Object.values(item.summary).filter(Boolean).slice(0, 2).join(" · ")}</span> : null}</Link>)}
      </div></div>)}
    </div>
  </section>;
}