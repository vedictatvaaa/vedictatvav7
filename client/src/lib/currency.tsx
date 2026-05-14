import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

// Static FX rates (1 INR = X). Refreshed manually; production should call an FX API.
// Kept conservative as of 2026 — enough for display; checkout converts back to INR for Razorpay.
const RATES: Record<string, { rate: number; symbol: string; name: string; flag: string }> = {
  INR: { rate: 1,        symbol: "₹",  name: "Indian Rupee",     flag: "🇮🇳" },
  USD: { rate: 0.0120,   symbol: "$",  name: "US Dollar",        flag: "🇺🇸" },
  GBP: { rate: 0.0095,   symbol: "£",  name: "British Pound",    flag: "🇬🇧" },
  EUR: { rate: 0.0110,   symbol: "€",  name: "Euro",             flag: "🇪🇺" },
  AED: { rate: 0.0440,   symbol: "د.إ", name: "UAE Dirham",       flag: "🇦🇪" },
  SGD: { rate: 0.0162,   symbol: "S$", name: "Singapore Dollar", flag: "🇸🇬" },
  CAD: { rate: 0.0165,   symbol: "C$", name: "Canadian Dollar",  flag: "🇨🇦" },
  AUD: { rate: 0.0185,   symbol: "A$", name: "Australian Dollar",flag: "🇦🇺" },
};

export const SUPPORTED_CURRENCIES = Object.keys(RATES);
export type CurrencyCode = keyof typeof RATES;

type CurrencyContextValue = {
  currency: string;
  setCurrency: (c: string) => void;
  format: (inrAmount: number, opts?: { showOriginal?: boolean }) => string;
  meta: typeof RATES["INR"];
};

const CurrencyContext = createContext<CurrencyContextValue | undefined>(undefined);

const STORAGE_KEY = "vt_currency";

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<string>(() => {
    if (typeof window === "undefined") return "INR";
    return localStorage.getItem(STORAGE_KEY) || "INR";
  });

  useEffect(() => { localStorage.setItem(STORAGE_KEY, currency); }, [currency]);

  const setCurrency = (c: string) => {
    if (RATES[c]) setCurrencyState(c);
  };

  const meta = RATES[currency] || RATES.INR;

  const format = (inrAmount: number, opts?: { showOriginal?: boolean }) => {
    const safe = Number(inrAmount) || 0;
    if (currency === "INR") {
      return `₹${safe.toLocaleString("en-IN")}`;
    }
    const converted = safe * meta.rate;
    const formatted = converted < 1
      ? converted.toFixed(2)
      : converted.toLocaleString("en-US", { maximumFractionDigits: 2, minimumFractionDigits: converted >= 100 ? 0 : 2 });
    const main = `${meta.symbol}${formatted}`;
    return opts?.showOriginal ? `${main} (₹${safe.toLocaleString("en-IN")})` : main;
  };

  return <CurrencyContext.Provider value={{ currency, setCurrency, format, meta }}>{children}</CurrencyContext.Provider>;
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) {
    // Safe fallback if provider isn't mounted yet
    return {
      currency: "INR",
      setCurrency: () => {},
      format: (n: number) => `₹${(Number(n) || 0).toLocaleString("en-IN")}`,
      meta: RATES.INR,
    };
  }
  return ctx;
}

export function getCurrencyMeta(code: string) {
  return RATES[code] || RATES.INR;
}
export function listCurrencies() {
  return Object.entries(RATES).map(([code, m]) => ({ code, ...m }));
}
