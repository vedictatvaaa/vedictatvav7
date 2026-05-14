import { useState } from "react";
import { Star, Upload, X, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

interface Props {
  productId: number;
  defaultEmail?: string;
  defaultName?: string;
  onSubmitted?: () => void;
  /** When provided, the review is auto-verified server-side and bypasses
   *  the email-matching check. Comes from the post-delivery email link. */
  token?: string;
}

export function ReviewSubmitForm({ productId, defaultEmail, defaultName, onSubmitted, token }: Props) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(0);
  const [name, setName] = useState(defaultName || "");
  const [email, setEmail] = useState(defaultEmail || "");
  const [city, setCity] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const remaining = 6 - images.length;
    if (remaining <= 0) { toast({ title: "Up to 6 photos allowed" }); return; }
    const fd = new FormData();
    Array.from(files).slice(0, remaining).forEach((f) => fd.append("images", f));
    setUploading(true);
    try {
      const r = await fetch("/api/reviews/upload-images", { method: "POST", body: fd });
      const d = await r.json();
      if (!r.ok) throw new Error(d.message || "Upload failed");
      setImages((prev) => [...prev, ...(d.urls || [])].slice(0, 6));
    } catch (e: any) {
      toast({ title: "Upload failed", description: e?.message || "Please try smaller images", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  }

  async function submit() {
    if (name.trim().length < 2) { toast({ title: "Please enter your name" }); return; }
    if (title.trim().length < 3) { toast({ title: "Please add a short title" }); return; }
    if (body.trim().length < 10) { toast({ title: "Please share a few words about your experience" }); return; }
    setSubmitting(true);
    try {
      const r = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId, rating,
          reviewerName: name.trim(),
          reviewerCity: city.trim() || undefined,
          customerEmail: email.trim() || undefined,
          title: title.trim(),
          body: body.trim(),
          images,
          token: token || undefined,
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.message || "Could not submit review");
      setDone(true);
      toast({ title: "Thank you", description: d._info || "Your review will appear after a quick check." });
      qc.invalidateQueries({ queryKey: ["/api/reviews", productId] });
      onSubmitted?.();
    } catch (e: any) {
      toast({ title: "Could not submit", description: e?.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="border border-emerald-200 bg-emerald-50 text-emerald-800 rounded-md p-5 flex items-start gap-3" data-testid="review-thanks">
        <Check className="h-5 w-5 mt-0.5" />
        <div>
          <div className="font-medium">Thank you for sharing your experience.</div>
          <div className="text-sm mt-1">Your review will appear publicly after a quick moderation check.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-[#D4AF37]/25 rounded-md bg-white p-5" data-testid="review-form">
      <h3 className="font-serif text-lg text-[#6D2B35] mb-1">Share your experience</h3>
      <p className="text-xs text-[#5a4a3a]/70 mb-4">Verified buyers get a Verified Purchase badge automatically.</p>

      <div className="mb-3">
        <Label className="text-xs text-[#5a4a3a]">Your rating</Label>
        <div className="flex gap-1 mt-1.5" onMouseLeave={() => setHover(0)} data-testid="rating-picker">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onMouseEnter={() => setHover(n)}
              onClick={() => setRating(n)}
              className="p-0.5"
              data-testid={`button-rate-${n}`}
              aria-label={`${n} stars`}
            >
              <Star
                className="h-6 w-6 transition-colors"
                fill={(hover || rating) >= n ? "#D4AF37" : "transparent"}
                stroke={(hover || rating) >= n ? "#D4AF37" : "#9c8a73"}
              />
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
        <div>
          <Label className="text-xs text-[#5a4a3a]" htmlFor="rev-name">Name</Label>
          <Input id="rev-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={100} data-testid="input-review-name" />
        </div>
        <div>
          <Label className="text-xs text-[#5a4a3a]" htmlFor="rev-email">Email <span className="text-[#5a4a3a]/50">(optional, for Verified badge)</span></Label>
          <Input id="rev-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={200} data-testid="input-review-email" />
        </div>
      </div>

      <div className="mb-3">
        <Label className="text-xs text-[#5a4a3a]" htmlFor="rev-city">City <span className="text-[#5a4a3a]/50">(optional)</span></Label>
        <Input id="rev-city" value={city} onChange={(e) => setCity(e.target.value)} maxLength={100} data-testid="input-review-city" />
      </div>

      <div className="mb-3">
        <Label className="text-xs text-[#5a4a3a]" htmlFor="rev-title">Title</Label>
        <Input id="rev-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} placeholder="Sums up your experience in a few words" data-testid="input-review-title" />
      </div>

      <div className="mb-3">
        <Label className="text-xs text-[#5a4a3a]" htmlFor="rev-body">Your review</Label>
        <Textarea id="rev-body" value={body} onChange={(e) => setBody(e.target.value)} maxLength={5000} rows={4} placeholder="What did you like? How did you use it?" data-testid="textarea-review-body" />
      </div>

      <div className="mb-4">
        <Label className="text-xs text-[#5a4a3a]">Add photos <span className="text-[#5a4a3a]/50">(optional, up to 6)</span></Label>
        <div className="flex flex-wrap gap-2 mt-1.5" data-testid="review-image-picker">
          {images.map((u, i) => (
            <div key={u} className="relative w-16 h-16 rounded-md overflow-hidden border border-[#D4AF37]/30">
              <img src={u} alt="upload" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => setImages(images.filter((x) => x !== u))}
                className="absolute top-0.5 right-0.5 bg-white/90 rounded-full p-0.5 hover-elevate"
                data-testid={`button-remove-image-${i}`}
                aria-label="Remove"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          {images.length < 6 && (
            <label className="w-16 h-16 rounded-md border border-dashed border-[#D4AF37]/40 flex items-center justify-center cursor-pointer hover-elevate" data-testid="label-upload-images">
              {uploading ? <Loader2 className="h-4 w-4 animate-spin text-[#5a4a3a]/60" /> : <Upload className="h-4 w-4 text-[#5a4a3a]/60" />}
              <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => { handleFiles(e.target.files); e.target.value = ""; }} />
            </label>
          )}
        </div>
      </div>

      <Button onClick={submit} disabled={submitting || uploading} data-testid="button-submit-review">
        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit review"}
      </Button>
    </div>
  );
}
