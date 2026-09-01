import { useEffect, useState } from "react";
import { ShieldCheck, X } from "lucide-react";
import {
  OPEN_CONSENT_EVENT,
  getConsentPreferences,
  saveConsentPreferences,
  useConsentPreferences,
} from "@/lib/consent";

export default function ConsentManager() {
  const preferences = useConsentPreferences();
  const [open, setOpen] = useState(() => !getConsentPreferences());
  const [customizing, setCustomizing] = useState(false);
  const [analytics, setAnalytics] = useState(preferences?.analytics ?? false);
  const [marketing, setMarketing] = useState(preferences?.marketing ?? false);

  useEffect(() => {
    const handleOpen = () => {
      const current = getConsentPreferences();
      setAnalytics(current?.analytics ?? false);
      setMarketing(current?.marketing ?? false);
      setCustomizing(true);
      setOpen(true);
    };
    window.addEventListener(OPEN_CONSENT_EVENT, handleOpen);
    return () => window.removeEventListener(OPEN_CONSENT_EVENT, handleOpen);
  }, []);

  const save = (next: { analytics: boolean; marketing: boolean }) => {
    const previous = getConsentPreferences();
    const referralSlug = new URLSearchParams(window.location.search).get("ref") || "";
    saveConsentPreferences(next);
    setOpen(false);
    setCustomizing(false);
    const preferencesChanged = previous
      && (previous.analytics !== next.analytics || previous.marketing !== next.marketing);
    const firstReferralConsent = !previous
      && next.marketing
      && /^[a-z0-9-]{1,80}$/i.test(referralSlug);
    if (preferencesChanged || firstReferralConsent) {
      window.location.reload();
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[120] p-3 sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-labelledby="consent-title"
      data-testid="consent-manager"
    >
      <div className="mx-auto max-w-4xl rounded-2xl border border-[#D4AF37]/35 bg-[#fffaf0] p-4 shadow-[0_-8px_35px_rgba(45,17,25,0.2)] sm:p-6">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-6 w-6 shrink-0 text-[#6D2B35]" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 id="consent-title" className="font-serif text-xl font-semibold text-[#4A1C24]">
                  Your privacy choices
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-[#5a4a3a]">
                  Necessary cookies keep the site working. With your permission, analytics helps us improve it and marketing helps us measure referrals and campaigns.
                </p>
              </div>
              {preferences && (
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-full p-1.5 text-[#6D2B35] hover:bg-[#6D2B35]/10"
                  aria-label="Close privacy preferences"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {customizing && (
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <ConsentToggle title="Necessary" description="Security, checkout, login, and saved privacy choices." checked disabled />
                <ConsentToggle title="Analytics" description="Anonymous site usage and performance measurements." checked={analytics} onChange={setAnalytics} />
                <ConsentToggle title="Marketing" description="Campaign measurement, Meta Pixel, GTM, and Pandit referrals." checked={marketing} onChange={setMarketing} />
              </div>
            )}

            <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
              {!customizing ? (
                <>
                  <button type="button" onClick={() => setCustomizing(true)} className="rounded-lg px-4 py-2 text-sm font-semibold text-[#6D2B35] hover:bg-[#6D2B35]/8" data-testid="consent-customize">
                    Customize
                  </button>
                  <button type="button" onClick={() => save({ analytics: false, marketing: false })} className="rounded-lg border border-[#6D2B35]/25 px-4 py-2 text-sm font-semibold text-[#6D2B35] hover:bg-white" data-testid="consent-reject">
                    Reject optional
                  </button>
                  <button type="button" onClick={() => save({ analytics: true, marketing: true })} className="rounded-lg bg-[#6D2B35] px-4 py-2 text-sm font-semibold text-white hover:bg-[#4A1C24]" data-testid="consent-accept">
                    Accept all
                  </button>
                </>
              ) : (
                <button type="button" onClick={() => save({ analytics, marketing })} className="rounded-lg bg-[#6D2B35] px-5 py-2 text-sm font-semibold text-white hover:bg-[#4A1C24]" data-testid="consent-save">
                  Save preferences
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ConsentToggle({
  title,
  description,
  checked,
  disabled = false,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange?: (checked: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-3 rounded-xl border border-[#6D2B35]/12 bg-white p-3">
      <span>
        <span className="block text-sm font-semibold text-[#4A1C24]">{title}</span>
        <span className="mt-0.5 block text-xs leading-relaxed text-[#5a4a3a]/75">{description}</span>
      </span>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange?.(event.target.checked)}
        className="mt-1 h-4 w-4 accent-[#6D2B35]"
      />
    </label>
  );
}
