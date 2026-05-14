import React from "react";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { ShoppingBag, Eye } from "lucide-react";
import type { BoostEvent, SocialProofSettings, Product } from "@shared/schema";

export default function SocialProofPopup() {
  const [currentText, setCurrentText] = React.useState("");
  const [currentIcon, setCurrentIcon] = React.useState<"purchase" | "view">("purchase");
  const [isVisible, setIsVisible] = React.useState(false);

  const { data: settings } = useQuery<SocialProofSettings>({
    queryKey: ["/api/social-proof/settings"],
    queryFn: () => fetch("/api/social-proof/settings").then(r => r.json()),
    refetchInterval: 60000,
  });

  const { data: boostEvents } = useQuery<BoostEvent[]>({
    queryKey: ["/api/social-proof/events"],
    queryFn: () => fetch("/api/social-proof/events").then(r => r.json()),
  });

  const { data: products } = useQuery<Product[]>({
    queryKey: ["/api/products"],
    queryFn: () => fetch("/api/products").then(r => r.json()),
  });

  React.useEffect(() => {
    if (!settings?.enabled || !boostEvents?.length || !products?.length) return;

    const getRandomInterval = () => {
      // Random interval between 30-90 seconds for more urgency
      return (Math.floor(Math.random() * 60) + 30) * 1000;
    };

    const showNotification = () => {
      const event = boostEvents[Math.floor(Math.random() * boostEvents.length)];
      const product = products.find(p => p.id === event.productId) || products[0];
      const shortName = product.name.length > 30 ? product.name.slice(0, 30) + "…" : product.name;

      const isViewType = Math.random() > 0.6;
      if (isViewType) {
        const viewers = Math.floor(Math.random() * (settings.viewMax - settings.viewMin)) + settings.viewMin;
        setCurrentText(`${viewers} people viewing ${shortName}`);
        setCurrentIcon("view");
      } else {
        setCurrentText(`${event.name} from ${event.city} bought ${shortName}`);
        setCurrentIcon("purchase");
      }

      setIsVisible(true);
      setTimeout(() => setIsVisible(false), 4000);
    };

    const initialDelay = setTimeout(() => {
      showNotification();
    }, 10000);

    let intervalId: ReturnType<typeof setTimeout>;
    const scheduleNext = () => {
      intervalId = setTimeout(() => {
        showNotification();
        scheduleNext();
      }, getRandomInterval());
    };

    const startSchedule = setTimeout(() => {
      scheduleNext();
    }, 10000);

    return () => {
      clearTimeout(initialDelay);
      clearTimeout(startSchedule);
      clearTimeout(intervalId);
    };
  }, [settings, boostEvents, products]);

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40 pointer-events-none">
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, filter: "blur(12px)", scale: 0.97 }}
            animate={{ opacity: 1, filter: "blur(0px)", scale: 1 }}
            exit={{ opacity: 0, filter: "blur(8px)", scale: 0.98 }}
            transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
            className="flex items-center gap-2 bg-[#1a0a0e]/90 backdrop-blur-md text-white rounded-full px-4 py-2 shadow-lg border border-[#D4AF37]/20 whitespace-nowrap max-w-[90vw]"
            data-testid="social-proof-popup"
          >
            {currentIcon === "purchase" ? (
              <ShoppingBag className="w-3.5 h-3.5 text-[#D4AF37] flex-shrink-0" />
            ) : (
              <Eye className="w-3.5 h-3.5 text-[#D4AF37] flex-shrink-0" />
            )}
            <span className="text-xs font-medium truncate">{currentText}</span>
            <span className="text-[10px] text-white/40 flex-shrink-0">just now</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
