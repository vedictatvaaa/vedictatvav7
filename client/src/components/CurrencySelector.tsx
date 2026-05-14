import { useCurrency, listCurrencies } from "@/lib/currency";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Globe2, Check } from "lucide-react";

export default function CurrencySelector({ compact = false }: { compact?: boolean }) {
  const { currency, setCurrency, meta } = useCurrency();
  const items = listCurrencies();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size={compact ? "icon" : "sm"} data-testid="btn-currency-switcher" className="text-[#4a1a22]">
          {compact
            ? <Globe2 className="h-4 w-4" />
            : <span className="flex items-center gap-1.5 text-xs font-semibold">
                <span>{meta.flag}</span>{currency}
              </span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="text-xs">Display currency</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {items.map((c) => (
          <DropdownMenuItem
            key={c.code}
            onClick={() => setCurrency(c.code)}
            className="cursor-pointer flex items-center gap-2"
            data-testid={`currency-option-${c.code}`}
          >
            <span className="text-base">{c.flag}</span>
            <span className="font-semibold w-9">{c.code}</span>
            <span className="text-xs text-[#5a4a3a]/70 truncate">{c.name}</span>
            {currency === c.code && <Check className="h-3.5 w-3.5 ml-auto text-emerald-700" />}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <div className="px-2 py-1.5 text-[10px] text-[#5a4a3a]/65 leading-snug">
          Prices shown for reference. All payments are processed in INR.
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
