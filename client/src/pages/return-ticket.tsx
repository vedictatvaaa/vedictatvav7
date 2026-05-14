import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RotateCcw, Send, Search, Clock, CheckCircle, XCircle, AlertTriangle, Shield } from "lucide-react";
import type { ReturnTicket } from "@shared/schema";

const RETURN_REASONS = [
  "Defective Product",
  "Wrong Item Received",
  "Quality Not As Expected",
  "Changed Mind",
  "Arrived Late",
  "Damaged in Transit",
  "Other",
];

const STATUS_STYLES: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
  pending: { bg: "bg-yellow-100", text: "text-yellow-800", icon: <Clock className="w-3 h-3" /> },
  approved: { bg: "bg-green-100", text: "text-green-800", icon: <CheckCircle className="w-3 h-3" /> },
  rejected: { bg: "bg-red-100", text: "text-red-800", icon: <XCircle className="w-3 h-3" /> },
  refunded: { bg: "bg-blue-100", text: "text-blue-800", icon: <CheckCircle className="w-3 h-3" /> },
  processing: { bg: "bg-indigo-100", text: "text-indigo-800", icon: <Clock className="w-3 h-3" /> },
};

export default function ReturnTicketPage() {
  const { toast } = useToast();

  const [form, setForm] = useState({
    orderId: "",
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    productName: "",
    reason: "",
    description: "",
  });

  const [lookupEmail, setLookupEmail] = useState("");
  const [tickets, setTickets] = useState<ReturnTicket[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  // Pre-fill from query params (?orderId=&email=&product=) for one-click return from order history / track-order.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const qp = new URLSearchParams(window.location.search);
    const orderId = qp.get("orderId") || "";
    const email = qp.get("email") || "";
    const product = qp.get("product") || "";
    if (orderId || email || product) {
      setForm((prev) => ({
        ...prev,
        orderId: orderId || prev.orderId,
        customerEmail: email || prev.customerEmail,
        productName: product || prev.productName,
      }));
      if (email) setLookupEmail(email);
    }
  }, []);

  const submitMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/return-tickets", {
        orderId: parseInt(form.orderId),
        customerName: form.customerName,
        customerEmail: form.customerEmail,
        customerPhone: form.customerPhone || undefined,
        productName: form.productName,
        reason: form.reason,
        description: form.description || undefined,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Your return request has been submitted successfully." });
      setForm({ orderId: "", customerName: "", customerEmail: "", customerPhone: "", productName: "", reason: "", description: "" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message || "Failed to submit return request.", variant: "destructive" });
    },
  });

  const lookupMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("GET", `/api/return-tickets/by-email?email=${encodeURIComponent(lookupEmail)}`);
      return res.json();
    },
    onSuccess: (data: ReturnTicket[]) => {
      setTickets(data);
      setHasSearched(true);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message || "Failed to fetch return tickets.", variant: "destructive" });
    },
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.orderId || !form.customerName || !form.customerEmail || !form.productName || !form.reason) {
      toast({ title: "Validation Error", description: "Please fill in all required fields.", variant: "destructive" });
      return;
    }
    submitMutation.mutate();
  }

  function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    if (!lookupEmail.trim()) {
      toast({ title: "Validation Error", description: "Please enter your email address.", variant: "destructive" });
      return;
    }
    lookupMutation.mutate();
  }

  return (
    <div className="min-h-screen bg-[#FDF6EC]">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <RotateCcw className="w-8 h-8 text-[#6D2B35]" />
          <h1 className="text-3xl font-serif text-[#6D2B35]" data-testid="text-return-heading">Return & Refund</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-[#6D2B35] font-serif">Submit Return Request</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Order ID *</label>
                  <Input
                    type="number"
                    name="orderId"
                    value={form.orderId}
                    onChange={handleChange}
                    placeholder="Enter your order ID"
                    required
                    data-testid="input-order-id"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Customer Name *</label>
                  <Input
                    name="customerName"
                    value={form.customerName}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    required
                    data-testid="input-customer-name"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Customer Email *</label>
                  <Input
                    type="email"
                    name="customerEmail"
                    value={form.customerEmail}
                    onChange={handleChange}
                    placeholder="your@email.com"
                    required
                    data-testid="input-customer-email"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Customer Phone</label>
                  <Input
                    type="tel"
                    name="customerPhone"
                    value={form.customerPhone}
                    onChange={handleChange}
                    placeholder="Phone number (optional)"
                    data-testid="input-customer-phone"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Product Name *</label>
                  <Input
                    name="productName"
                    value={form.productName}
                    onChange={handleChange}
                    placeholder="Which product do you want to return?"
                    required
                    data-testid="input-product-name"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Return Reason *</label>
                  <Select value={form.reason} onValueChange={(value) => setForm((prev) => ({ ...prev, reason: value }))}>
                    <SelectTrigger data-testid="select-reason">
                      <SelectValue placeholder="Select a reason" />
                    </SelectTrigger>
                    <SelectContent>
                      {RETURN_REASONS.map((reason) => (
                        <SelectItem key={reason} value={reason} data-testid={`select-item-${reason.toLowerCase().replace(/\s+/g, "-")}`}>
                          {reason}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    placeholder="Provide additional details (optional)"
                    rows={3}
                    className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    data-testid="input-description"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={submitMutation.isPending}
                  className="w-full bg-[#6D2B35] hover:bg-[#5a2330] text-white"
                  data-testid="button-submit-return"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {submitMutation.isPending ? "Submitting..." : "Submit Return Request"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-[#6D2B35] font-serif">Track Your Returns</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLookup} className="flex gap-2">
                  <Input
                    type="email"
                    value={lookupEmail}
                    onChange={(e) => setLookupEmail(e.target.value)}
                    placeholder="Enter your email to look up tickets"
                    data-testid="input-lookup-email"
                  />
                  <Button
                    type="submit"
                    disabled={lookupMutation.isPending}
                    className="bg-[#D4AF37] hover:bg-[#c9a432] text-white shrink-0"
                    data-testid="button-search-tickets"
                  >
                    <Search className="w-4 h-4 mr-2" />
                    {lookupMutation.isPending ? "Searching..." : "Search"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {hasSearched && tickets.length === 0 && (
              <Card>
                <CardContent className="py-8 text-center">
                  <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500" data-testid="text-no-tickets">No return tickets found for this email.</p>
                </CardContent>
              </Card>
            )}

            {tickets.map((ticket) => {
              const status = STATUS_STYLES[ticket.status] || STATUS_STYLES.pending;
              return (
                <Card key={ticket.id} data-testid={`card-ticket-${ticket.id}`}>
                  <CardContent className="pt-6 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[#6D2B35]" data-testid={`text-ticket-id-${ticket.id}`}>
                        #RT-{ticket.id}
                      </span>
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${status.bg} ${status.text}`} data-testid={`badge-status-${ticket.id}`}>
                        {status.icon}
                        {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
                      </span>
                    </div>
                    <div className="text-sm space-y-1">
                      <p><span className="text-gray-500">Product:</span> <span data-testid={`text-product-${ticket.id}`}>{ticket.productName}</span></p>
                      <p><span className="text-gray-500">Order ID:</span> <span data-testid={`text-order-id-${ticket.id}`}>{ticket.orderId}</span></p>
                      <p><span className="text-gray-500">Reason:</span> <span data-testid={`text-reason-${ticket.id}`}>{ticket.reason}</span></p>
                      {ticket.adminNotes && (
                        <p><span className="text-gray-500">Admin Notes:</span> <span data-testid={`text-admin-notes-${ticket.id}`}>{ticket.adminNotes}</span></p>
                      )}
                      <p className="text-xs text-gray-400" data-testid={`text-date-${ticket.id}`}>
                        Submitted: {ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString() : "N/A"}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        <Card className="mt-12">
          <CardHeader>
            <CardTitle className="text-[#6D2B35] font-serif flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Return Policy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-gray-700" data-testid="list-return-policy">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                Returns accepted within 7 days of delivery
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                Item must be unused and in original packaging
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                Refunds processed within 5-7 business days
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                Damaged items eligible for free replacement
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}