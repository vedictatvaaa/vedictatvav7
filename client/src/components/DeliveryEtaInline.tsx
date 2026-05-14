import { useEffect, useState } from "react";
import { Truck, MapPin, Loader2 } from "lucide-react";

const STORAGE_KEY = "vt-pincode";

type Result = {
  serviceable: boolean;
  cod: boolean;
  etaDays?: number | null;
  etaDate?: string | null;
};

export default function DeliveryEtaInline({ weightKg = 0.5 }: { weightKg?: number }) {
  const [pincode, setPincode] = useState<string>("");
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && /^\d{6}$/.test(stored)) {
        setPincode(stored);
        setLoading(true);
        fetch(`/api/serviceability?pincode=${stored}&weight=${weightKg}`)
          .then((r) => r.json())
          .then((d) => setResult(d))
          .catch(() => {})
          .finally(() => setLoading(false));
      }
    } catch {}
  }, [weightKg]);

  if (!pincode) return null;

  return (
    <div
      className="flex items-center gap-2 text-[12.5px] text-[#3a2a1a]"
      data-testid="delivery-eta-inline"
    >
      <Truck className="h-3.5 w-3.5 text-[#D4AF37] flex-shrink-0" />
      {loading ? (
        <span className="inline-flex items-center gap-1.5 text-[#5a4a3a]/70">
          <Loader2 className="h-3 w-3 animate-spin" /> Checking delivery to {pincode}…
        </span>
      ) : result?.serviceable ? (
        <span>
          <span className="text-emerald-700 font-semibold">
            Delivers {result.etaDate ? `by ${result.etaDate}` : `in ${result.etaDays ?? "3–5"} days`}
          </span>
          <span className="text-[#5a4a3a]/70">
            {" "}to <MapPin className="inline h-3 w-3 text-[#D4AF37]" /> {pincode}
          </span>
        </span>
      ) : result ? (
        <span className="text-rose-700">Not deliverable to {pincode} — try another PIN below</span>
      ) : null}
    </div>
  );
}
