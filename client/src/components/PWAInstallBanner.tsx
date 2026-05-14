import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useInstallPrompt } from "@/lib/pwa";

export function PWAInstallBanner() {
  const { canInstall, install, dismiss } = useInstallPrompt();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!canInstall) return;
    const t = window.setTimeout(() => setVisible(true), 8000);
    return () => window.clearTimeout(t);
  }, [canInstall]);

  if (!canInstall || !visible) return null;

  return (
    <div
      className="fixed bottom-20 left-1/2 z-[9999] -translate-x-1/2 sm:bottom-6"
      data-testid="pwa-install-banner"
    >
      <div className="flex items-center gap-3 rounded-md border border-border bg-card px-4 py-3 shadow-lg">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
          <Download className="h-4 w-4" />
        </div>
        <div className="text-sm">
          <div className="font-medium">Install Vedic Tatva</div>
          <div className="text-xs text-muted-foreground">Faster access, works offline</div>
        </div>
        <Button
          size="sm"
          onClick={async () => {
            try {
              await install();
            } catch {
              // Browser refused or user cancelled — hide either way.
            } finally {
              setVisible(false);
            }
          }}
          data-testid="button-pwa-install"
        >
          Install
        </Button>
        <Button
          size="icon"
          variant="ghost"
          onClick={() => {
            dismiss();
            setVisible(false);
          }}
          data-testid="button-pwa-dismiss"
          aria-label="Dismiss install prompt"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
