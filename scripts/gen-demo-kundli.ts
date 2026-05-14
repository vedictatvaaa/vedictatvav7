import { generatePremiumKundliPDF, derivePdfPassword } from "../server/kundli-pdf";
import type { PdfKundliOrder } from "../shared/schema";
import fs from "fs";
import path from "path";

(async () => {
  const demoOrder: PdfKundliOrder = {
    id: 99999,
    userId: null,
    fullName: "Demo User",
    email: "demo@vedictatva.com",
    phone: "+919999999999",
    gender: "Male",
    birthDate: "1990-08-15",
    birthTime: "14:30",
    birthCity: "New Delhi, India",
    language: "English",
    amountPaise: 50100,
    currency: "INR",
    razorpayOrderId: "demo_order",
    razorpayPaymentId: "demo_payment",
    status: "ready",
    pdfPath: null,
    errorMessage: null,
    downloadToken: "demo-token",
    createdAt: new Date(),
    paidAt: new Date(),
    sentAt: null,
  };

  console.log("Generating demo kundli PDF...");
  const result = await generatePremiumKundliPDF(demoOrder);
  console.log("Built:", result.filePath);

  // Copy to a stable path so we can present it.
  const dest = path.join(process.cwd(), "demo-kundli.pdf");
  fs.copyFileSync(result.filePath, dest);
  console.log("Copied to:", dest);
  console.log("PDF password (DDMMYYYY):", derivePdfPassword(demoOrder.birthDate));
})().catch(e => { console.error(e); process.exit(1); });
