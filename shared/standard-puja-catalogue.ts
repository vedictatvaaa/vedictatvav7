export const STANDARD_PUJA_OPTIONS = [
  { value: "satyanarayan", label: "Satyanarayan Katha", price: 5100 },
  { value: "grihapravesh", label: "Griha Pravesh", price: 7100 },
  { value: "rudrabhishek", label: "Rudrabhishek", price: 11000 },
  { value: "mahamrityunjay", label: "Mahamrityunjay Jaap", price: 9500 },
  { value: "navgraha", label: "Navgraha Shanti", price: 8500 },
  { value: "ganesh", label: "Ganesh Puja", price: 3500 },
  { value: "pind-daan-kashi", label: "Pind Daan in Kashi (Manikarnika / Pishachmochan)", price: 11000 },
  { value: "pind-daan-gaya", label: "Pind Daan in Gaya (Vishnupad / Akshayavat)", price: 15100 },
  { value: "pind-daan-haridwar", label: "Pind Daan / Narayani Shila — Haridwar", price: 8100 },
  { value: "pind-daan-yearly-remote", label: "Yearly Remote Tarpan & Shradh (Annual Subscription)", price: 9100 },
] as const;

export type StandardPujaOption = typeof STANDARD_PUJA_OPTIONS[number];
export type StandardPujaValue = StandardPujaOption["value"];

export function resolveStandardPuja(value: string | null | undefined): StandardPujaOption | undefined {
  return STANDARD_PUJA_OPTIONS.find((option) => option.value === value);
}