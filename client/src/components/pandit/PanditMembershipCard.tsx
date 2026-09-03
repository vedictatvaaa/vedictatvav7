import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { CheckCircle2, Copy, Download, FileDown, Printer, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export type PublicPanditCredential = {
  registrationNo: string;
  name?: string;
  image?: string | null;
  city?: string | null;
  state?: string | null;
  specialization?: string | string[] | null;
  status: "verified" | "inactive";
  profilePath?: string | null;
};

const list = (value: PublicPanditCredential["specialization"]) => Array.isArray(value) ? value : value ? value.split(",") : [];
function LotusMark() { return <svg viewBox="0 0 64 64" aria-hidden="true" className="h-full w-full fill-none stroke-current stroke-[2.2]"><path d="M32 57C17 48 10 36 13 21c9 3 15 10 19 19 4-9 10-16 19-19 3 15-4 27-19 36Z"/><path d="M32 40c-8-8-10-18-6-30 8 6 11 15 6 30Zm0 0c8-8 10-18 6-30-8 6-11 15-6 30ZM11 35c8-2 15 1 21 8-9 2-16 0-21-8Zm42 0c-8-2-15 1-21 8 9 2 16 0 21-8Z"/></svg>; }
export function PanditMembershipCard({ credential, interactive = true, className = "" }: { credential: PublicPanditCredential; interactive?: boolean; className?: string }) {
  const { toast } = useToast(); const [back, setBack] = useState(false); const [qr, setQr] = useState(""); const cardRef = useRef<HTMLDivElement>(null);
  const isVerified = credential.status === "verified"; const verifyPath = `/verify-pandit/${credential.registrationNo}`;
  const verifyUrl = typeof window === "undefined" ? verifyPath : new URL(verifyPath, window.location.origin).toString();
  useEffect(() => { QRCode.toDataURL(verifyUrl, { margin: 1, width: 240, color: { dark: "#3b1017", light: "#fff9ea" } }).then(setQr).catch(() => setQr("")); }, [verifyUrl]);
  const copy = async () => { try { await navigator.clipboard.writeText(verifyUrl); toast({ title: "Verification link copied" }); } catch { toast({ title: "Copy unavailable", description: verifyUrl }); } };
  const share = async () => { try { if (navigator.share) await navigator.share({ title: "Vedic Tatva Pandit credential", url: verifyUrl }); else await copy(); } catch { /* user cancelled share */ } };
  const capture = async (pdf = false) => {
    if (!cardRef.current) return;
    try {
      const { default: html2canvas } = await import("html2canvas");
      const canvas = await html2canvas(cardRef.current, { backgroundColor: "#f8edd8", scale: 2, useCORS: true });
      if (pdf) {
        const { jsPDF } = await import("jspdf"); const doc = new jsPDF({ orientation: "landscape", unit: "px", format: [canvas.width, canvas.height] });
        doc.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, canvas.width, canvas.height); doc.save(`vedic-tatva-membership-${credential.registrationNo}.pdf`);
      } else { const a = document.createElement("a"); a.href = canvas.toDataURL("image/png"); a.download = `vedic-tatva-membership-${credential.registrationNo}.png`; a.click(); }
    } catch { toast({ title: "Download unavailable", description: "Please use Print to save this credential." }); }
  };
  const specialty = list(credential.specialization).filter(Boolean).slice(0,2).join(" · ") || "Vedic services";
  return <section className={`vt-membership-card ${className}`} aria-label={`Lifetime membership credential for ${credential.name || "Vedic Tatva Pandit"}`} data-membership-print>
    <div className="mb-3 flex items-center justify-between print:hidden"><p className="vt-card-kicker">Lifetime credential</p>{interactive && <div className="flex gap-1"><Button variant="ghost" size="icon" onClick={() => setBack(v => !v)} aria-label="Flip membership card"><span className="text-xs font-bold">{back ? "Front" : "Back"}</span></Button><Button variant="ghost" size="icon" onClick={copy} aria-label="Copy verification link"><Copy className="h-4 w-4"/></Button><Button variant="ghost" size="icon" onClick={share} aria-label="Share credential"><Share2 className="h-4 w-4"/></Button><Button variant="ghost" size="icon" onClick={() => void capture()} aria-label="Download credential image"><Download className="h-4 w-4"/></Button><Button variant="ghost" size="icon" onClick={() => void capture(true)} aria-label="Download credential PDF"><FileDown className="h-4 w-4"/></Button><Button variant="ghost" size="icon" onClick={() => window.print()} aria-label="Print credential"><Printer className="h-4 w-4"/></Button></div>}</div>
    <div ref={cardRef} className="vt-card-flip" data-back={back}>
      <div className="vt-membership-card__face vt-card-flip__side">
        <div className="vt-card-inner-border" />
        <header className="vt-card-header"><div className="vt-card-brand"><span className="vt-card-seal"><LotusMark /></span><span><b>VEDIC TATVA</b><small>OFFICIAL CREDENTIAL</small></span></div><div className={`vt-card-status ${isVerified ? "is-verified" : "is-inactive"}`}><CheckCircle2 className="h-3.5 w-3.5" />{isVerified ? "Verified Pandit" : "Inactive"}</div></header>
        <main className="vt-card-front-content"><div className="vt-card-portrait">{credential.image ? <img src={credential.image} alt={credential.name || "Pandit portrait"} /> : <div aria-hidden="true">{credential.name?.slice(0, 1) || "V"}</div>}</div><div className="vt-card-identity"><p className="vt-card-eyebrow">Registered Vedic practitioner</p><h2>{credential.name || "Vedic Tatva Pandit"}</h2><p className="vt-card-specialty">{specialty}</p><div className="vt-card-field"><span>Registration no.</span><strong>{credential.registrationNo}</strong></div><p className="vt-card-location">{credential.city || "Approved location"}{credential.state ? `, ${credential.state}` : ""}</p></div></main>
        <footer className="vt-card-footer"><span>Lifetime membership</span><span>Vedic Tatva Trust</span></footer>
      </div>
      <div className="vt-membership-card__face vt-card-flip__side vt-card-flip__back">
        <div className="vt-card-inner-border" />
        <header className="vt-card-header"><div className="vt-card-brand"><span className="vt-card-seal"><LotusMark /></span><span><b>VEDIC TATVA</b><small>LIFETIME MEMBERSHIP</small></span></div><div className={`vt-card-status ${isVerified ? "is-verified" : "is-inactive"}`}>{isVerified ? "Credential active" : "Credential inactive"}</div></header>
        <main className="vt-card-back-content"><div className="vt-card-details"><p className="vt-card-certification">This credential confirms the registered standing of the bearer within the Vedic Tatva Pandit community.</p><dl><div><dt>Pandit</dt><dd>{credential.name || "Vedic Tatva Pandit"}</dd></div><div><dt>Registration</dt><dd>{credential.registrationNo}</dd></div><div><dt>Specialization</dt><dd>{specialty}</dd></div><div><dt>Location</dt><dd>{credential.city || "Approved location"}{credential.state ? `, ${credential.state}` : ""}</dd></div></dl></div><div className="vt-card-verification"><div className="vt-card-qr">{qr ? <img src={qr} alt={`QR code to verify registration ${credential.registrationNo}`} /> : <div className="h-full animate-pulse bg-[#eee4cf]" />}</div><b>Scan to verify</b><span>{verifyPath}</span></div></main>
        <footer className="vt-card-footer"><span>vedic-tatva.com</span><span>Issued for life</span></footer>
      </div>
    </div>
  </section>;
}