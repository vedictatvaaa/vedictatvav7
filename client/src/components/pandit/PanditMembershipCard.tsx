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
function TempleArt() { return <svg viewBox="0 0 280 220" className="h-full w-full fill-none stroke-current stroke-[1.2]" aria-hidden="true"><path d="M8 190h264M35 190V93h42v97m8 0V64h54v126m7 0V108h45v82M22 93h68L56 45 22 93Zm52-29L106 15l31 49M143 108h51l-26-57-25 57Zm-2-14 27-77 27 77m-95 96V130m25 60v-82m25 82v-60m39 60v-49m22 49v-68M2 204h276"/><path d="M41 116h30m-30 18h30m50-52h35m-35 20h35m-20-65v21m29 76h27m-27 17h27" opacity=".7"/></svg>; }
function IndiaMark() { return <span className="relative block h-10 w-8"><span className="vt-card-map absolute inset-0"/><span className="absolute left-1/2 top-[47%] h-2 w-2 -translate-x-1/2 rounded-full border border-[#304d78]"><i className="absolute inset-[2px] rounded-full bg-[#304d78]"/></span></span>; }

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
    <div className="mb-3 flex items-center justify-between print:hidden"><p className="text-[10px] font-bold uppercase tracking-[.22em] text-[#8d671d]">Lifetime credential</p>{interactive && <div className="flex gap-1"><Button variant="ghost" size="icon" onClick={() => setBack(v => !v)} aria-label="Flip membership card"><span className="text-xs font-bold">{back ? "Front" : "Back"}</span></Button><Button variant="ghost" size="icon" onClick={copy} aria-label="Copy verification link"><Copy className="h-4 w-4"/></Button><Button variant="ghost" size="icon" onClick={share} aria-label="Share credential"><Share2 className="h-4 w-4"/></Button><Button variant="ghost" size="icon" onClick={() => void capture()} aria-label="Download credential image"><Download className="h-4 w-4"/></Button><Button variant="ghost" size="icon" onClick={() => void capture(true)} aria-label="Download credential PDF"><FileDown className="h-4 w-4"/></Button><Button variant="ghost" size="icon" onClick={() => window.print()} aria-label="Print credential"><Printer className="h-4 w-4"/></Button></div>}</div>
    <div ref={cardRef} className="vt-card-flip" data-back={back}>
      <div className="vt-membership-card__face vt-card-flip__side">
        <div className="vt-card-maroon absolute inset-x-0 top-0 h-[29%]"/><div className="vt-card-gold-line absolute inset-x-0 top-[28%] h-[5px]"/>
        <div className="absolute left-[7%] top-[6%] flex items-center gap-[2.5%] text-[#f4d27b]"><span className="h-12 w-12"><LotusMark/></span><div><div className="font-serif text-[clamp(16px,3.2vw,34px)] leading-none tracking-[.06em]">VEDIC TATVA</div><div className="mt-1 text-[clamp(6px,1.05vw,11px)] font-bold tracking-[.24em]">THE VOICE OF VEDAS</div></div></div>
        <div className="vt-card-verified absolute right-[5%] top-[8%] flex items-center gap-1.5 rounded-full px-2 py-1 text-[clamp(6px,.9vw,10px)] font-bold uppercase tracking-wide"><CheckCircle2 className="h-4 w-4"/>{isVerified ? "Verified Pandit" : "Membership inactive"}</div>
        <div className="vt-card-portrait absolute left-[7%] top-[37%] h-[46%] w-[22%] overflow-hidden rounded-[12%]">{credential.image ? <img src={credential.image} alt={credential.name || "Pandit portrait"}/> : <div className="grid h-full place-items-center bg-[#7d3229] font-serif text-[clamp(28px,5vw,60px)] text-[#f9df9d]">{credential.name?.slice(0,1) || "V"}</div>}</div>
        <div className="absolute left-[34%] top-[39%] z-10 max-w-[44%]"><p className="font-serif text-[clamp(15px,3vw,33px)] font-semibold leading-[1.05] text-[#4a1019]">{credential.name || "Vedic Tatva Pandit"}</p><p className="mt-1 text-[clamp(8px,1.3vw,14px)] font-medium">{specialty}</p><div className="mt-[7%] inline-block rounded-lg border border-[#c29032] bg-[#58101a] px-[5%] py-[3%] font-mono text-[clamp(9px,1.65vw,18px)] tracking-[.1em] text-[#ffe9a1]">{credential.registrationNo}</div><p className="mt-1 text-[clamp(6px,1vw,11px)] font-semibold uppercase tracking-wide text-[#704c38]">Pandit Registration No.</p><p className="mt-[7%] text-[clamp(8px,1.25vw,14px)] font-semibold">{credential.city || "Approved location"}{credential.state ? `, ${credential.state}` : ""}</p></div>
        <TempleArt/><svg viewBox="0 0 200 200" className="vt-card-mandala fill-none stroke-current stroke-[1]"><circle cx="100" cy="100" r="78"/><circle cx="100" cy="100" r="56"/><path d="m100 20 18 80-18 80-18-80 18-80Zm80 80-80 18-80-18 80-18 80 18Z"/></svg>
        <div className="vt-card-maroon absolute inset-x-0 bottom-0 flex h-[12%] items-center justify-center gap-3 font-serif text-[clamp(9px,1.8vw,20px)] tracking-[.16em] text-[#f4d27b]"><span className="h-px w-[12%] bg-[#d9b35d]"/>LIFETIME MEMBERSHIP<span className="h-px w-[12%] bg-[#d9b35d]"/></div>
      </div>
      <div className="vt-membership-card__face vt-card-flip__side vt-card-flip__back">
        <div className="vt-card-maroon absolute inset-x-0 top-0 h-[22%]"/><div className="vt-card-gold-line absolute inset-x-0 top-[21%] h-[5px]"/><div className="absolute left-[7%] top-[5%] flex items-center gap-2 text-[#f5d98d]"><span className="h-11 w-11"><LotusMark/></span><div className="font-serif text-[clamp(15px,2.7vw,29px)] tracking-[.06em]">VEDIC TATVA<div className="text-[clamp(6px,1vw,10px)] font-sans font-bold tracking-[.22em]">THE VOICE OF VEDAS</div></div></div><div className="vt-card-verified absolute right-[6%] top-[7%] rounded-full px-2 py-1 text-[clamp(6px,.9vw,10px)] font-bold uppercase">{isVerified ? "Verified Pandit" : "Inactive credential"}</div>
        <div className="absolute left-[8%] top-[31%] w-[39%]"><p className="text-[clamp(9px,1.5vw,15px)] leading-snug">This card certifies a registered Vedic Tatva Pandit and Lifetime Member.</p><div className="mt-[9%] space-y-[5%] text-[clamp(7px,1.1vw,12px)]"><p><b className="mr-2 uppercase tracking-wide text-[#75411e]">Pandit</b>{credential.name || "Vedic Tatva Pandit"}</p><p><b className="mr-2 uppercase tracking-wide text-[#75411e]">Registration</b><span className="font-mono">{credential.registrationNo}</span></p><p><b className="mr-2 uppercase tracking-wide text-[#75411e]">Location</b>{credential.city || "Approved location"}{credential.state ? `, ${credential.state}` : ""}</p></div></div>
        <div className="absolute left-[53%] top-[29%] w-[28%] text-center"><div className="vt-card-qr mx-auto aspect-square rounded-xl p-2">{qr ? <img src={qr} className="h-full w-full" alt={`QR code to verify registration ${credential.registrationNo}`}/> : <div className="h-full animate-pulse bg-[#eadbbb]"/>}</div><p className="mt-2 text-[clamp(7px,1vw,11px)] font-bold uppercase tracking-wide">Scan to verify this Pandit</p><p className="mt-1 break-all font-mono text-[clamp(5px,.72vw,8px)] text-[#704c38]">{verifyPath}</p></div>
        <div className="absolute right-[5%] top-[31%] flex w-[13%] flex-col items-center gap-2 text-center text-[clamp(6px,.85vw,10px)] font-bold uppercase leading-tight text-[#5b1720]"><IndiaMark/><span>Lifetime<br/>Member</span><span className="border-t border-[#d8b967] pt-2">Serving dharma</span></div><TempleArt/><div className="vt-card-maroon absolute inset-x-0 bottom-0 flex h-[14%] items-center justify-center font-serif text-[clamp(8px,1.35vw,15px)] tracking-[.13em] text-[#f4d27b]">VEDICTATVA.COM&nbsp;&nbsp; · &nbsp;&nbsp;LIFETIME MEMBERSHIP</div>
      </div>
    </div>
  </section>;
}