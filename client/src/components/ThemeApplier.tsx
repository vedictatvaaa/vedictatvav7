import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import type { SiteSettings } from "@shared/schema";
import { useConsentPreferences } from "@/lib/consent";

// Converts #rrggbb (or #rgb) into Tailwind-compatible "H S% L%" string.
// Returns null for invalid inputs so callers can skip applying.
function hexToHsl(hex: string): string | null {
  if (!hex) return null;
  let h = hex.trim().replace(/^#/, "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return null;
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let hue = 0, sat = 0;
  const light = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    sat = light > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: hue = (g - b) / d + (g < b ? 6 : 0); break;
      case g: hue = (b - r) / d + 2; break;
      case b: hue = (r - g) / d + 4; break;
    }
    hue /= 6;
  }
  return `${Math.round(hue * 360)} ${Math.round(sat * 100)}% ${Math.round(light * 100)}%`;
}

// ThemeApplier reads site_settings once on mount and keeps it in sync (stale
// time 5min). It injects (a) a <style id="theme-vars"> tag with CSS variable
// overrides on :root, (b) a Google Fonts <link>, (c) a favicon <link>, and (d)
// analytics snippets (GA4 / FB Pixel) when configured. All mutations are
// idempotent — we always write to fixed-id tags so re-renders don't duplicate.
export default function ThemeApplier() {
  const consent = useConsentPreferences();
  const { data } = useQuery<SiteSettings>({
    queryKey: ["/api/site-settings"],
    queryFn: () => fetch("/api/site-settings").then((r) => r.ok ? r.json() : null),
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (!data) return;

    // (a) Color variables
    const vars: Record<string, string | undefined> = {
      "--primary": hexToHsl(data.primaryColor) || undefined,
      "--secondary": hexToHsl(data.secondaryColor) || undefined,
      "--accent": hexToHsl(data.accentColor) || undefined,
      "--background": hexToHsl(data.backgroundColor) || undefined,
      "--foreground": hexToHsl(data.foregroundColor) || undefined,
      "--ring": hexToHsl(data.secondaryColor) || undefined,
    };
    const bodyFont = (data.bodyFont || "Inter").trim();
    const headingFont = (data.headingFont || "Playfair Display").trim();
    const css = `:root {
  ${Object.entries(vars).filter(([, v]) => v).map(([k, v]) => `${k}: ${v};`).join("\n  ")}
  --font-sans: '${bodyFont}', sans-serif;
  --font-serif: '${headingFont}', Georgia, serif;
}
body { font-family: '${bodyFont}', sans-serif; }`;
    let style = document.getElementById("theme-vars") as HTMLStyleElement | null;
    if (!style) {
      style = document.createElement("style");
      style.id = "theme-vars";
      document.head.appendChild(style);
    }
    if (style.textContent !== css) style.textContent = css;

    // (b) Google Fonts
    const fontsHref = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(bodyFont)}:wght@400;500;600;700&family=${encodeURIComponent(headingFont)}:wght@400;500;600;700&display=swap`;
    let fontLink = document.getElementById("theme-fonts") as HTMLLinkElement | null;
    if (!fontLink) {
      fontLink = document.createElement("link");
      fontLink.id = "theme-fonts";
      fontLink.rel = "stylesheet";
      document.head.appendChild(fontLink);
    }
    if (fontLink.href !== fontsHref) fontLink.href = fontsHref;

    // (c) Favicon
    if (data.faviconUrl) {
      let fav = document.querySelector<HTMLLinkElement>("link[rel='icon']");
      if (!fav) {
        fav = document.createElement("link");
        fav.rel = "icon";
        document.head.appendChild(fav);
      }
      if (fav.href !== data.faviconUrl) fav.href = data.faviconUrl;
    }

    // Strict ID validators block injection of admin-supplied values that
    // could break out of the inline script context (XSS via stored ID).
    const GA_ID = /^[A-Z0-9-]{1,32}$/;          // e.g. G-XXXXXXXXXX / UA-xxxxxx
    const GTM_ID = /^GTM-[A-Z0-9]{4,12}$/;      // GTM-XXXXXX
    const FB_ID = /^[0-9]{6,20}$/;              // numeric pixel id
    const isSafeGA = !!data.googleAnalyticsId && GA_ID.test(data.googleAnalyticsId);
    const isSafeGTM = !!(data as any).gtmContainerId && GTM_ID.test((data as any).gtmContainerId);
    const isSafeFB = !!data.facebookPixelId && FB_ID.test(data.facebookPixelId);

    // (d) Analytics. When GTM is configured it exclusively owns Google tags.
    if (consent?.analytics && isSafeGA && !isSafeGTM && !document.getElementById("ga4-loader")) {
      const s1 = document.createElement("script");
      s1.id = "ga4-loader";
      s1.async = true;
      s1.src = `https://www.googletagmanager.com/gtag/js?id=${data.googleAnalyticsId}`;
      document.head.appendChild(s1);
      const s2 = document.createElement("script");
      s2.id = "ga4-init";
      s2.textContent = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${data.googleAnalyticsId}');`;
      document.head.appendChild(s2);
    }
    if (consent?.marketing && isSafeFB && !document.getElementById("fb-pixel")) {
      const s = document.createElement("script");
      s.id = "fb-pixel";
      s.textContent = `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${data.facebookPixelId}');fbq('track','PageView');`;
      document.head.appendChild(s);
    }

    // (e) Google Tag Manager — the single most flexible tag loader. When a
    // container ID is set, GTM owns all marketing tags (GA4, Ads, conversion).
    const gtmId = isSafeGTM ? ((data as any).gtmContainerId as string) : undefined;
    if (consent?.marketing && gtmId && !document.getElementById("gtm-loader")) {
      const s = document.createElement("script");
      s.id = "gtm-loader";
      s.textContent = `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s);j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtmId}');`;
      document.head.appendChild(s);
      // Noscript iframe fallback so crawlers / JS-off visitors still count.
      const ns = document.createElement("noscript");
      ns.id = "gtm-noscript";
      // Sanitize: GTM container IDs are strictly GTM-XXXXXXX. Reject anything
      // else to prevent HTML/JS injection through admin-controlled settings.
      if (!/^GTM-[A-Z0-9]{4,12}$/.test(gtmId)) return;
      const iframe = document.createElement("iframe");
      iframe.src = `https://www.googletagmanager.com/ns.html?id=${encodeURIComponent(gtmId)}`;
      iframe.height = "0";
      iframe.width = "0";
      iframe.style.display = "none";
      iframe.style.visibility = "hidden";
      ns.replaceChildren(iframe);
      document.body.insertBefore(ns, document.body.firstChild);
    }

    // (f) Google Search Console HTML-tag verification.
    const gsc = (data as any).gscVerification as string | undefined;
    if (gsc) {
      let el = document.querySelector('meta[name="google-site-verification"]') as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute("name", "google-site-verification");
        document.head.appendChild(el);
      }
      el.content = gsc;
    }
  }, [consent, data]);

  return null;
}
