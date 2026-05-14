import { useState } from "react";
import { MapPin, Truck, IndianRupee, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Result = {
  serviceable: boolean;
  cod: boolean;
  etaDays?: number | null;
  etaDate?: string | null;
  courier?: string | null;
  cached?: boolean;
};

const STORAGE_KEY = "vt-pincode";

export default function PincodeChecker({ weightKg = 0.5 }: { weightKg?: number }) {
  const [pincode, setPincode] = useState<string>(() => {
    try { return localStorage.getItem(STORAGE_KEY) || ""; } catch { return ""; }
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string>("");

  async function check(code: string) {
    if (!/^\d{6}$/.test(code)) {
      setError("Enter a valid 6-digit PIN code");
      setResult(null);
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/serviceability?pincode=${code}&weight=${weightKg}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Could not check this PIN");
        setResult(null);
      } else {
        setResult(data);
        try { localStorage.setItem(STORAGE_KEY, code); } catch {}
      }
    } catch {
      setError("Could not reach delivery service. Try again.");
      setResult(null);
    }
    setLoading(false);
  }

  return (
    <div className="rounded-md border border-[#D4AF37]/30 bg-white p-3.5" data-testid="pincode-checker">
      <div className="flex items-center gap-2 mb-2.5">
        <MapPin className="h-4 w-4 text-[#D4AF37]" />
        <span className="text-xs font-semibold text-[#6D2B35] uppercase tracking-wider">Delivery to your PIN</span>
      </div>
      <div className="flex gap-2">
        <Input
          inputMode="numeric"
          maxLength={6}
          placeholder="Enter 6-digit PIN code"
          value={pincode}
          onChange={(e) => { setPincode(e.target.value.replace(/\D/g, "").slice(0, 6)); setError(""); }}
          onKeyDown={(e) => { if (e.key === "Enter") check(pincode); }}
          className="h-10 rounded-md border-[#D4AF37]/30 text-sm"
          data-testid="input-pincode-check"
        />
        <Button
          onClick={() => check(pincode)}
          disabled={loading || pincode.length !== 6}
          className="h-10 rounded-md bg-[#6D2B35] hover:bg-[#5a1f29] text-[#D4AF37] font-semibold text-[13px] px-4"
          data-testid="button-pincode-check"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Check"}
        </Button>
      </div>
      {error && (
        <p className="text-xs text-rose-600 mt-2 flex items-center gap-1.5" data-testid="text-pincode-error">
          <AlertCircle className="h-3.5 w-3.5" /> {error}
        </p>
      )}
      {result && !error && (
        <div className="mt-3 space-y-1.5" data-testid="result-pincode">
          {result.serviceable ? (
            <div className="flex items-start gap-2 text-emerald-700 text-sm">
              <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold">
                  Delivers in {result.etaDays ?? "3–5"} {(result.etaDays ?? 0) === 1 ? "day" : "days"}
                  {result.etaDate ? ` · by ${result.etaDate}` : ""}
                </p>
                {result.courier && <p className="text-[11px] text-emerald-700/80">via {result.courier}</p>}
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-2 text-rose-700 text-sm">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <p>Sorry, we don't deliver to this PIN yet. Please try a nearby PIN.</p>
            </div>
          )}
          <div className="flex items-center gap-3 text-xs text-[#5a4a3a]/80 pt-1">
            <span className="inline-flex items-center gap-1">
              <Truck className="h-3 w-3 text-[#D4AF37]" /> Free shipping above ₹499
            </span>
            <span className="inline-flex items-center gap-1">
              <IndianRupee className="h-3 w-3 text-[#D4AF37]" />
              {result.cod ? "COD available" : "Prepaid only"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
