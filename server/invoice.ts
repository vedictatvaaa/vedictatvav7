import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import type { Order, Invoice } from "@shared/schema";

const COMPANY = {
  name: "VEDIC TATVA PRIVATE LIMITED",
  address: "Plot No.48, Shop No.4, Gali No.2, SKBD Associate, East Guru Angad Nagar, Nirman Vihar, New Delhi - 110092",
  gstin: "07AAKCV5620L1ZY",
  state: "Delhi",
  stateCode: "07",
  email: "ecom@vedictatva.com",
  phone: "8447-8447-02",
  website: "www.vedictatva.com",
  invoicePrefix: "VT",
  pan: "AAKCV5620L",
};

export function getFinancialYear(date: Date = new Date()): string {
  const month = date.getMonth();
  const year = date.getFullYear();
  if (month >= 3) return `${year}-${(year + 1).toString().slice(-2)}`;
  return `${year - 1}-${year.toString().slice(-2)}`;
}

export function generateInvoiceNumber(seq: number, fy: string): string {
  return `${COMPANY.invoicePrefix}/${fy}/${seq.toString().padStart(5, "0")}`;
}

interface InvoiceItem {
  name: string;
  quantity: number;
  price: number;
  gstPercent: number;
  hsnCode?: string;
  category?: string;
}

export function calculateGST(items: InvoiceItem[], customerState?: string, totalDiscount: number = 0) {
  const isIgst = customerState ? customerState.toLowerCase() !== COMPANY.state.toLowerCase() : false;
  let subtotal = 0;
  let totalCgst = 0;
  let totalSgst = 0;
  let totalIgst = 0;

  // Calculate total item value for proportional discount distribution
  const itemsTotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const breakdown = items.map((item) => {
    const itemTotal = item.price * item.quantity;
    // Distribute discount proportionally across items
    const itemDiscount = itemsTotal > 0 ? Math.round(totalDiscount * itemTotal / itemsTotal) : 0;
    const effectiveTotal = itemTotal - itemDiscount;
    const gstRate = item.gstPercent || 18;
    const taxableAmount = Math.round(effectiveTotal * 100 / (100 + gstRate));
    const gstAmount = effectiveTotal - taxableAmount;

    subtotal += taxableAmount;

    if (isIgst) {
      totalIgst += gstAmount;
      return { ...item, taxableAmount, igst: gstAmount, cgst: 0, sgst: 0, total: effectiveTotal, discount: itemDiscount };
    } else {
      const half = Math.round(gstAmount / 2);
      totalCgst += half;
      totalSgst += gstAmount - half;
      return { ...item, taxableAmount, igst: 0, cgst: half, sgst: gstAmount - half, total: effectiveTotal, discount: itemDiscount };
    }
  });

  const totalGst = totalCgst + totalSgst + totalIgst;
  const grandTotal = subtotal + totalGst;
  const roundOff = Math.round(grandTotal) - grandTotal;

  return { breakdown, subtotal, cgstAmount: totalCgst, sgstAmount: totalSgst, igstAmount: totalIgst, totalGst, grandTotal: Math.round(grandTotal), roundOff: Math.round(roundOff * 100) / 100, isIgst };
}

export async function generateInvoicePDF(order: Order, invoice: Invoice, items: InvoiceItem[]): Promise<string> {
  const dir = path.join(process.cwd(), "uploads", "invoices");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const filename = `${invoice.invoiceNumber.replace(/\//g, "-")}.pdf`;
  const filepath = path.join(dir, filename);
  const totalDiscount = ((order as any).couponDiscount || 0) + ((order as any).prepaidDiscount || 0);
  const gst = calculateGST(items, order.customerState || undefined, totalDiscount);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 40 });
    const stream = fs.createWriteStream(filepath);
    doc.pipe(stream);

    const pageWidth = doc.page.width - 80;

    doc.rect(0, 0, doc.page.width, 100).fill("#6D2B35");
    doc.fontSize(22).fill("#D4AF37").text("VEDIC TATVA", 40, 25, { width: pageWidth });
    doc.fontSize(8).fill("#FFFFFF").text(COMPANY.name, 40, 52);
    doc.text(`GSTIN: ${COMPANY.gstin} | PAN: ${COMPANY.pan}`, 40, 64);
    doc.text(`${COMPANY.address} | ${COMPANY.email} | ${COMPANY.phone}`, 40, 76);

    doc.fontSize(14).fill("#FFFFFF").text("TAX INVOICE", 380, 30, { width: 150, align: "right" });
    doc.fontSize(8).text(`Invoice: ${invoice.invoiceNumber}`, 380, 52, { width: 150, align: "right" });
    doc.text(`Date: ${new Date(invoice.createdAt || Date.now()).toLocaleDateString("en-IN")}`, 380, 64, { width: 150, align: "right" });
    doc.text(`Order #${order.id}`, 380, 76, { width: 150, align: "right" });

    let y = 115;
    doc.fill("#333333");

    doc.rect(40, y, pageWidth / 2 - 5, 80).lineWidth(0.5).stroke("#cccccc");
    doc.rect(40 + pageWidth / 2 + 5, y, pageWidth / 2 - 5, 80).lineWidth(0.5).stroke("#cccccc");

    doc.fontSize(8).fill("#6D2B35").text("BILL TO:", 48, y + 8);
    doc.fill("#333333").fontSize(9).text(order.customerName || "Customer", 48, y + 22);
    doc.fontSize(7).text(order.billingAddress || order.shippingAddress || "", 48, y + 36, { width: pageWidth / 2 - 25 });
    doc.text(`State: ${order.customerState || "N/A"} | Ph: ${order.customerPhone || "N/A"}`, 48, y + 52);
    doc.text(`Email: ${order.customerEmail || "N/A"}`, 48, y + 60);

    const x2 = 48 + pageWidth / 2 + 5;
    doc.fontSize(8).fill("#6D2B35").text("SHIP TO:", x2, y + 8);
    doc.fill("#333333").fontSize(9).text(order.customerName || "Customer", x2, y + 22);
    doc.fontSize(7).text(order.shippingAddress || order.billingAddress || "", x2, y + 36, { width: pageWidth / 2 - 25 });

    y += 95;

    const cols = [40, 190, 260, 300, 340, 375, 410, 445, 480];
    const colWidths = [150, 70, 40, 40, 35, 35, 35, 35, 55];

    doc.rect(40, y, pageWidth, 18).fill("#6D2B35");
    doc.fontSize(7).fill("#FFFFFF");
    const headers = ["Item", "HSN", "Qty", "Rate", "CGST%", "CGST", "SGST%", "SGST", "Total"];
    if (gst.isIgst) {
      headers[4] = "IGST%"; headers[5] = "IGST"; headers[6] = ""; headers[7] = "";
    }
    headers.forEach((h, i) => {
      if (h) doc.text(h, cols[i], y + 5, { width: colWidths[i], align: i > 0 ? "right" : "left" });
    });
    y += 18;

    doc.fill("#333333").fontSize(7);
    gst.breakdown.forEach((item, idx) => {
      if (y > 700) {
        doc.addPage();
        y = 40;
      }
      const bg = idx % 2 === 0 ? "#FAFAFA" : "#FFFFFF";
      doc.rect(40, y, pageWidth, 16).fill(bg);
      doc.fill("#333333");

      const gstRate = item.gstPercent || 18;
      const halfRate = gstRate / 2;

      doc.text(item.name.substring(0, 35), cols[0], y + 4, { width: colWidths[0] });
      doc.text(item.hsnCode || "-", cols[1], y + 4, { width: colWidths[1], align: "right" });
      doc.text(item.quantity.toString(), cols[2], y + 4, { width: colWidths[2], align: "right" });
      doc.text(`Rs.${(item.taxableAmount / item.quantity).toFixed(0)}`, cols[3], y + 4, { width: colWidths[3], align: "right" });

      if (gst.isIgst) {
        doc.text(`${gstRate}%`, cols[4], y + 4, { width: colWidths[4], align: "right" });
        doc.text(`Rs.${item.igst}`, cols[5], y + 4, { width: colWidths[5], align: "right" });
      } else {
        doc.text(`${halfRate}%`, cols[4], y + 4, { width: colWidths[4], align: "right" });
        doc.text(`Rs.${item.cgst}`, cols[5], y + 4, { width: colWidths[5], align: "right" });
        doc.text(`${halfRate}%`, cols[6], y + 4, { width: colWidths[6], align: "right" });
        doc.text(`Rs.${item.sgst}`, cols[7], y + 4, { width: colWidths[7], align: "right" });
      }
      doc.text(`Rs.${item.total}`, cols[8], y + 4, { width: colWidths[8], align: "right" });
      y += 16;
    });

    doc.moveTo(40, y).lineTo(40 + pageWidth, y).stroke("#cccccc");
    y += 10;

    const summaryX = 350;
    const summaryW = 185;
    const drawSummaryRow = (label: string, value: string, bold = false) => {
      if (bold) doc.font("Helvetica-Bold"); else doc.font("Helvetica");
      doc.fontSize(8).fill("#333333");
      doc.text(label, summaryX, y, { width: 100 });
      doc.text(value, summaryX + 100, y, { width: summaryW - 100, align: "right" });
      y += 14;
    };

    drawSummaryRow("Subtotal:", `Rs.${gst.subtotal}`);
    if (gst.isIgst) {
      drawSummaryRow("IGST:", `Rs.${gst.igstAmount}`);
    } else {
      drawSummaryRow("CGST:", `Rs.${gst.cgstAmount}`);
      drawSummaryRow("SGST:", `Rs.${gst.sgstAmount}`);
    }
    if (gst.roundOff !== 0) drawSummaryRow("Round Off:", `Rs.${gst.roundOff}`);

    const shippingCharges = (order as any).shippingCharges || 0;
    const codCharges = (order as any).codCharges || 0;
    if (shippingCharges > 0) drawSummaryRow("Shipping:", `Rs.${shippingCharges}`);
    if (codCharges > 0) drawSummaryRow("COD Charges:", `Rs.${codCharges}`);

    const invoiceTotal = gst.grandTotal + shippingCharges + codCharges;
    doc.moveTo(summaryX, y).lineTo(summaryX + summaryW, y).stroke("#6D2B35");
    y += 4;
    drawSummaryRow("Grand Total:", `Rs.${invoiceTotal}`, true);

    if (totalDiscount > 0) {
      doc.font("Helvetica").fontSize(7).fill("#666666");
      const couponAmt = (order as any).couponDiscount || 0;
      const prepaidAmt = (order as any).prepaidDiscount || 0;
      if (couponAmt > 0) {
        doc.text(`Coupon discount (${(order as any).couponCode || ""}): -Rs.${couponAmt}`, summaryX, y, { width: summaryW, align: "right" });
        y += 10;
      }
      if (prepaidAmt > 0) {
        doc.text(`Prepaid discount: -Rs.${prepaidAmt}`, summaryX, y, { width: summaryW, align: "right" });
        y += 10;
      }
      doc.text("(Discounts already applied to item rates above)", summaryX, y, { width: summaryW, align: "right" });
      y += 10;
    }

    y += 20;
    doc.font("Helvetica");
    if (y > 700) { doc.addPage(); y = 40; }

    doc.rect(40, y, pageWidth, 40).lineWidth(0.5).stroke("#cccccc");
    doc.fontSize(7).fill("#666666").text("Terms & Conditions:", 48, y + 5);
    doc.text("1. All disputes subject to Delhi jurisdiction.", 48, y + 15);
    doc.text("2. Goods once sold will not be taken back. Returns as per our return policy.", 48, y + 25);

    y += 50;
    doc.fontSize(8).fill("#333333").text("For Vedic Tatva Private Limited", 380, y, { width: 150, align: "right" });
    y += 20;
    doc.text("Authorized Signatory", 380, y, { width: 150, align: "right" });

    doc.rect(0, doc.page.height - 30, doc.page.width, 30).fill("#6D2B35");
    doc.fontSize(7).fill("#D4AF37").text("This is a computer generated invoice and does not require physical signature.", 40, doc.page.height - 22, { width: pageWidth, align: "center" });

    doc.end();

    stream.on("finish", () => resolve(filepath));
    stream.on("error", reject);
  });
}

interface DispatchLabelData {
  orderId: number;
  customerName: string;
  customerPhone?: string;
  shippingAddress: string;
  customerState?: string;
  customerCity?: string;
  customerPincode?: string;
  courierName?: string;
  trackingNumber?: string;
  waybill?: string;
  items: { name: string; quantity: number; sku?: string }[];
  dispatchDate?: string;
  paymentMode?: string;
  codAmount?: number;
  weightKg?: number;
}

// Render a Code-128 barcode as a PNG buffer (pure JS, no canvas).
async function renderBarcode(text: string, opts?: { scale?: number; height?: number; includetext?: boolean }): Promise<Buffer | null> {
  if (!text) return null;
  try {
    // @ts-ignore - bwip-js ships its own types but resolution can vary
    const bwipjs = (await import("bwip-js")).default as any;
    return await bwipjs.toBuffer({
      bcid: "code128",
      text,
      scale: opts?.scale ?? 3,
      height: opts?.height ?? 12,
      includetext: opts?.includetext ?? false,
      backgroundcolor: "FFFFFF",
      paddingwidth: 0,
      paddingheight: 0,
    });
  } catch {
    return null;
  }
}

async function renderQR(text: string, size = 80): Promise<Buffer | null> {
  if (!text) return null;
  try {
    const QRCode = (await import("qrcode")).default as any;
    return await QRCode.toBuffer(text, { width: size, margin: 0, errorCorrectionLevel: "M" });
  } catch {
    return null;
  }
}

// Amazon/eBay-style 4x6" thermal shipping label.
// One label per page; pure black & white for thermal printer compatibility.
// 4x6 inches at 72dpi = 288 x 432 pt. We use that exact page size so
// thermal printers (Zebra, Dymo, Rollo) print 1:1 with no scaling.
export async function generateDispatchLabelPDF(labels: DispatchLabelData[]): Promise<string> {
  const dir = path.join(process.cwd(), "uploads", "labels");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const filename = `dispatch-labels-${Date.now()}.pdf`;
  const filepath = path.join(dir, filename);

  // Pre-render all barcodes/QRs in parallel before writing the PDF.
  const assets = await Promise.all(labels.map(async (l) => {
    const code = l.waybill || l.trackingNumber || `ORD${l.orderId}`;
    const [awbBarcode, orderBarcode, qr] = await Promise.all([
      renderBarcode(code, { scale: 3, height: 18 }),
      renderBarcode(`ORD${l.orderId}`, { scale: 2, height: 8 }),
      renderQR(code, 120),
    ]);
    return { code, awbBarcode, orderBarcode, qr };
  }));

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: [288, 432], margin: 0 });
    const stream = fs.createWriteStream(filepath);
    doc.pipe(stream);

    labels.forEach((label, index) => {
      if (index > 0) doc.addPage({ size: [288, 432], margin: 0 });
      const a = assets[index];
      const W = 288;
      const PAD = 10;
      const INNER = W - PAD * 2;

      // Outer page border
      doc.lineWidth(1).rect(4, 4, W - 8, 432 - 8).stroke("#000000");

      // ----- Header band: courier + service tier -----
      let y = 8;
      doc.rect(8, y, W - 16, 30).fill("#000000");
      doc.fillColor("#FFFFFF").font("Helvetica-Bold").fontSize(13)
        .text((label.courierName || "STANDARD").toUpperCase(), PAD + 4, y + 9, { width: INNER - 90, ellipsis: true });
      // Service badge (right side)
      const isCOD = (label.paymentMode || "").toLowerCase() === "cod" || (label.codAmount ?? 0) > 0;
      const badge = isCOD ? "COD" : "PREPAID";
      doc.rect(W - PAD - 70, y + 5, 64, 20).lineWidth(1).stroke("#FFFFFF");
      doc.fillColor("#FFFFFF").font("Helvetica-Bold").fontSize(11)
        .text(badge, W - PAD - 70, y + 10, { width: 64, align: "center" });
      y += 30;

      // ----- FROM (small, top) -----
      doc.fillColor("#000000");
      doc.font("Helvetica-Bold").fontSize(7).text("SHIP FROM:", PAD, y + 4);
      doc.font("Helvetica-Bold").fontSize(8).text(COMPANY.name, PAD, y + 13, { width: INNER - 60 });
      doc.font("Helvetica").fontSize(7).fill("#000000")
        .text(COMPANY.address, PAD, y + 23, { width: INNER - 60, height: 22, ellipsis: true });
      doc.font("Helvetica").fontSize(6.5).text(`GSTIN: ${COMPANY.gstin}  |  ${COMPANY.phone}`, PAD, y + 47);
      y += 60;

      // Divider
      doc.lineWidth(0.5).moveTo(8, y).lineTo(W - 8, y).stroke("#000000");
      y += 4;

      // ----- SHIP TO (dominant block) -----
      doc.font("Helvetica-Bold").fontSize(8).text("SHIP TO:", PAD, y);
      y += 12;

      // Customer name — large, bold, all caps
      doc.font("Helvetica-Bold").fontSize(15).fillColor("#000000");
      const nameText = (label.customerName || "Customer").toUpperCase();
      doc.text(nameText, PAD, y, { width: INNER, ellipsis: true });
      y += doc.heightOfString(nameText, { width: INNER }) + 2;

      // Address (multi-line, bold)
      const addrLines: string[] = [];
      if (label.shippingAddress) addrLines.push(label.shippingAddress);
      const cityLine = [label.customerCity, label.customerState, label.customerPincode].filter(Boolean).join(", ");
      if (cityLine) addrLines.push(cityLine);
      const addrText = addrLines.join("\n");
      doc.font("Helvetica-Bold").fontSize(11)
        .text(addrText, PAD, y, { width: INNER, lineGap: 1 });
      y += doc.heightOfString(addrText, { width: INNER, lineGap: 1 }) + 4;

      if (label.customerPhone) {
        doc.font("Helvetica-Bold").fontSize(10)
          .text(`Tel: ${label.customerPhone}`, PAD, y);
        y += 13;
      }

      // ----- Meta strip (Order / Date / Items / Weight / COD amount) -----
      // Position above the AWB barcode block (which lives at bottom)
      const metaY = 300;
      doc.lineWidth(0.5).moveTo(8, metaY).lineTo(W - 8, metaY).stroke("#000000");

      const itemCount = label.items.reduce((s, it) => s + (it.quantity || 0), 0);
      const codText = isCOD && label.codAmount ? `COD ₹${label.codAmount.toLocaleString()}` : "";

      doc.fillColor("#000000").font("Helvetica").fontSize(7).text("ORDER", PAD, metaY + 4);
      doc.font("Helvetica-Bold").fontSize(11).text(`#${label.orderId}`, PAD, metaY + 13);

      doc.font("Helvetica").fontSize(7).text("DATE", PAD + 75, metaY + 4);
      doc.font("Helvetica-Bold").fontSize(9).text(label.dispatchDate || new Date().toLocaleDateString("en-IN"), PAD + 75, metaY + 14);

      doc.font("Helvetica").fontSize(7).text("ITEMS", PAD + 150, metaY + 4);
      doc.font("Helvetica-Bold").fontSize(11).text(String(itemCount || label.items.length), PAD + 150, metaY + 13);

      const wt = label.weightKg ? `${label.weightKg}kg` : "-";
      doc.font("Helvetica").fontSize(7).text("WEIGHT", PAD + 200, metaY + 4);
      doc.font("Helvetica-Bold").fontSize(9).text(wt, PAD + 200, metaY + 14);

      if (codText) {
        doc.font("Helvetica-Bold").fontSize(9).fillColor("#000000")
          .text(codText, PAD, metaY + 30, { width: INNER, align: "center" });
      }

      // ----- AWB / Waybill barcode (bottom hero) -----
      const barcodeY = 340;
      doc.lineWidth(0.5).moveTo(8, barcodeY).lineTo(W - 8, barcodeY).stroke("#000000");

      doc.font("Helvetica").fontSize(7).text("AWB / TRACKING", PAD, barcodeY + 4);

      if (a.awbBarcode) {
        // Barcode centered, ~80pt tall, almost full width
        doc.image(a.awbBarcode, PAD, barcodeY + 14, { width: INNER - 80, height: 50 });
      } else {
        doc.font("Helvetica-Bold").fontSize(11).text("[no AWB]", PAD, barcodeY + 30, { width: INNER - 80, align: "center" });
      }

      // QR code on the right (scan-to-track)
      if (a.qr) {
        doc.image(a.qr, W - PAD - 64, barcodeY + 12, { width: 64, height: 64 });
      }

      // Human-readable AWB beneath the barcode
      doc.font("Courier-Bold").fontSize(11).fillColor("#000000")
        .text(a.code, PAD, barcodeY + 70, { width: INNER - 80, align: "center" });

      // Footer slug
      doc.font("Helvetica").fontSize(6).fillColor("#000000")
        .text(`vedictatva.com  |  Generated ${new Date().toLocaleDateString("en-IN")}`, PAD, 420, { width: INNER, align: "center" });
    });

    doc.end();
    stream.on("finish", () => resolve(filepath));
    stream.on("error", reject);
  });
}

interface PackingSlipData {
  orderId: number;
  customerName: string;
  customerPhone?: string;
  shippingAddress: string;
  customerCity?: string;
  customerState?: string;
  customerPincode?: string;
  items: { name: string; quantity: number; sku?: string; price?: number }[];
  dispatchDate?: string;
  invoiceNumber?: string;
  notes?: string;
}

// A5 packing slip — designed to slip into the parcel along with the
// shipping label. Picker-friendly: big item names, big qty, SKU column,
// scannable order barcode at top. No prices by default (operator
// includes them only if the item row carries a price).
export async function generatePackingSlipPDF(slips: PackingSlipData[]): Promise<string> {
  const dir = path.join(process.cwd(), "uploads", "labels");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const filename = `packing-slips-${Date.now()}.pdf`;
  const filepath = path.join(dir, filename);

  const orderBarcodes = await Promise.all(slips.map((s) =>
    renderBarcode(`ORD${s.orderId}`, { scale: 2, height: 14 })
  ));

  return new Promise((resolve, reject) => {
    // A5 portrait = 420 x 595 pt. Fits two-up on A4 if needed.
    const doc = new PDFDocument({ size: "A5", margin: 24 });
    const stream = fs.createWriteStream(filepath);
    doc.pipe(stream);

    slips.forEach((s, idx) => {
      if (idx > 0) doc.addPage({ size: "A5", margin: 24 });
      const W = doc.page.width;
      const PAD = 24;
      const INNER = W - PAD * 2;
      let y = PAD;

      // Header band
      doc.rect(PAD, y, INNER, 36).fill("#6D2B35");
      doc.fillColor("#FFFFFF").font("Helvetica-Bold").fontSize(14)
        .text("PACKING SLIP", PAD + 10, y + 11);
      doc.fillColor("#D4AF37").font("Helvetica-Bold").fontSize(10)
        .text("VEDIC TATVA", PAD + INNER - 110, y + 13, { width: 100, align: "right" });
      y += 36;

      // Order header strip
      y += 8;
      doc.fillColor("#000000").font("Helvetica").fontSize(8).text("ORDER NUMBER", PAD, y);
      doc.font("Helvetica-Bold").fontSize(14).text(`#${s.orderId}`, PAD, y + 10);
      if (s.invoiceNumber) {
        doc.font("Helvetica").fontSize(8).text("INVOICE", PAD + 110, y);
        doc.font("Helvetica-Bold").fontSize(10).text(s.invoiceNumber, PAD + 110, y + 12);
      }
      doc.font("Helvetica").fontSize(8).text("DATE", PAD + INNER - 80, y);
      doc.font("Helvetica-Bold").fontSize(10).text(
        s.dispatchDate || new Date().toLocaleDateString("en-IN"),
        PAD + INNER - 80, y + 12
      );
      y += 36;

      // Order barcode (Code-128 of ORD{id})
      if (orderBarcodes[idx]) {
        doc.image(orderBarcodes[idx]!, PAD, y, { width: INNER, height: 32 });
        y += 36;
      }

      // Ship-to + ship-from columns
      const colW = (INNER - 12) / 2;
      doc.lineWidth(0.5).rect(PAD, y, colW, 78).stroke("#cccccc");
      doc.font("Helvetica-Bold").fontSize(7).fillColor("#888888").text("SHIP FROM", PAD + 6, y + 5);
      doc.font("Helvetica-Bold").fontSize(9).fillColor("#000000").text(COMPANY.name, PAD + 6, y + 14, { width: colW - 12 });
      doc.font("Helvetica").fontSize(7.5).text(COMPANY.address, PAD + 6, y + 28, { width: colW - 12, height: 36, ellipsis: true });

      const tx = PAD + colW + 12;
      doc.lineWidth(0.5).rect(tx, y, colW, 78).stroke("#000000");
      doc.font("Helvetica-Bold").fontSize(7).fillColor("#888888").text("SHIP TO", tx + 6, y + 5);
      doc.font("Helvetica-Bold").fontSize(11).fillColor("#000000")
        .text(s.customerName.toUpperCase(), tx + 6, y + 14, { width: colW - 12, ellipsis: true });
      const cityLine = [s.customerCity, s.customerState, s.customerPincode].filter(Boolean).join(", ");
      const addr = [s.shippingAddress, cityLine].filter(Boolean).join("\n");
      doc.font("Helvetica").fontSize(8).text(addr, tx + 6, y + 30, { width: colW - 12, height: 36, ellipsis: true });
      if (s.customerPhone) {
        doc.font("Helvetica-Bold").fontSize(8).text(`Tel: ${s.customerPhone}`, tx + 6, y + 64, { width: colW - 12 });
      }
      y += 86;

      // Items table header
      doc.rect(PAD, y, INNER, 22).fill("#F5EFE7");
      doc.fillColor("#000000").font("Helvetica-Bold").fontSize(9);
      doc.text("#", PAD + 6, y + 7, { width: 18 });
      doc.text("ITEM", PAD + 28, y + 7, { width: INNER - 28 - 60 - 50 });
      doc.text("SKU", PAD + INNER - 110, y + 7, { width: 60 });
      doc.text("QTY", PAD + INNER - 50, y + 7, { width: 44, align: "right" });
      y += 22;

      // Items rows
      doc.font("Helvetica").fontSize(9).fillColor("#000000");
      let totalQty = 0;
      s.items.forEach((it, i) => {
        const rowH = 18;
        if (y + rowH > doc.page.height - 60) {
          doc.addPage({ size: "A5", margin: 24 });
          y = PAD;
        }
        if (i % 2 === 0) {
          doc.rect(PAD, y, INNER, rowH).fill("#FAFAFA");
          doc.fillColor("#000000");
        }
        doc.text(String(i + 1), PAD + 6, y + 5, { width: 18 });
        doc.text(it.name, PAD + 28, y + 5, { width: INNER - 28 - 60 - 50, ellipsis: true });
        doc.text(it.sku || "-", PAD + INNER - 110, y + 5, { width: 60, ellipsis: true });
        doc.font("Helvetica-Bold").text(String(it.quantity), PAD + INNER - 50, y + 5, { width: 44, align: "right" });
        doc.font("Helvetica");
        totalQty += it.quantity || 0;
        y += rowH;
      });

      // Totals strip
      doc.rect(PAD, y, INNER, 22).lineWidth(0.5).stroke("#000000");
      doc.font("Helvetica-Bold").fontSize(10).fillColor("#000000")
        .text(`Total items: ${totalQty}`, PAD + 6, y + 7);
      doc.font("Helvetica").fontSize(8).text(
        `${s.items.length} line${s.items.length === 1 ? "" : "s"}`,
        PAD + INNER - 100, y + 8, { width: 90, align: "right" }
      );
      y += 26;

      // Notes
      if (s.notes) {
        doc.font("Helvetica-Bold").fontSize(8).text("NOTES:", PAD, y);
        doc.font("Helvetica").fontSize(8).text(s.notes, PAD, y + 11, { width: INNER });
      }

      // Footer
      const footY = doc.page.height - 36;
      doc.lineWidth(0.5).moveTo(PAD, footY).lineTo(W - PAD, footY).stroke("#cccccc");
      doc.font("Helvetica").fontSize(7).fillColor("#666666")
        .text("Thank you for shopping with Vedic Tatva. For any concerns, write to ecom@vedictatva.com", PAD, footY + 6, { width: INNER, align: "center" });
      doc.fillColor("#000000");
    });

    doc.end();
    stream.on("finish", () => resolve(filepath));
    stream.on("error", reject);
  });
}
