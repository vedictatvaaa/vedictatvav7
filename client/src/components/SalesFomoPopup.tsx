import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { AnimatePresence, motion } from "framer-motion";
import { X, Copy, Check, Tag, Sparkles } from "lucide-react";
import type { SalesPopup } from "@shared/schema";

const STORAGE_PREFIX = "vt:salesPopup:";

function dismissalKey(id: number) {
  return `${STORAGE_PREFIX}${id}`;
}

function todayStamp() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function isDismissed(popup: SalesPopup): boolean {
  if (typeof window === "undefined") return true;
  // "always" never persists a dismissal — visitor sees it on every visit.
  if (popup.frequency === "always") return false;
  const key = dismissalKey(popup.id);
  if (popup.frequency === "daily") {
    return localStorage.getItem(key) === todayStamp();
  }
  return sessionStorage.getItem(key) === "1";
}

function markDismissed(popup: SalesPopup) {
  if (typeof window === "undefined") return;
  // "always" → don't persist dismissal so the popup returns next visit.
  if (popup.frequency === "always") return;
  const key = dismissalKey(popup.id);
  if (popup.frequency === "daily") {
    localStorage.setItem(key, todayStamp());
  } else {
    sessionStorage.setItem(key, "1");
  }
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return "00:00:00";
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  if (days > 0) return `${days}d ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

export default function SalesFomoPopup() {
  const [visible, setVisible] = React.useState(false);
  const [now, setNow] = React.useState(() => Date.now());
  const [copied, setCopied] = React.useState(false);
  const titleId = React.useId();
  const dialogRef = React.useRef<HTMLDivElement | null>(null);
  const previouslyFocused = React.useRef<HTMLElement | null>(null);

  // 204 No Content => null. Refetch every 5 min so a freshly-published
  // campaign appears without a hard reload, but we don't hammer the API.
  const { data: popup } = useQuery<SalesPopup | null>({
    queryKey: ["/api/sales-popups/active"],
    queryFn: async () => {
      const res = await fetch("/api/sales-popups/active");
      if (res.status === 204) return null;
      if (!res.ok) return null;
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });

  const close = React.useCallback(() => {
    setVisible(false);
    if (popup) markDismissed(popup);
  }, [popup]);

  // Schedule the show after the configured delay, but skip if already
  // expired or dismissed. Recheck expiry inside the timeout so a popup
  // that ends during the delay window never opens stale.
  React.useEffect(() => {
    if (!popup) return;
    if (isDismissed(popup)) return;
    const endsAtMs = new Date(popup.endsAt).getTime();
    if (Date.now() >= endsAtMs) return;
    const delayMs = Math.max(0, (popup.showAfterSeconds ?? 8) * 1000);
    const t = setTimeout(() => {
      if (Date.now() < endsAtMs) {
        setNow(Date.now());
        setVisible(true);
      }
    }, delayMs);
    return () => clearTimeout(t);
  }, [popup]);

  // Live countdown ticker — only runs while the modal is visible.
  React.useEffect(() => {
    if (!visible) return;
    const i = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(i);
  }, [visible]);

  // Auto-close when the campaign expires while modal is open. Done in an
  // effect (not during render) to avoid React's "set state in render" warning.
  React.useEffect(() => {
    if (!visible || !popup) return;
    const endsAtMs = new Date(popup.endsAt).getTime();
    if (now >= endsAtMs) close();
  }, [visible, popup, now, close]);

  // Modal a11y: Escape to close, focus trap entry/restore, body scroll lock.
  React.useEffect(() => {
    if (!visible) return;
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // Focus the dialog so screen readers announce it and Escape works.
    dialogRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      previouslyFocused.current?.focus?.();
    };
  }, [visible, close]);

  if (!popup) return null;

  const endsAtMs = new Date(popup.endsAt).getTime();
  const remainingMs = endsAtMs - now;

  const copyCoupon = async () => {
    if (!popup.couponCode) return;
    try {
      await navigator.clipboard.writeText(popup.couponCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked — silently ignore. The code is still visible.
    }
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm"
          onClick={close}
          data-testid="sales-fomo-backdrop"
        >
          <motion.div
            ref={dialogRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            initial={{ y: 24, scale: 0.96, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 12, scale: 0.97, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md rounded-md overflow-hidden bg-[#FBF7EE] border border-[#D4AF37]/40 shadow-2xl outline-none"
            data-testid="sales-fomo-popup"
          >
            {/* Close */}
            <button
              type="button"
              onClick={close}
              aria-label="Close promotional popup"
              className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center text-white/90 bg-black/20 hover:bg-black/35 transition-colors"
              data-testid="button-sales-fomo-close"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Maroon header band with eyebrow + title */}
            <div className="px-6 pt-6 pb-5 bg-gradient-to-br from-[#6D2B35] to-[#4a1c24] text-white">
              <div className="flex items-center gap-1.5 text-[#F5D77A] text-[11px] font-semibold tracking-widest uppercase">
                <Sparkles className="w-3.5 h-3.5" />
                Limited Time Offer
              </div>
              <h2
                id={titleId}
                className="mt-2 font-serif text-2xl leading-tight"
                data-testid="text-sales-fomo-title"
              >
                {popup.title}
              </h2>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-4">
              <p
                className="text-sm text-[#3a1a1f] leading-relaxed"
                data-testid="text-sales-fomo-message"
              >
                {popup.message}
              </p>

              {/* Countdown */}
              <div className="rounded-md bg-white border border-[#D4AF37]/30 px-4 py-3">
                <div className="text-[10px] text-[#6D2B35]/70 uppercase tracking-widest font-semibold">
                  Ends in
                </div>
                <div
                  className="mt-1 font-mono text-2xl font-bold text-[#6D2B35] tabular-nums"
                  aria-live="polite"
                  data-testid="text-sales-fomo-countdown"
                >
                  {formatCountdown(remainingMs)}
                </div>
              </div>

              {/* Coupon code */}
              {popup.couponCode && (
                <button
                  type="button"
                  onClick={copyCoupon}
                  className="w-full flex items-center justify-between gap-3 rounded-md border border-dashed border-[#6D2B35]/40 bg-[#D4AF37]/10 px-4 py-3 text-left hover-elevate active-elevate-2"
                  data-testid="button-sales-fomo-coupon"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Tag className="w-4 h-4 text-[#6D2B35] flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="text-[10px] text-[#6D2B35]/70 uppercase tracking-widest font-semibold">
                        Use code
                      </div>
                      <div className="font-mono text-base font-bold text-[#6D2B35] truncate">
                        {popup.couponCode}
                      </div>
                    </div>
                  </div>
                  <span className="flex items-center gap-1 text-xs font-medium text-[#6D2B35] flex-shrink-0">
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5" /> Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" /> Copy
                      </>
                    )}
                  </span>
                </button>
              )}

              {/* CTA */}
              <Link href={popup.ctaUrl || "/products"}>
                <a
                  onClick={close}
                  className="block w-full text-center rounded-md bg-[#6D2B35] hover:bg-[#5a1f29] text-white font-medium px-4 py-3 transition-colors"
                  data-testid="button-sales-fomo-cta"
                >
                  {popup.ctaLabel || "Shop Now"}
                </a>
              </Link>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
