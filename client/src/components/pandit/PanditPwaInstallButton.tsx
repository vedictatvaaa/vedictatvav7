import { useState } from "react";
import { Download, Share2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useInstallPrompt } from "@/lib/pwa";

const DISMISS_KEY = "vt-pandit-pwa-install-dismissed-at";

export default function PanditPwaInstallButton() {
  const { canInstall, installed, recentlyDismissed, isIOS, install, dismiss } =
    useInstallPrompt({ dismissKey: DISMISS_KEY });
  const [showHelp, setShowHelp] = useState(false);

  if (installed || recentlyDismissed) return null;

  async function handleInstall() {
    if (!canInstall) {
      setShowHelp(true);
      return;
    }
    try {
      await install();
    } catch {
      setShowHelp(true);
    }
  }

  return (
    <div className="relative">
      <Button
        size="sm"
        variant="outline"
        onClick={() => void handleInstall()}
        className="border-[#d8c8ae] bg-[#fffaf1] text-[#55252d] hover:bg-[#f2e6d2]"
        data-testid="button-install-pandit-pwa"
      >
        <Download className="h-3.5 w-3.5 sm:mr-1.5" />
        <span className="hidden sm:inline">Install app</span>
      </Button>
      {showHelp && (
        <div
          className="absolute right-0 top-11 z-50 w-[min(19rem,calc(100vw-2rem))] rounded-xl border border-[#d8c8ae] bg-[#fffaf1] p-4 text-left shadow-xl"
          role="dialog"
          aria-label="Install Panditji app"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#f2e6d2] text-[#946c16]">
              {isIOS ? <Share2 className="h-4 w-4" /> : <Download className="h-4 w-4" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-[#55252d]">Add Panditji to your device</p>
              <p className="mt-1 text-xs leading-5 text-[#806f5e]">
                {isIOS
                  ? "Tap Share in Safari, then choose Add to Home Screen."
                  : "Open your browser menu and choose Install app or Add to Home screen."}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowHelp(false)}
              className="rounded p-1 text-[#806f5e] hover:bg-[#f2e6d2]"
              aria-label="Close install instructions"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <button
            type="button"
            className="mt-3 text-xs font-semibold text-[#946c16] underline underline-offset-2"
            onClick={() => {
              dismiss();
              setShowHelp(false);
            }}
          >
            Don’t show this again
          </button>
        </div>
      )}
    </div>
  );
}