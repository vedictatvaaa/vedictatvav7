import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function RefundPolicy() {
  return (
    <div className="w-full pb-20 bg-[#FAFAF7] min-h-screen">
      <div className="bg-[#6D2B35] text-white py-10 md:py-14">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-4xl font-serif mb-2" data-testid="text-refund-heading">Refund & Return Policy</h1>
          <p className="text-white/50 text-sm">For products sold on vedictatva.com</p>
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
            <h2 className="text-base sm:text-lg font-serif text-[#6D2B35]">1. Overview</h2>
            <p className="text-sm text-[#5a4a3a]/70 leading-relaxed">
              At Vedic Tatva Private Limited ("we", "us", "our"), we strive to deliver authentic and high-quality spiritual products. This Refund & Return Policy applies exclusively to physical products purchased through our website vedictatva.com. Services such as pandit bookings, puja bookings, astrology consultations, and donations are non-refundable and are not covered under this policy.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-serif text-[#6D2B35]">2. Eligibility for Returns & Refunds</h2>
            <p className="text-sm text-[#5a4a3a]/70 leading-relaxed">
              You may request a return or refund under the following circumstances:
            </p>
            <div className="space-y-4 pl-1">
              <div className="border-l-2 border-[#D4AF37]/30 pl-4">
                <h3 className="text-sm font-semibold text-[#6D2B35] mb-1">a) Damaged Products</h3>
                <p className="text-sm text-[#5a4a3a]/70 leading-relaxed">
                  If the product arrives damaged, broken, or in a defective condition during transit, you are eligible for a full refund or replacement. You must report the damage within 48 hours of delivery along with photographic evidence of the damage and the packaging.
                </p>
              </div>
              <div className="border-l-2 border-[#D4AF37]/30 pl-4">
                <h3 className="text-sm font-semibold text-[#6D2B35] mb-1">b) Expired Products</h3>
                <p className="text-sm text-[#5a4a3a]/70 leading-relaxed">
                  If a product is received past its expiry date (applicable to items such as incense, dhoop, havan samagri, camphor, or any consumable spiritual item), you are entitled to a full refund or replacement. You must notify us within 48 hours of delivery with clear images showing the expiry date on the product packaging.
                </p>
              </div>
              <div className="border-l-2 border-[#D4AF37]/30 pl-4">
                <h3 className="text-sm font-semibold text-[#6D2B35] mb-1">c) Item Not as Described</h3>
                <p className="text-sm text-[#5a4a3a]/70 leading-relaxed">
                  If the product received is materially different from the description, images, or specifications listed on the website — including but not limited to wrong item shipped, incorrect size, weight, or material — you may request a return and full refund. The return request must be raised within 7 days of delivery.
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-serif text-[#6D2B35]">3. Non-Returnable Items</h2>
            <p className="text-sm text-[#5a4a3a]/70 leading-relaxed">The following products are not eligible for return or refund:</p>
            <ul className="list-disc pl-6 text-sm text-[#5a4a3a]/70 leading-relaxed space-y-1.5">
              <li>Products that have been used, opened, or altered after delivery (unless damaged or expired).</li>
              <li>Energized or consecrated items (such as yantras, energized rudraksha) once the seal is broken.</li>
              <li>Customized or personalized products made to order.</li>
              <li>Products returned after the applicable return window has expired.</li>
              <li>Items with missing original packaging, tags, or accessories.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-serif text-[#6D2B35]">4. How to Initiate a Return</h2>
            <p className="text-sm text-[#5a4a3a]/70 leading-relaxed">To initiate a return or refund request:</p>
            <ol className="list-decimal pl-6 text-sm text-[#5a4a3a]/70 leading-relaxed space-y-1.5">
              <li>Visit the <strong>Return Ticket</strong> section on our website or email us at <a href="mailto:ecom@vedictatva.com" className="text-[#6D2B35] underline">ecom@vedictatva.com</a>.</li>
              <li>Provide your order number, reason for return, and photographic evidence (if applicable).</li>
              <li>Our team will review the request within 2 business days and respond with further instructions.</li>
              <li>If approved, you will receive a return authorization along with pickup/shipping instructions.</li>
            </ol>
          </section>

          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-serif text-[#6D2B35]">5. Return Shipping</h2>
            <p className="text-sm text-[#5a4a3a]/70 leading-relaxed">
              For approved returns due to damaged, expired, or incorrectly described products, Vedic Tatva Private Limited will bear the return shipping cost. We will arrange a reverse pickup or reimburse reasonable shipping charges if you ship the product yourself. For all other cases, the customer shall bear the return shipping cost.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-serif text-[#6D2B35]">6. Refund Processing</h2>
            <p className="text-sm text-[#5a4a3a]/70 leading-relaxed">Once we receive and inspect the returned product:</p>
            <ul className="list-disc pl-6 text-sm text-[#5a4a3a]/70 leading-relaxed space-y-1.5">
              <li>Refunds will be processed within 7–10 business days from the date of inspection.</li>
              <li>The refund will be credited to the original payment method (bank account, UPI, credit/debit card, or wallet).</li>
              <li>For Cash on Delivery (COD) orders, refunds will be processed via bank transfer. You will be asked to provide your bank details.</li>
              <li>Partial refunds may be issued if the product is returned in a condition different from what was received.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-serif text-[#6D2B35]">7. Replacement Policy</h2>
            <p className="text-sm text-[#5a4a3a]/70 leading-relaxed">
              In cases of damaged or expired products, you may opt for a replacement instead of a refund, subject to stock availability. Replacements will be shipped within 5–7 business days after the returned item is received and inspected.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-serif text-[#6D2B35]">8. Cancellation Policy</h2>
            <p className="text-sm text-[#5a4a3a]/70 leading-relaxed">
              Orders can be cancelled before they are shipped. Once an order has been dispatched, it cannot be cancelled and must follow the return process outlined above. To cancel an order, contact us immediately at <a href="mailto:ecom@vedictatva.com" className="text-[#6D2B35] underline">ecom@vedictatva.com</a> or call <a href="tel:+918447844702" className="text-[#6D2B35] underline">8447-8447-02</a>.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-serif text-[#6D2B35]">9. Dispute Resolution</h2>
            <p className="text-sm text-[#5a4a3a]/70 leading-relaxed">
              If you are not satisfied with the resolution provided, you may escalate the matter by writing to us at <a href="mailto:ecom@vedictatva.com" className="text-[#6D2B35] underline">ecom@vedictatva.com</a>. We are committed to resolving all disputes amicably and in good faith.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-serif text-[#6D2B35]">10. Governing Law & Jurisdiction</h2>
            <p className="text-sm text-[#5a4a3a]/70 leading-relaxed">
              This Refund & Return Policy is governed by and construed in accordance with the laws of India. Any disputes arising out of or in connection with this policy shall be subject to the exclusive jurisdiction of the courts at Delhi, specifically the Hon'ble Delhi High Court and courts subordinate thereto.
            </p>
          </section>

          <section className="space-y-3 pt-4 border-t border-[#6D2B35]/5">
            <h2 className="text-base sm:text-lg font-serif text-[#6D2B35]">Contact Us</h2>
            <p className="text-sm text-[#5a4a3a]/70 leading-relaxed">
              For any questions or concerns regarding this policy, please reach out to us:
            </p>
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
