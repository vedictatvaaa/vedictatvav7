import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { buildAchievementShareMessage, type AchievementSnapshot } from "@/lib/japa-guidance";

type Props = { snapshot: AchievementSnapshot | null; onDismiss: () => void; onAnotherMala: () => void };

export function JapaAchievementShare({ snapshot, onDismiss, onAnotherMala }: Props) {
  const { toast } = useToast();
  const [copyState, setCopyState] = useState("");
  if (!snapshot) return null;
  const message = buildAchievementShareMessage(snapshot);
  const share = async () => {
    try {
      if (typeof navigator !== "undefined" && "share" in navigator) {
        await navigator.share({ title: "My Japa achievement", text: message });
        return;
      }
      throw new Error("Native share unavailable");
    } catch {
      toast({ title: "Share not available", description: "WhatsApp and copy are still available." });
    }
  };
  const whatsapp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopyState("Copied");
    } catch { setCopyState("Copy failed"); }
  };
  return (
    <Dialog open onOpenChange={(open) => !open && onDismiss()}>
      <DialogContent aria-describedby="japa-achievement-description">
        <DialogTitle>Japa complete</DialogTitle>
        <DialogDescription id="japa-achievement-description">Your achievement is ready to share.</DialogDescription>
        <div className="space-y-2 rounded-lg border p-4 text-sm">
          <p><strong>{snapshot.mantra}</strong></p>
          <p>{snapshot.target} repetitions · {snapshot.malas} mala{snapshot.malas === 1 ? "" : "s"}</p>
          <p>Streak: {snapshot.streak} · Today: {snapshot.todayCount} · Lifetime: {snapshot.lifetimeCount}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={share}>Share</Button>
          <Button variant="outline" onClick={whatsapp}>WhatsApp</Button>
          <Button variant="outline" onClick={copy}>Copy</Button>
          {copyState && <span role="status" className="self-center text-sm">{copyState}</span>}
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onDismiss}>Done</Button>
          <Button onClick={onAnotherMala}>Another mala</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}