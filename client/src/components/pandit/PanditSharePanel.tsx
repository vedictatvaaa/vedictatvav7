import { useEffect, useState, type RefObject } from "react";
import { Check, Copy, Download, Facebook, ImageDown, Instagram, Link2, MessageCircle, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { trackPanditShareEvent } from "@/lib/analytics";
import { canonicalShareUrl, copyShareUrl, downloadStoryFile, facebookShareUrl, fetchStoryFile, shareStoryFile, shareUrl, whatsappShareUrl } from "@/lib/pandit-share";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storefrontUrl: string;
  storyImageUrl: string;
  panditName: string;
  source: "storefront" | "portal";
  storyPreviewAlt?: string;
  returnFocusRef?: RefObject<HTMLElement | null>;
};

export function PanditSharePanel({ open, onOpenChange, storefrontUrl, storyImageUrl, panditName, source, storyPreviewAlt, returnFocusRef }: Props) {
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState<"native" | "story" | "copy" | null>(null);
  const { toast } = useToast();
  const url = canonicalShareUrl(storefrontUrl);
  const title = `${panditName} — Vedic Tatva storefront`;
  const report = (action: Parameters<typeof trackPanditShareEvent>[0], outcome: "success" | "error" | "cancel" = "success") => trackPanditShareEvent(action, { source, outcome });

  useEffect(() => {
    if (open) {
      setStatus("");
      report("open");
    }
  }, [open]);

  const nativeShare = async () => {
    setBusy("native");
    try {
      const shared = await shareUrl(url, title);
      report("native", shared ? "success" : "cancel");
      if (shared) setStatus("Share sheet opened.");
    } catch {
      report("native", "error");
      toast({ title: "Native sharing is unavailable", description: "Use one of the sharing options below." });
    } finally { setBusy(null); }
  };
  const copy = async () => {
    setBusy("copy");
    try {
      if (!await copyShareUrl(url)) throw new Error("Copy unavailable");
      report("copy");
      setStatus("Storefront link copied.");
    } catch {
      report("copy", "error");
      setStatus(`Copy unavailable. Select this link manually: ${url}`);
    } finally { setBusy(null); }
  };
  const story = async (nativeFile: boolean) => {
    setBusy("story");
    try {
      const file = await fetchStoryFile(storyImageUrl, `${panditName.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "pandit"}-vedic-tatva-story.jpg`);
      const shareResult = nativeFile ? await shareStoryFile(file, title) : "unsupported";
      if (shareResult === "shared") {
        report("story_native");
        setStatus("Story image ready in your share sheet.");
      } else if (shareResult === "cancelled") {
        report("story_native", "cancel");
        setStatus("Story sharing cancelled.");
      } else if (nativeFile) {
        downloadStoryFile(file);
        report("story_download");
        setStatus("Story image downloaded. Open Instagram to add it to your Story.");
      } else {
        downloadStoryFile(file);
        report("story_download");
        setStatus("Story image downloaded.");
      }
    } catch {
      report(nativeFile ? "story_native" : "story_download", "error");
      toast({ title: "Story image unavailable", description: "Please try again or share the storefront link." });
    } finally { setBusy(null); }
  };
  const intent = (target: string, action: "whatsapp" | "facebook") => {
    report(action);
    window.open(target, "_blank", "noopener,noreferrer");
  };

  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent
      className="max-h-[calc(100dvh-2rem)] w-[calc(100%-1.5rem)] max-w-md overflow-y-auto rounded-2xl border-[#E2CDA8] bg-[#FFFDF9] p-0"
      data-testid="pandit-share-panel"
      onCloseAutoFocus={(event) => {
        if (!returnFocusRef?.current) return;
        event.preventDefault();
        returnFocusRef.current.focus();
      }}
    >
      <div className="overflow-hidden rounded-2xl">
        <div className="bg-gradient-to-br from-[#531D28] via-[#762630] to-[#A86235] px-5 py-6 text-[#FFF8E8]">
          <DialogHeader className="text-left">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-[#F2D27A]/50 bg-[#3D151D]/50 text-[#F2D27A]"><Share2 className="h-5 w-5" /></div>
            <DialogTitle className="font-serif text-2xl text-[#FFF8E8]">Share this storefront</DialogTitle>
            <DialogDescription className="text-[#FDEBD0]/80">Help someone discover {panditName} through Vedic Tatva.</DialogDescription>
          </DialogHeader>
        </div>
        <div className="space-y-4 p-5">
          <div className="flex items-center gap-3 rounded-xl border border-[#E8DCCB] bg-[#FFF8ED] p-3">
            <img src={storyImageUrl} alt={storyPreviewAlt || `Story preview for ${panditName}`} className="h-20 w-12 rounded-md object-cover shadow-sm" />
            <div className="min-w-0"><p className="text-xs font-bold uppercase tracking-[.14em] text-[#9A641F]">Your share link</p><p className="mt-1 truncate text-xs text-[#735E54]">{url}</p><p className="mt-1 text-[11px] text-[#876F61]">Includes a branded Story image for Instagram and WhatsApp.</p></div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button onClick={nativeShare} disabled={busy !== null || typeof navigator !== "undefined" && !navigator.share} className="h-11 rounded-xl bg-[#8D2830] text-[#FFF8E8] hover:bg-[#6D2028]" data-testid="share-native"><Share2 className="mr-2 h-4 w-4" />Device share</Button>
            <Button onClick={() => intent(whatsappShareUrl(url, title), "whatsapp")} variant="outline" className="h-11 rounded-xl border-[#B7DCC4] text-[#177B45] hover:bg-[#EFFAF2]" data-testid="share-whatsapp"><MessageCircle className="mr-2 h-4 w-4" />WhatsApp</Button>
            <Button onClick={() => intent(facebookShareUrl(url), "facebook")} variant="outline" className="h-11 rounded-xl border-[#C7D5F2] text-[#2856A8] hover:bg-[#F0F5FF]" data-testid="share-facebook"><Facebook className="mr-2 h-4 w-4" />Facebook</Button>
            <Button onClick={copy} disabled={busy !== null} variant="outline" className="h-11 rounded-xl border-[#E2CDA8] text-[#6D3A20]" data-testid="share-copy"><Copy className="mr-2 h-4 w-4" />Copy link</Button>
          </div>
          <div className="border-t border-[#EEE3D2] pt-4">
            <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#9A641F]">Share your Story</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <Button onClick={() => void story(true)} disabled={busy !== null} variant="outline" className="h-11 rounded-xl border-[#B8767D] text-[#8D2830]" data-testid="share-story-native"><Instagram className="mr-2 h-4 w-4" />Share Story image</Button>
              <Button onClick={() => void story(false)} disabled={busy !== null} variant="outline" className="h-11 rounded-xl border-[#E2CDA8] text-[#6D3A20]" data-testid="share-story-download"><Download className="mr-2 h-4 w-4" />Download Story</Button>
            </div>
            <p className="mt-2 text-[11px] leading-4 text-[#876F61]"><ImageDown className="mr-1 inline h-3.5 w-3.5" />Instagram does not allow direct browser posting here. Use the device share sheet or download the image, then add it in Instagram.</p>
          </div>
          <div className="flex items-start gap-2 rounded-lg bg-[#F7F0E4] p-3 text-[11px] text-[#735E54]"><Link2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#9A641F]" /><span className="break-all">{url}</span></div>
          {status && <p role="status" aria-live="polite" className="flex items-center gap-2 text-xs font-semibold text-[#267348]"><Check className="h-4 w-4" />{status}</p>}
        </div>
      </div>
    </DialogContent>
  </Dialog>;
}