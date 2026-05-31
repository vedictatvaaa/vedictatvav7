import { createContext, useContext, useEffect, useRef, useState } from "react";
import type Lenis from "lenis";
import { initSmoothScroll, destroySmoothScroll, prefersReducedMotion } from "@/lib/smooth-scroll";

const LenisContext = createContext<Lenis | null>(null);

export function useLenis(): Lenis | null {
  return useContext(LenisContext);
}

export default function SmoothScrollProvider({ children }: { children: React.ReactNode }) {
  const [lenis, setLenis] = useState<Lenis | null>(null);
  const mediaQueryRef = useRef<MediaQueryList | null>(null);

  useEffect(() => {
    const instance = initSmoothScroll();
    setLenis(instance);

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    mediaQueryRef.current = mq;

    const handleChange = () => {
      if (mq.matches) {
        destroySmoothScroll();
        setLenis(null);
      } else {
        const next = initSmoothScroll();
        setLenis(next);
      }
    };

    mq.addEventListener("change", handleChange);

    return () => {
      mq.removeEventListener("change", handleChange);
      destroySmoothScroll();
      setLenis(null);
    };
  }, []);

  return <LenisContext.Provider value={lenis}>{children}</LenisContext.Provider>;
}
