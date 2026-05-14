import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useInstallPrompt } from "@/lib/pwa";

export default function InstallAppBanner() {
  const { canInstall, install, dismiss } = useInstallPrompt();

  if (!canInstall) return null;

  return (
    <div
      className="fixed bottom-20 md:bottom-4 left-1/2 -translate-x-1/2 z-[60] w-[calc(100%-1.5rem)] max-w-md"
      data-testid="banner-install-app"
    >
      <div className="flex items-center gap-3 bg-white border border-[#D4AF37]/40 rounded-md shadow-lg p-3">
        <div className="w-10 h-10 rounded-md bg-[#FBF7EE] border border-[#D4AF37]/30 flex items-center justify-center flex-shrink-0">
          <Download className="h-5 w-5 text-[#6D2B35]" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-[#6D2B35]">Install Vedic Tatva</p>
          <p className="text-[11px] text-[#5a4a3a]/70 leading-tight">Faster checkout, festival reminders, works offline.</p>
        </div>
        <Button
          size="sm"
          onClick={install}
          className="bg-[#6D2B35] hover:bg-[#5a1f29] text-[#D4AF37] rounded-md font-semibold text-[12px]"
          data-testid="button-install-app"
        >
          Install
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={dismiss}
          className="rounded-md h-8 w-8 text-[#5a4a3a]/60 flex-shrink-0"
          data-testid="button-install-dismiss"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
