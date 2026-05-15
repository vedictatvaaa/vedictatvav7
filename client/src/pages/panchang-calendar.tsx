import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { ChevronLeft, ChevronRight, Download, Calendar, Star, Moon, Sun, Loader2, ArrowLeft, Clock, Sparkles, ShieldCheck, Globe, BookOpen, Bell } from "lucide-react";
import PageAPlusContent from "@/components/PageAPlusContent";
import jsPDF from "jspdf";
import { RelatedServicesSection } from "@/components/RelatedServices";
import { DailyRecommendations } from "@/pages/home";
import PageSeo from "@/components/PageSeo";

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAY_HEADERS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAY_MAP: Record<string, number> = { "Sunday": 0, "Monday": 1, "Tuesday": 2, "Wednesday": 3, "Thursday": 4, "Friday": 5, "Saturday": 6 };

interface PanchangDay {
  date: number;
  day: string;
  tithi: string;
  nakshatra: string;
  paksha: string;
  festival: string | null;
  auspicious: boolean;
}

interface MonthData {
  year: number;
  month: number;
  monthName: string;
  hinduMonth: string;
  samvat: string;
  days: PanchangDay[];
}

export default function PanchangCalendar() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [selectedDay, setSelectedDay] = useState<PanchangDay | null>(null);
  const [downloading, setDownloading] = useState(false);
  const calRef = useRef<HTMLDivElement>(null);


  const { data, isLoading, error } = useQuery<MonthData>({
    queryKey: ["/api/panchang/yearly", year, month],
    queryFn: async () => {
      const res = await fetch(`/api/panchang/yearly/${year}/${month}`);
      if (!res.ok) throw new Error("Failed to load panchang data");
      return res.json();
    },
    staleTime: 24 * 60 * 60 * 1000,
    retry: 2,
  });

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(y => y - 1); }
    else setMonth(m => m - 1);
    setSelectedDay(null);
  };

  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear(y => y + 1); }
    else setMonth(m => m + 1);
    setSelectedDay(null);
  };

  const firstDayOfMonth = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();

  const getDay = (date: number): PanchangDay | undefined => {
    return data?.days?.find(d => d.date === date);
  };

  const upcomingFestival = (() => {
    if (!data?.days?.length) return null;
    const today = new Date();
    const isCurrentMonth = today.getFullYear() === year && today.getMonth() + 1 === month;
    const fromDate = isCurrentMonth ? today.getDate() : 1;
    return data.days.find(d => d.festival && d.date >= fromDate) || data.days.find(d => d.festival) || null;
  })();

  const downloadFestivalIcs = () => {
    if (!upcomingFestival || !upcomingFestival.festival) return;
    const pad = (n: number) => String(n).padStart(2, "0");
    const y = year, m = month, d = upcomingFestival.date;
    const dtStart = `${y}${pad(m)}${pad(d)}`;
    const next = new Date(y, m - 1, d + 1);
    const dtEnd = `${next.getFullYear()}${pad(next.getMonth() + 1)}${pad(next.getDate())}`;
    const dtStamp = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    const safeTitle = upcomingFestival.festival.replace(/[\r\n,;\\]/g, " ");
    const desc = `Tithi: ${upcomingFestival.tithi || "—"} · Nakshatra: ${upcomingFestival.nakshatra || "—"} · ${upcomingFestival.paksha || ""}. Source: Vedic Tatva Panchang.`;
    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Vedic Tatva//Panchang//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "BEGIN:VEVENT",
      `UID:vt-${y}${pad(m)}${pad(d)}-${safeTitle.replace(/\s+/g, "-").toLowerCase()}@vedictatva.com`,
      `DTSTAMP:${dtStamp}`,
      `DTSTART;VALUE=DATE:${dtStart}`,
      `DTEND;VALUE=DATE:${dtEnd}`,
      `SUMMARY:${safeTitle}`,
      `DESCRIPTION:${desc.replace(/\\/g, "\\\\").replace(/,/g, "\\,").replace(/;/g, "\\;")}`,
      "URL:https://vedictatva.com/panchang-calendar",
      "BEGIN:VALARM",
      "TRIGGER:-P1D",
      "ACTION:DISPLAY",
      `DESCRIPTION:Reminder — ${safeTitle} tomorrow`,
      "END:VALARM",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");
    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vedictatva-${safeTitle.replace(/\s+/g, "-").toLowerCase()}-${dtStart}.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const generatePDF = async () => {
    if (!data?.days?.length) return;
    setDownloading(true);

    try {
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 12;

      pdf.setFillColor(109, 43, 53);
      pdf.rect(0, 0, pageWidth, 40, "F");

      pdf.setFillColor(212, 175, 55);
      pdf.rect(0, 38, pageWidth, 2, "F");

      pdf.setTextColor(212, 175, 55);
      pdf.setFontSize(10);
      pdf.text("ॐ", margin + 2, 16);

      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(22);
      pdf.setFont("helvetica", "bold");
      pdf.text("Vedic Tatva", margin + 10, 17);

      pdf.setFontSize(8);
      pdf.setFont("helvetica", "normal");
      pdf.text("Where Tradition Meets Technology", margin + 10, 23);

      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      pdf.text(`Panchang Calendar — ${MONTH_NAMES[month - 1]} ${year}`, margin + 10, 33);

      if (data.hinduMonth) {
        pdf.setFontSize(9);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(255, 255, 255);
        const hmText = `Hindu Month: ${data.hinduMonth}  |  Vikram Samvat: ${data.samvat || ""}`;
        pdf.text(hmText, pageWidth - margin - 2, 33, { align: "right" });
      }

      let yPos = 48;

      pdf.setFillColor(245, 240, 230);
      pdf.rect(margin, yPos, pageWidth - margin * 2, 8, "F");
      pdf.setTextColor(109, 43, 53);
      pdf.setFontSize(8);
      pdf.setFont("helvetica", "bold");
      const colWidth = (pageWidth - margin * 2) / 7;
      DAY_HEADERS.forEach((d, i) => {
        pdf.text(d, margin + colWidth * i + colWidth / 2, yPos + 5.5, { align: "center" });
      });
      yPos += 10;

      const rowHeight = 28;
      let col = firstDayOfMonth;
      let row = 0;

      for (let date = 1; date <= daysInMonth; date++) {
        const dayData = getDay(date);
        const x = margin + col * colWidth;
        const y = yPos + row * rowHeight;

        if (y + rowHeight > pageHeight - 30) {
          pdf.addPage();

          pdf.setFillColor(109, 43, 53);
          pdf.rect(0, 0, pageWidth, 12, "F");
          pdf.setTextColor(255, 255, 255);
          pdf.setFontSize(8);
          pdf.setFont("helvetica", "bold");
          pdf.text(`Vedic Tatva — Panchang ${MONTH_NAMES[month - 1]} ${year} (contd.)`, margin, 8);

          yPos = 18;
          row = 0;

          pdf.setFillColor(245, 240, 230);
          pdf.rect(margin, yPos, pageWidth - margin * 2, 8, "F");
          pdf.setTextColor(109, 43, 53);
          pdf.setFontSize(8);
          pdf.setFont("helvetica", "bold");
          DAY_HEADERS.forEach((d, i) => {
            pdf.text(d, margin + colWidth * i + colWidth / 2, yPos + 5.5, { align: "center" });
          });
          yPos += 10;
        }

        const cellY = yPos + row * rowHeight;

        pdf.setDrawColor(220, 210, 200);
        pdf.setLineWidth(0.2);
        pdf.rect(x, cellY, colWidth, rowHeight);

        if (dayData?.festival) {
          pdf.setFillColor(255, 248, 235);
          pdf.rect(x + 0.1, cellY + 0.1, colWidth - 0.2, rowHeight - 0.2, "F");
        }
        if (dayData?.auspicious) {
          pdf.setFillColor(240, 255, 240);
          pdf.rect(x + 0.1, cellY + 0.1, colWidth - 0.2, rowHeight - 0.2, "F");
        }

        pdf.setTextColor(109, 43, 53);
        pdf.setFontSize(11);
        pdf.setFont("helvetica", "bold");
        pdf.text(String(date), x + 2, cellY + 5.5);

        if (dayData) {
          pdf.setTextColor(90, 74, 58);
          pdf.setFontSize(5.5);
          pdf.setFont("helvetica", "normal");
          const tithiShort = dayData.tithi.length > 22 ? dayData.tithi.substring(0, 22) + "." : dayData.tithi;
          pdf.text(tithiShort, x + 1.5, cellY + 10);

          pdf.setFontSize(5);
          const nakShort = dayData.nakshatra.length > 22 ? dayData.nakshatra.substring(0, 22) + "." : dayData.nakshatra;
          pdf.text(nakShort, x + 1.5, cellY + 14);

          if (dayData.festival) {
            pdf.setTextColor(212, 175, 55);
            pdf.setFontSize(5);
            pdf.setFont("helvetica", "bold");
            const festShort = dayData.festival.length > 22 ? dayData.festival.substring(0, 22) + "." : dayData.festival;
            pdf.text(festShort, x + 1.5, cellY + 18);
          }
        }

        col++;
        if (col > 6) { col = 0; row++; }
      }

      const footerY = pageHeight - 18;
      pdf.setFillColor(109, 43, 53);
      pdf.rect(0, footerY, pageWidth, 18, "F");

      pdf.setTextColor(212, 175, 55);
      pdf.setFontSize(7);
      pdf.setFont("helvetica", "bold");
      pdf.text("Vedic Tatva Private Limited", margin, footerY + 5);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(6);
      pdf.text("www.vedictatva.com  |  ecom@vedictatva.com  |  +91-8447-8447-02", margin, footerY + 9);
      pdf.text("Where Tradition Meets Technology — Premium Spiritual Products & Services", margin, footerY + 13);

      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(5);
      pdf.text("AI-Generated Panchang by Vedic Tatva. For reference only.", pageWidth - margin, footerY + 13, { align: "right" });

      const totalPages = pdf.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setTextColor(245, 240, 230);
        pdf.setFontSize(50);
        pdf.setFont("helvetica", "bold");
        const wmX = pageWidth / 2;
        const wmY = pageHeight / 2;
        pdf.saveGraphicsState();
        pdf.setGState(new (pdf as any).GState({ opacity: 0.06 }));
        pdf.text("VEDIC TATVA", wmX, wmY, { align: "center", angle: 35 });
        pdf.restoreGraphicsState();
      }

      pdf.save(`Vedic-Tatva-Panchang-${MONTH_NAMES[month - 1]}-${year}.pdf`);
    } catch (err) {
      console.error("PDF generation failed:", err);
    } finally {
      setDownloading(false);
    }
  };

  const generateFullYearPDF = async () => {
    setDownloading(true);
    try {
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 12;

      pdf.setFillColor(109, 43, 53);
      pdf.rect(0, 0, pageWidth, 60, "F");
      pdf.setFillColor(212, 175, 55);
      pdf.rect(0, 58, pageWidth, 2, "F");

      pdf.setTextColor(212, 175, 55);
      pdf.setFontSize(14);
      pdf.text("ॐ", pageWidth / 2 - 2, 18, { align: "center" });

      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(28);
      pdf.setFont("helvetica", "bold");
      pdf.text("Vedic Tatva", pageWidth / 2, 30, { align: "center" });

      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      pdf.text("Where Tradition Meets Technology", pageWidth / 2, 38, { align: "center" });

      pdf.setFontSize(16);
      pdf.setFont("helvetica", "bold");
      pdf.text(`Hindu Panchang Calendar ${year}`, pageWidth / 2, 50, { align: "center" });

      pdf.setTextColor(109, 43, 53);
      pdf.setFontSize(10);
      pdf.text("AI-Powered Yearly Panchang with Tithi, Nakshatra & Festivals", pageWidth / 2, 72, { align: "center" });

      pdf.setFontSize(8);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(90, 74, 58);
      pdf.text("www.vedictatva.com  |  ecom@vedictatva.com  |  +91-8447-8447-02", pageWidth / 2, 80, { align: "center" });
      pdf.text("Vedic Tatva Private Limited, Delhi, India", pageWidth / 2, 86, { align: "center" });

      pdf.setFillColor(245, 240, 230);
      pdf.roundedRect(margin + 20, 95, pageWidth - margin * 2 - 40, 30, 3, 3, "F");
      pdf.setTextColor(109, 43, 53);
      pdf.setFontSize(8);
      pdf.setFont("helvetica", "bold");
      pdf.text("Legend:", margin + 25, 104);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(7);
      pdf.setFillColor(255, 248, 235);
      pdf.rect(margin + 25, 108, 5, 3, "F");
      pdf.setTextColor(90, 74, 58);
      pdf.text("Festival / Vrat Day", margin + 32, 110.5);
      pdf.setFillColor(240, 255, 240);
      pdf.rect(margin + 25, 114, 5, 3, "F");
      pdf.text("Auspicious Day", margin + 32, 116.5);

      for (let m = 1; m <= 12; m++) {
        pdf.addPage();

        pdf.setFillColor(109, 43, 53);
        pdf.rect(0, 0, pageWidth, 25, "F");
        pdf.setFillColor(212, 175, 55);
        pdf.rect(0, 23, pageWidth, 2, "F");

        pdf.setTextColor(212, 175, 55);
        pdf.setFontSize(8);
        pdf.text("ॐ", margin + 2, 10);
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(10);
        pdf.setFont("helvetica", "bold");
        pdf.text("Vedic Tatva", margin + 8, 10);

        pdf.setFontSize(14);
        pdf.text(`${MONTH_NAMES[m - 1]} ${year}`, pageWidth / 2, 10, { align: "center" });

        pdf.setFontSize(8);
        pdf.setFont("helvetica", "normal");
        pdf.text(`Generating...`, pageWidth / 2, 17, { align: "center" });

        let monthData: MonthData | null = null;
        try {
          const res = await fetch(`/api/panchang/yearly/${year}/${m}`);
          if (res.ok) monthData = await res.json();
        } catch {}

        pdf.setPage(pdf.getNumberOfPages());

        if (monthData?.hinduMonth) {
          pdf.setFillColor(109, 43, 53);
          pdf.rect(0, 0, pageWidth, 25, "F");
          pdf.setFillColor(212, 175, 55);
          pdf.rect(0, 23, pageWidth, 2, "F");

          pdf.setTextColor(212, 175, 55);
          pdf.setFontSize(8);
          pdf.text("ॐ", margin + 2, 10);
          pdf.setTextColor(255, 255, 255);
          pdf.setFontSize(10);
          pdf.setFont("helvetica", "bold");
          pdf.text("Vedic Tatva", margin + 8, 10);

          pdf.setFontSize(14);
          pdf.text(`${MONTH_NAMES[m - 1]} ${year}`, pageWidth / 2, 10, { align: "center" });
          pdf.setFontSize(8);
          pdf.setFont("helvetica", "normal");
          pdf.text(`${monthData.hinduMonth}  |  Vikram Samvat ${monthData.samvat || ""}`, pageWidth / 2, 17, { align: "center" });
        }

        let yPos = 30;
        const colWidth = (pageWidth - margin * 2) / 7;
        const rowH = 28;

        pdf.setFillColor(245, 240, 230);
        pdf.rect(margin, yPos, pageWidth - margin * 2, 8, "F");
        pdf.setTextColor(109, 43, 53);
        pdf.setFontSize(8);
        pdf.setFont("helvetica", "bold");
        DAY_HEADERS.forEach((d, i) => {
          pdf.text(d, margin + colWidth * i + colWidth / 2, yPos + 5.5, { align: "center" });
        });
        yPos += 10;

        const mDays = new Date(year, m, 0).getDate();
        const fDay = new Date(year, m - 1, 1).getDay();
        let col = fDay;
        let row = 0;

        for (let date = 1; date <= mDays; date++) {
          const dayD = monthData?.days?.find((d: PanchangDay) => d.date === date);
          const x = margin + col * colWidth;
          const cellY = yPos + row * rowH;

          if (cellY + rowH > pageHeight - 22) break;

          pdf.setDrawColor(220, 210, 200);
          pdf.setLineWidth(0.2);
          pdf.rect(x, cellY, colWidth, rowH);

          if (dayD?.festival) {
            pdf.setFillColor(255, 248, 235);
            pdf.rect(x + 0.1, cellY + 0.1, colWidth - 0.2, rowH - 0.2, "F");
          } else if (dayD?.auspicious) {
            pdf.setFillColor(240, 255, 240);
            pdf.rect(x + 0.1, cellY + 0.1, colWidth - 0.2, rowH - 0.2, "F");
          }

          pdf.setTextColor(109, 43, 53);
          pdf.setFontSize(11);
          pdf.setFont("helvetica", "bold");
          pdf.text(String(date), x + 2, cellY + 5.5);

          if (dayD) {
            pdf.setTextColor(90, 74, 58);
            pdf.setFontSize(5.5);
            pdf.setFont("helvetica", "normal");
            pdf.text(dayD.tithi.substring(0, 22), x + 1.5, cellY + 10);
            pdf.setFontSize(5);
            pdf.text(dayD.nakshatra.substring(0, 22), x + 1.5, cellY + 14);
            if (dayD.festival) {
              pdf.setTextColor(212, 175, 55);
              pdf.setFontSize(5);
              pdf.setFont("helvetica", "bold");
              pdf.text(dayD.festival.substring(0, 22), x + 1.5, cellY + 18);
            }
          }

          col++;
          if (col > 6) { col = 0; row++; }
        }

        const fY = pageHeight - 18;
        pdf.setFillColor(109, 43, 53);
        pdf.rect(0, fY, pageWidth, 18, "F");
        pdf.setTextColor(212, 175, 55);
        pdf.setFontSize(7);
        pdf.setFont("helvetica", "bold");
        pdf.text("Vedic Tatva Private Limited", margin, fY + 5);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(6);
        pdf.text("www.vedictatva.com  |  ecom@vedictatva.com  |  +91-8447-8447-02", margin, fY + 9);
        pdf.text(`Page ${m} of 12`, pageWidth - margin, fY + 5, { align: "right" });
      }

      const totalPages = pdf.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setTextColor(245, 240, 230);
        pdf.setFontSize(50);
        pdf.setFont("helvetica", "bold");
        pdf.saveGraphicsState();
        pdf.setGState(new (pdf as any).GState({ opacity: 0.06 }));
        pdf.text("VEDIC TATVA", pageWidth / 2, pageHeight / 2, { align: "center", angle: 35 });
        pdf.restoreGraphicsState();
      }

      pdf.save(`Vedic-Tatva-Panchang-${year}-Full-Year.pdf`);
    } catch (err) {
      console.error("Full year PDF failed:", err);
    } finally {
      setDownloading(false);
    }
  };

  const isToday = (date: number) => {
    const today = new Date();
    return today.getFullYear() === year && today.getMonth() + 1 === month && today.getDate() === date;
  };

  return (
    <div className="min-h-screen bg-[#FBF7EE]">
      <PageSeo
        title="Hindu Panchang Calendar — Tithi, Nakshatra, Festivals & Muhurat | Vedic Tatva"
        description="Free Hindu Panchang calendar with daily tithi, nakshatra, yoga, karana, sunrise/sunset, festivals, vrat days and shubh muhurat — covering every month of the Hindu year."
        canonical="/panchang-calendar"
      />
      <section className="bg-[#6D2B35] text-white relative border-b border-[#D4AF37]/30">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/40 to-transparent" aria-hidden="true" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/40 to-transparent" aria-hidden="true" />
        <div className="container mx-auto px-4 py-10 sm:py-12 relative z-10">
          <Link href="/" className="inline-flex items-center gap-1.5 text-white/65 hover:text-[#D4AF37] text-[12px] mb-5 transition-colors" data-testid="link-back-home">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Home
          </Link>
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-5">
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <span className="h-px w-6 bg-[#D4AF37]" />
                <span className="text-[#D4AF37] text-[10px] uppercase tracking-[0.3em] font-semibold">Hindu Panchang</span>
              </div>
              <h1 className="font-serif text-3xl sm:text-4xl font-semibold mb-2 leading-tight flex items-center gap-3" data-testid="text-panchang-title">
                <Calendar className="h-7 w-7 text-[#D4AF37]" strokeWidth={1.6} />
                Aaj Ka Panchang Calendar
              </h1>
              <p className="text-white/70 text-[13px] max-w-xl leading-relaxed">
                AI-powered yearly Panchang with Tithi, Nakshatra, Festivals and Auspicious Days.
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={generatePDF}
                disabled={downloading || !data?.days?.length}
                className="inline-flex items-center gap-2 px-4 h-10 bg-[#D4AF37] hover:bg-[#c4a030] text-[#3a1a20] font-semibold text-[12px] uppercase tracking-wider rounded-md border border-[#D4AF37] transition-colors disabled:opacity-50"
                data-testid="btn-download-month"
              >
                {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                Month PDF
              </button>
              <button
                onClick={generateFullYearPDF}
                disabled={downloading}
                className="inline-flex items-center gap-2 px-4 h-10 bg-transparent hover:bg-white/10 text-[#D4AF37] font-semibold text-[12px] uppercase tracking-wider rounded-md border border-[#D4AF37]/45 transition-colors disabled:opacity-50"
                data-testid="btn-download-year"
              >
                {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                Full Year PDF
              </button>
              {upcomingFestival && upcomingFestival.festival && (
                <button
                  onClick={downloadFestivalIcs}
                  className="inline-flex items-center gap-2 px-4 h-10 bg-transparent hover:bg-white/10 text-[#D4AF37] font-semibold text-[12px] uppercase tracking-wider rounded-md border border-[#D4AF37]/45 transition-colors"
                  data-testid="btn-add-festival-calendar"
                  title={`Add ${upcomingFestival.festival} (${upcomingFestival.date} ${MONTH_NAMES[month - 1]}) to your calendar`}
                >
                  <Calendar className="h-4 w-4" />
                  Add {upcomingFestival.festival.length > 16 ? upcomingFestival.festival.slice(0, 16) + "…" : upcomingFestival.festival} to Calendar
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      <DailyRecommendations defaultExpanded />

      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6" data-testid="month-navigator">
          <button onClick={prevMonth} className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md bg-white border border-[#D4AF37]/30 text-[#6D2B35] hover:bg-[#6D2B35]/5 transition-colors text-[12px] font-semibold uppercase tracking-wider" data-testid="btn-prev-month">
            <ChevronLeft className="h-3.5 w-3.5" /> Prev
          </button>
          <div className="text-center">
            <h2 className="font-serif text-xl sm:text-2xl font-semibold text-[#6D2B35]" data-testid="text-current-month">
              {MONTH_NAMES[month - 1]} {year}
            </h2>
            {data?.hinduMonth && (
              <p className="text-[12px] text-[#5a4a3a]/65 mt-1" data-testid="text-hindu-month">
                {data.hinduMonth} · विक्रम संवत {data.samvat}
              </p>
            )}
          </div>
          <button onClick={nextMonth} className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md bg-white border border-[#D4AF37]/30 text-[#6D2B35] hover:bg-[#6D2B35]/5 transition-colors text-[12px] font-semibold uppercase tracking-wider" data-testid="btn-next-month">
            Next <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="flex items-center gap-4 mb-5 text-[11px] text-[#5a4a3a]/65 justify-center flex-wrap">
          <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-amber-100 border border-amber-300" /> Festival / Vrat</span>
          <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-100 border border-emerald-300" /> Auspicious</span>
          <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-[#6D2B35]" /> Today</span>
        </div>

        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20" data-testid="loading-panchang">
            <Loader2 className="h-10 w-10 animate-spin text-[#6D2B35] mb-4" />
            <p className="text-[#5a4a3a]/70 text-sm">Generating Panchang for {MONTH_NAMES[month - 1]} {year}...</p>
            <p className="text-[#5a4a3a]/50 text-xs mt-1">This may take a few seconds (AI-powered)</p>
          </div>
        )}

        {error && (
          <div className="text-center py-16" data-testid="error-panchang">
            <p className="text-red-600 font-medium">Failed to load Panchang data.</p>
            <p className="text-[#5a4a3a]/60 text-sm mt-1">Please try again or select a different month.</p>
          </div>
        )}

        {data?.days && !isLoading && (
          <div ref={calRef}>
            <div className="grid grid-cols-7 gap-0 border border-[#D4AF37]/25 rounded-lg overflow-hidden bg-white" data-testid="panchang-grid">
              {DAY_HEADERS.map(d => (
                <div key={d} className="bg-[#6D2B35] text-[#D4AF37] text-center py-2.5 text-[11px] sm:text-[12px] font-semibold uppercase tracking-[0.2em]">
                  {d}
                </div>
              ))}

              {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                <div key={`empty-${i}`} className="bg-[#FBF7EE]/60 min-h-[80px] sm:min-h-[110px] border-b border-r border-[#D4AF37]/15" />
              ))}

              {Array.from({ length: daysInMonth }).map((_, i) => {
                const date = i + 1;
                const dayData = getDay(date);
                const today = isToday(date);
                const hasFestival = !!dayData?.festival;
                const isAuspicious = dayData?.auspicious && !hasFestival;

                return (
                  <div
                    key={date}
                    onClick={() => setSelectedDay(dayData || null)}
                    className={`min-h-[80px] sm:min-h-[110px] p-1.5 sm:p-2 border-b border-r border-[#D4AF37]/15 cursor-pointer transition-colors relative bg-white hover:bg-[#FBF7EE]
                      ${today ? "bg-[#FBF7EE] ring-1 ring-[#6D2B35] ring-inset" : ""}
                      ${hasFestival ? "bg-amber-50/80" : ""}
                      ${isAuspicious ? "bg-emerald-50/60" : ""}
                    `}
                    data-testid={`panchang-day-${date}`}
                  >
                    <div className="flex items-start justify-between">
                      <span className={`text-sm sm:text-base font-semibold ${today ? "text-[#D4AF37] bg-[#6D2B35] w-6 h-6 sm:w-7 sm:h-7 rounded-md inline-flex items-center justify-center text-[11px] sm:text-[12px]" : "text-[#6D2B35]"}`}>
                        {date}
                      </span>
                      {hasFestival && <Star className="h-3 w-3 text-[#D4AF37] flex-shrink-0" strokeWidth={1.8} />}
                    </div>
                    {dayData && (
                      <div className="mt-1 space-y-0.5">
                        <p className="text-[9px] sm:text-[11px] text-[#5a4a3a]/75 leading-tight truncate">{dayData.tithi}</p>
                        <p className="text-[8px] sm:text-[10px] text-[#5a4a3a]/50 leading-tight truncate">{dayData.nakshatra}</p>
                        {dayData.festival && (
                          <p className="text-[8px] sm:text-[10px] font-semibold text-[#6D2B35] leading-tight truncate">{dayData.festival}</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {selectedDay && (
          <>
            <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setSelectedDay(null)} />
            <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-md mx-auto bg-white rounded-lg border border-[#D4AF37]/30 z-50 overflow-hidden" data-testid="day-detail-modal">
              <div className="bg-[#6D2B35] text-white p-5 border-b border-[#D4AF37]/30 relative">
                <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/40 to-transparent" aria-hidden="true" />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-serif text-3xl font-semibold">{selectedDay.date}</p>
                    <p className="text-white/70 text-[12px] mt-0.5">{MONTH_NAMES[month - 1]} {year} · {selectedDay.day}</p>
                  </div>
                  <button onClick={() => setSelectedDay(null)} className="w-8 h-8 rounded-md bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors" data-testid="btn-close-detail" aria-label="Close">
                    <ChevronRight className="h-4 w-4 rotate-90 hidden" />
                    <span aria-hidden="true">×</span>
                  </button>
                </div>
              </div>
              <div className="p-5 space-y-3.5">
                <div className="flex items-start gap-3">
                  <Moon className="h-4 w-4 text-[#6D2B35] mt-1 flex-shrink-0" strokeWidth={1.8} />
                  <div>
                    <p className="text-[10px] text-[#5a4a3a]/55 uppercase tracking-[0.2em] font-semibold">Tithi</p>
                    <p className="text-[13px] font-medium text-[#5a4a3a] mt-0.5">{selectedDay.tithi}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Star className="h-4 w-4 text-[#D4AF37] mt-1 flex-shrink-0" strokeWidth={1.8} />
                  <div>
                    <p className="text-[10px] text-[#5a4a3a]/55 uppercase tracking-[0.2em] font-semibold">Nakshatra</p>
                    <p className="text-[13px] font-medium text-[#5a4a3a] mt-0.5">{selectedDay.nakshatra}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Sun className="h-4 w-4 text-[#6D2B35] mt-1 flex-shrink-0" strokeWidth={1.8} />
                  <div>
                    <p className="text-[10px] text-[#5a4a3a]/55 uppercase tracking-[0.2em] font-semibold">Paksha</p>
                    <p className="text-[13px] font-medium text-[#5a4a3a] mt-0.5">{selectedDay.paksha}</p>
                  </div>
                </div>
                {selectedDay.festival && (
                  <div className="flex items-start gap-3 pt-1">
                    <Calendar className="h-4 w-4 text-[#D4AF37] mt-1 flex-shrink-0" strokeWidth={1.8} />
                    <div>
                      <p className="text-[10px] text-[#5a4a3a]/55 uppercase tracking-[0.2em] font-semibold">Festival / Vrat</p>
                      <p className="text-[13px] font-semibold text-[#6D2B35] mt-0.5">{selectedDay.festival}</p>
                    </div>
                  </div>
                )}
                {selectedDay.auspicious && (
                  <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-200 rounded-md text-[10px] uppercase tracking-[0.2em] text-emerald-700 font-semibold">
                    <Sparkles className="h-3 w-3" strokeWidth={2} />
                    Auspicious Day
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="rounded-lg border border-[#D4AF37]/20 bg-white p-5">
            <p className="text-[10px] uppercase tracking-[0.25em] text-[#D4AF37] font-semibold mb-2">Quick Year Navigation</p>
            <h3 className="font-serif text-base font-semibold text-[#6D2B35] mb-3">Jump to Year</h3>
            <div className="flex flex-wrap gap-1.5">
              {[2024, 2025, 2026, 2027, 2028].map(y => (
                <button
                  key={y}
                  onClick={() => { setYear(y); setSelectedDay(null); }}
                  className={`h-9 px-3 rounded-md text-[12px] font-semibold tracking-wider transition-colors border ${y === year ? "bg-[#6D2B35] text-[#D4AF37] border-[#6D2B35]" : "bg-[#FBF7EE] text-[#6D2B35] border-[#D4AF37]/30 hover:bg-[#6D2B35]/5"}`}
                  data-testid={`btn-year-${y}`}
                >
                  {y}
                </button>
              ))}
            </div>
          </div>
          <div className="rounded-lg border border-[#D4AF37]/20 bg-white p-5">
            <p className="text-[10px] uppercase tracking-[0.25em] text-[#D4AF37] font-semibold mb-2">Quick Month Jump</p>
            <h3 className="font-serif text-base font-semibold text-[#6D2B35] mb-3">Jump to Month</h3>
            <div className="grid grid-cols-4 gap-1">
              {MONTH_NAMES.map((m, i) => (
                <button
                  key={m}
                  onClick={() => { setMonth(i + 1); setSelectedDay(null); }}
                  className={`h-8 rounded-md text-[11px] font-semibold transition-colors border ${i + 1 === month ? "bg-[#6D2B35] text-[#D4AF37] border-[#6D2B35]" : "bg-[#FBF7EE] text-[#5a4a3a] border-[#D4AF37]/20 hover:bg-[#6D2B35]/5"}`}
                  data-testid={`btn-month-${i + 1}`}
                >
                  {m.substring(0, 3)}
                </button>
              ))}
            </div>
          </div>
          <div className="rounded-lg border border-[#D4AF37]/30 bg-[#6D2B35] text-white p-5 sm:col-span-2 lg:col-span-1 relative overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/40 to-transparent" aria-hidden="true" />
            <p className="text-[10px] uppercase tracking-[0.25em] text-[#D4AF37] font-semibold mb-2">Download</p>
            <h3 className="font-serif text-base font-semibold text-white mb-2">Full Year Panchang PDF</h3>
            <p className="text-white/65 text-[12px] mb-4 leading-relaxed">Complete yearly Panchang calendar as a printable PDF with Vedic Tatva branding.</p>
            <button
              onClick={generateFullYearPDF}
              disabled={downloading}
              className="inline-flex items-center justify-center gap-2 w-full h-10 px-5 bg-[#D4AF37] hover:bg-[#c4a030] text-[#3a1a20] font-semibold text-[12px] uppercase tracking-wider rounded-md border border-[#D4AF37] transition-colors disabled:opacity-50"
              data-testid="btn-download-full-year"
            >
              {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Download {year} PDF
            </button>
          </div>
        </div>

        <PageAPlusContent
          eyebrow="Why Read Panchang Daily"
          title="Aaj Ka Panchang — Tithi, Nakshatra, Yoga, Karana & Shubh Muhurat"
          intro="Panchang is the soul of Hindu time-keeping. It tells you the auspicious tithi, nakshatra, yoga, karana and the day's vaar — guiding when to start a new venture, perform puja, travel or take any major decision. Vedic Tatva's Panchang is calculated using authentic Vedic algorithms (Surya Siddhanta + Drik) for your exact city."
          trustBadges={[
            { value: "100%", label: "Free Panchang" },
            { value: "Daily", label: "Updated 4 AM" },
            { value: "City", label: "Location Based" },
            { value: "PDF", label: "Yearly Download" },
          ]}
          benefits={[
            { icon: Sun, title: "Sunrise & Sunset Times", body: "Accurate sunrise, sunset, moonrise and moonset times based on your exact geographic location — essential for vrat, sandhya and puja timings." },
            { icon: Star, title: "Tithi & Nakshatra", body: "Today's tithi (lunar day), current nakshatra (lunar mansion) and pada — with start/end times. Know the spiritual quality of every moment." },
            { icon: Clock, title: "Shubh Muhurat", body: "Abhijit, Brahma and Vijaya muhurat plus inauspicious Rahu Kaal, Yamaganda and Gulika kaal — never miss the right time." },
            { icon: Moon, title: "Yoga, Karana & Vaar", body: "Daily yoga (27 yogas), karana (11 karanas) and vaar (weekday) — essential elements for choosing wedding dates, griha pravesh and vehicle muhurat." },
            { icon: Calendar, title: "Festivals & Vrats", body: "Every Ekadashi, Pradosh, Sankashti, Purnima, Amavasya and major festival highlighted — never miss a vrat or shubh tithi." },
            { icon: Globe, title: "Location-Aware", body: "Panchang automatically adjusts for your city — Mumbai panchang differs from Delhi or Chennai by minutes that matter for muhurat." },
          ]}
          steps={[
            { title: "Open Aaj Ka Panchang", body: "Today's panchang loads instantly with all five elements — tithi, vaar, nakshatra, yoga and karana." },
            { title: "Check Shubh Muhurat", body: "Plan your work around Abhijit muhurat and avoid Rahu Kaal — both shown clearly with exact times." },
            { title: "Browse Calendar", body: "Move month-by-month or year-by-year to plan weddings, griha pravesh, mundan, namkaran and other ceremonies." },
            { title: "Download Yearly PDF", body: "Download the full year's panchang as a printable PDF — keep it on your puja shelf or share with family." },
          ]}
          faqs={[
            { q: "What is Panchang and why is it important?", a: "Panchang (literally 'five limbs') is the traditional Hindu calendar containing five elements: Tithi (lunar day), Vaar (weekday), Nakshatra (lunar mansion), Yoga and Karana. These together determine the spiritual quality of every moment — used for choosing muhurat, festivals, vrats and daily worship." },
            { q: "How is aaj ka panchang calculated?", a: "Vedic Tatva uses Drik Siddhanta (modern astronomical observations) combined with traditional Surya Siddhanta principles. Calculations adjust for your exact latitude, longitude and timezone — the same standard used by ISRO and the Indian government's Rashtriya Panchang." },
            { q: "What is Rahu Kaal and why should I avoid it?", a: "Rahu Kaal is a daily ~90-minute window considered inauspicious for starting new ventures, signing contracts or travel. It changes daily based on the weekday and sunrise time. Our panchang shows your city's exact Rahu Kaal each day." },
            { q: "When is Abhijit Muhurat?", a: "Abhijit Muhurat is the most auspicious window of the day — roughly 24 minutes around solar noon. It's considered universally shubh for any new beginning. Exact times vary by city and date — check the daily panchang." },
            { q: "How do I know today's tithi?", a: "Today's tithi (e.g. Shukla Ashtami, Krishna Chaturdashi) is shown at the top of aaj ka panchang along with its start and end time. Tithi changes don't align with midnight — they shift based on the moon's position." },
            { q: "Can I download a yearly panchang PDF?", a: "Yes — completely free. Use the 'Download Yearly PDF' button to get the full year's panchang formatted for printing. Many devotees keep a printed copy on their puja shelf." },
            { q: "Does the panchang work for my city?", a: "Yes — the panchang automatically adjusts for your geographic location. Tithi end-time, sunrise, sunset and Rahu Kaal in Mumbai differ from Delhi, Chennai or Bengaluru — all calculations are city-aware." },
            { q: "What are Ekadashi and Pradosh?", a: "Ekadashi is the 11th lunar day (twice a month) observed with fasting for spiritual merit. Pradosh is twilight on Trayodashi (13th lunar day) — sacred to Lord Shiva. Both are highlighted on the calendar so you never miss them." },
          ]}
          keywordsBlurb="Aaj ka panchang for today with accurate tithi, nakshatra, yoga, karana, vaar and shubh muhurat. Daily Hindu calendar with sunrise, sunset, Rahu Kaal, Abhijit Muhurat, Yamaganda and Gulika Kaal. City-wise panchang for Mumbai, Delhi, Bengaluru, Chennai, Kolkata, Hyderabad, Pune, Ahmedabad and 100+ Indian cities. Track Ekadashi, Pradosh, Purnima, Amavasya, Sankashti and all major Hindu festivals. Free yearly Hindu panchang PDF download."
        />

        <RelatedServicesSection context="panchang" currentPath="/panchang-calendar" />
      </div>
    </div>
  );
}