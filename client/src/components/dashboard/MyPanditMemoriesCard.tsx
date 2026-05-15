import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, CalendarDays } from "lucide-react";
import { listMyPanditMemories, type MyPanditMemory } from "@/lib/dashboardApi";

// Surfaces the special dates a pandit has saved against this user — birthdays,
// anniversaries, shraddh, etc. — with the "your pandit remembers" framing.
export default function MyPanditMemoriesCard() {
  const { user } = useAuth();
  const [items, setItems] = useState<MyPanditMemory[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancel = false;
    listMyPanditMemories(user.id, user.email)
      .then((m) => { if (!cancel) setItems(m); })
      .catch(() => {})
      .finally(() => { if (!cancel) setLoaded(true); });
    return () => { cancel = true; };
  }, [user?.id]);

  if (!loaded || items.length === 0) return null;
  const top = items.slice(0, 4);

  return (
    <Card data-testid="card-pandit-memories">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-serif text-[#4a1a22]">
          <Sparkles className="w-4 h-4 text-[#D4AF37]" />Your pandit remembers
        </CardTitle>
        <p className="text-xs text-stone-500 mt-1">
          Special dates your pandit has noted for you and your family.
        </p>
      </CardHeader>
      <CardContent className="space-y-2">
        {top.map((m) => (
          <div key={m.id} className="flex items-start gap-3 p-2 rounded-md hover-elevate" data-testid={`row-memory-${m.id}`}>
            <CalendarDays className="w-4 h-4 mt-0.5 text-[#6D2B35]" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-stone-800 truncate">{m.label}</div>
              <div className="text-xs text-stone-500">
                {m.tithi || m.dateText || "Lunar date"}
                {m.pandit ? ` · noted by ${m.pandit.name}` : ""}
              </div>
            </div>
            {m.daysAway !== null && m.daysAway >= 0 && m.daysAway <= 60 && (
              <Badge className="bg-[#FBF7EE] text-[#4a1a22] border border-[#E8DCC4]">
                {m.daysAway === 0 ? "Today" : m.daysAway === 1 ? "Tomorrow" : `in ${m.daysAway}d`}
              </Badge>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
