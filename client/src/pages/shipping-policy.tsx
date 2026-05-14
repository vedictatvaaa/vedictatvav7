import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function ShippingPolicy() {
  return (
    <div className="w-full pb-20 bg-[#FAFAF7] min-h-screen">
      <div className="bg-[#6D2B35] text-white py-10 md:py-14">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-4xl font-serif mb-2" data-testid="text-shipping-heading">Shipping Policy</h1>
          <p className="text-white/50 text-sm">Delivery information for products on vedictatva.com</p>
        </div>
      </div>

      <div className="container mx-auto px-4 mt-6 md:mt-8 max-w-3xl">
        <Link href="/">
          <button className="flex items-center gap-2 text-[#6D2B35] hover:text-[#D4AF37] text-sm mb-8 transition-colors" data-testid="btn-back-home">
            <ArrowLeft className="h-4 w-4" /> Back to Home
          </button>
        </Link>

        <div className="bg-white rounded-2xl p-5 sm:p-8 md:p-12 shadow-sm border border-[#6D2B35]/5 space-y-6 md:space-y-8">
          <div className="text-center border-b border-[#6D2B35]/5 pb-6">
            <p className="text-xs text-[#5a4a3a]/40 uppercase tracking-wider">Vedic Tatva Private Limited</p>
            <p className="text-xs text-[#5a4a3a]/30 mt-1">Last updated: February 2026</p>
          </div>

          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-serif text-[#6D2B35]">1. Shipping Coverage</h2>
            <p className="text-sm text-[#5a4a3a]/70 leading-relaxed">
              Vedic Tatva Private Limited currently ships products across India. We deliver to all major cities, towns, and most pin codes serviceable by our logistics partners. International shipping is not available at this time.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-serif text-[#6D2B35]">2. Processing Time</h2>
            <p className="text-sm text-[#5a4a3a]/70 leading-relaxed">
              All orders are processed within 1–2 business days (Monday to Saturday, excluding public holidays) after payment confirmation. You will receive an email or SMS with tracking details once your order has been dispatched.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-serif text-[#6D2B35]">3. Estimated Delivery Time</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-[#5a4a3a]/70 border border-[#6D2B35]/10 rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-[#F5F0E6]/60">
                    <th className="text-left px-3 py-2 sm:px-4 sm:py-3 font-medium text-[#6D2B35] border-b border-[#6D2B35]/10">Region</th>
                    <th className="text-left px-3 py-2 sm:px-4 sm:py-3 font-medium text-[#6D2B35] border-b border-[#6D2B35]/10">Estimated Delivery</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-[#6D2B35]/5">
                    <td className="px-3 py-2 sm:px-4 sm:py-3">Metro Cities (Delhi, Mumbai, Bangalore, Chennai, Kolkata, Hyderabad)</td>
                    <td className="px-3 py-2 sm:px-4 sm:py-3">3–5 business days</td>
                  </tr>
                  <tr className="border-b border-[#6D2B35]/5">
                    <td className="px-3 py-2 sm:px-4 sm:py-3">Tier 2 Cities (Jaipur, Lucknow, Pune, Ahmedabad, etc.)</td>
                    <td className="px-3 py-2 sm:px-4 sm:py-3">5–7 business days</td>
                  </tr>
                  <tr className="border-b border-[#6D2B35]/5">
                    <td className="px-3 py-2 sm:px-4 sm:py-3">Tier 3 Cities & Rural Areas</td>
                    <td className="px-3 py-2 sm:px-4 sm:py-3">7–10 business days</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 sm:px-4 sm:py-3">Remote / North-East Regions</td>
                    <td className="px-3 py-2 sm:px-4 sm:py-3">10–14 business days</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-xs text-[#5a4a3a]/40 italic">
              These are estimated timelines and may vary due to logistics, weather conditions, or unforeseen circumstances.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-serif text-[#6D2B35]">4. Shipping Charges</h2>
            <ul className="list-disc pl-6 text-sm text-[#5a4a3a]/70 leading-relaxed space-y-1.5">
              <li><strong>Free Shipping:</strong> Available on prepaid orders above ₹499.</li>
              <li><strong>Standard Shipping:</strong> A flat rate of ₹49 applies to prepaid orders below ₹499.</li>
              <li><strong>Cash on Delivery (COD):</strong> An additional handling charge of ₹40 applies to all COD orders, irrespective of order value.</li>
              <li>Shipping charges for heavy or bulky items (idols, large puja sets) may vary and will be displayed at checkout.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-serif text-[#6D2B35]">5. Order Tracking</h2>
            <p className="text-sm text-[#5a4a3a]/70 leading-relaxed">
              Once your order is shipped, you will receive a tracking number via email and/or SMS. You can track your order by visiting our Order History page on the website or by using the tracking number on our logistics partner's website. For any tracking-related queries, contact us at <a href="mailto:ecom@vedictatva.com" className="text-[#6D2B35] underline">ecom@vedictatva.com</a>.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-serif text-[#6D2B35]">6. Packaging</h2>
            <p className="text-sm text-[#5a4a3a]/70 leading-relaxed">
              All products are carefully packed to ensure safe delivery. Fragile items such as brass idols, marble murtis, and glass diyas are packed with extra cushioning and protective layers. Spiritual items are handled with care and respect, ensuring they reach you in perfect condition for worship.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-serif text-[#6D2B35]">7. Delivery Attempts</h2>
            <p className="text-sm text-[#5a4a3a]/70 leading-relaxed">
              Our logistics partners will make up to 3 delivery attempts. If delivery is unsuccessful after 3 attempts, the order will be returned to our warehouse. In such cases, we will contact you to arrange reshipment (additional shipping charges may apply) or process a refund as per our Refund Policy.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-serif text-[#6D2B35]">8. Undeliverable Shipments</h2>
            <p className="text-sm text-[#5a4a3a]/70 leading-relaxed">
              Orders may be undeliverable due to incorrect address, incomplete contact information, or restricted access areas. Please ensure your shipping details are accurate at the time of checkout. Vedic Tatva Private Limited is not responsible for delays or non-delivery caused by incorrect customer information.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-serif text-[#6D2B35]">9. Damaged Shipments</h2>
            <p className="text-sm text-[#5a4a3a]/70 leading-relaxed">
              If your order arrives damaged, please report it within 48 hours of delivery. Refer to our <Link href="/refund-policy" className="text-[#6D2B35] underline">Refund & Return Policy</Link> for the complete process on handling damaged products.
            </p>
          </section>

          <section className="space-y-3 pt-4 border-t border-[#6D2B35]/5">
            <h2 className="text-base sm:text-lg font-serif text-[#6D2B35]">Contact Us</h2>
            <div className="text-sm text-[#5a4a3a]/70 leading-relaxed space-y-1">
              <p><strong>Vedic Tatva Private Limited</strong></p>
              <p>Email: <a href="mailto:ecom@vedictatva.com" className="text-[#6D2B35] underline">ecom@vedictatva.com</a></p>
              <p>Phone: <a href="tel:+918447844702" className="text-[#6D2B35] underline">8447-8447-02</a></p>
              <p>Website: <a href="https://vedictatva.com" className="text-[#6D2B35] underline">vedictatva.com</a></p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
