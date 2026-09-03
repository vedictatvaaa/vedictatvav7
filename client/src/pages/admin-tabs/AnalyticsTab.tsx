import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Users, FileText, Download } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Button } from "@/components/ui/button";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { createFetcher } from "../admin-shared";

// ============================================================
// Analytics Tab
// ============================================================
function AnalyticsTab() {
  const adminToken = typeof window !== "undefined" ? localStorage.getItem("adminToken") || "" : "";
  const fetcher = createFetcher(adminToken);
  const [dateRange, setDateRange] = useState("30");
  // Reporting windows follow the business timezone and include both endpoints.
  const kolkataDate = (daysAgo: number) => {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit",
    }).formatToParts(new Date());
    const year = Number(parts.find(p => p.type === "year")?.value);
    const month = Number(parts.find(p => p.type === "month")?.value);
    const day = Number(parts.find(p => p.type === "day")?.value);
    const date = new Date(Date.UTC(year, month - 1, day - daysAgo));
    return date.toISOString().slice(0, 10);
  };
  const toDate = kolkataDate(0);
  const fromDate = kolkataDate(Number(dateRange) - 1);

  const { data: salesData } = useQuery<any>({ queryKey: ["/api/admin/analytics/sales", dateRange], queryFn: () => fetcher(`/api/admin/analytics/sales?from=${fromDate}&to=${toDate}`) });
  const { data: categoryData } = useQuery<any[]>({ queryKey: ["/api/admin/analytics/category-sales"], queryFn: () => fetcher("/api/admin/analytics/category-sales") });
  const { data: pvsData } = useQuery<any>({ queryKey: ["/api/admin/analytics/product-vs-service"], queryFn: () => fetcher("/api/admin/analytics/product-vs-service") });
  const { data: profitData } = useQuery<any>({ queryKey: ["/api/admin/analytics/profit"], queryFn: () => fetcher("/api/admin/analytics/profit") });
  const { data: customerData } = useQuery<any>({ queryKey: ["/api/admin/analytics/customers"], queryFn: () => fetcher("/api/admin/analytics/customers") });
  const { data: productPerf } = useQuery<any>({ queryKey: ["/api/admin/analytics/product-performance"], queryFn: () => fetcher("/api/admin/analytics/product-performance") });

  const COLORS = ["hsl(var(--primary))", "hsl(var(--secondary))", "#2563eb", "#059669", "#7c3aed", "#ea580c", "#0891b2", "#be185d"];

  return (
    <div className="min-w-0 space-y-6">
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row">
        <div>
          <h1 className="text-3xl font-serif text-primary" data-testid="page-title-analytics">Analytics</h1>
          <p className="text-sm text-muted-foreground">Sales, revenue, and business insights</p>
        </div>
        <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:justify-end">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="col-span-2 h-11 w-full sm:col-span-1 sm:w-[160px]" data-testid="select-analytics-range">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 Days</SelectItem>
              <SelectItem value="30">Last 30 Days</SelectItem>
              <SelectItem value="90">Last 90 Days</SelectItem>
              <SelectItem value="365">Last Year</SelectItem>
            </SelectContent>
          </Select>
           <Button variant="outline" size="sm" className="min-h-11" onClick={() => window.open(`/api/admin/export/sales-csv?from=${fromDate}&to=${toDate}`)} data-testid="button-analytics-export-csv">
            <Download className="w-3 h-3 mr-1" /> CSV
          </Button>
           <Button variant="outline" size="sm" title="Export all-time GST report" aria-label="Export all-time GST report" className="min-h-11" onClick={() => window.open("/api/admin/export/gst-report")} data-testid="button-analytics-export-gst">
            <FileText className="w-3 h-3 mr-1" /> GST
          </Button>
           <Button variant="outline" size="sm" title="Export all-time customer report" aria-label="Export all-time customer report" className="col-span-2 min-h-11 sm:col-span-1" onClick={() => window.open("/api/admin/export/customers")} data-testid="button-analytics-export-customers">
            <Users className="w-3 h-3 mr-1" /> Customers · all time
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 min-[360px]:grid-cols-2 md:grid-cols-4">
        <Card className="bg-card border-border">
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Revenue</p>
            <p className="text-2xl font-bold text-primary" data-testid="text-analytics-revenue">₹{(salesData?.summary?.totalRevenue || 0).toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Orders</p>
            <p className="text-2xl font-bold text-secondary" data-testid="text-analytics-orders">{salesData?.summary?.totalOrders || 0}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">GST Collected</p>
            <p className="text-2xl font-bold text-primary" data-testid="text-analytics-gst">₹{(salesData?.summary?.totalGst || 0).toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Avg Order</p>
            <p className="text-2xl font-bold text-secondary" data-testid="text-analytics-avg">₹{(salesData?.summary?.avgOrderValue || 0).toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid min-w-0 gap-4 md:grid-cols-2 md:gap-6">
        <Card className="min-w-0 overflow-hidden bg-card border-border">
          <CardHeader><CardTitle className="text-lg text-primary">Sales Trend</CardTitle></CardHeader>
          <CardContent className="min-w-0">
            {salesData?.data?.length > 0 ? (
              <div className="h-64">
                <SalesChart data={salesData.data} />
              </div>
            ) : <p className="text-sm text-muted-foreground text-center py-12">No sales data for this period</p>}
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader><CardTitle className="text-lg text-primary">Category Sales</CardTitle></CardHeader>
          <CardContent>
            {(categoryData || []).length > 0 ? (
              <div className="space-y-3">
                {(categoryData || []).map((cat: any, i: number) => (
                  <div key={cat.category} className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-sm flex-1">{cat.category}</span>
                    <span className="text-sm font-medium">₹{cat.revenue.toLocaleString()}</span>
                    <span className="text-xs text-muted-foreground">{cat.units} units</span>
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-muted-foreground text-center py-12">No category data</p>}
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="bg-card border-border">
          <CardHeader><CardTitle className="text-lg text-primary">Product vs Service Revenue</CardTitle></CardHeader>
          <CardContent>
            {pvsData && Object.entries(pvsData).map(([type, data]: [string, any]) => (
              <div key={type} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <span className="text-sm capitalize">{type}</span>
                <div className="text-right">
                  <p className="font-medium">₹{(data.revenue || 0).toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">{data.count} items</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader><CardTitle className="text-lg text-primary">Profit Overview</CardTitle></CardHeader>
          <CardContent>
            {profitData && (
              <div className="space-y-3">
                <div className="flex justify-between"><span className="text-sm">Total Revenue</span><span className="font-medium">₹{(profitData.totalRevenue || 0).toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-sm">GST Collected</span><span className="font-medium text-blue-600">₹{(profitData.totalGst || 0).toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-sm">Net Revenue</span><span className="font-medium">₹{(profitData.netRevenue || 0).toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-sm">Total Cost</span><span className="font-medium text-red-600">₹{(profitData.totalCost || 0).toLocaleString()}</span></div>
                <div className="border-t pt-2 flex justify-between"><span className="text-sm font-bold">Profit</span><span className="font-bold text-emerald-600">₹{(profitData.profit || 0).toLocaleString()} ({profitData.profitMargin}%)</span></div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader><CardTitle className="text-lg text-primary">Customer Insights</CardTitle></CardHeader>
          <CardContent>
            {customerData && (
              <div className="space-y-3">
                <div className="flex justify-between"><span className="text-sm">Total Customers</span><span className="font-medium">{customerData.total}</span></div>
                <div className="flex justify-between"><span className="text-sm">Repeat Customers</span><span className="font-medium">{customerData.repeatCount} ({customerData.repeatPercent}%)</span></div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="bg-card border-border">
          <CardHeader><CardTitle className="text-lg text-primary">Top Customers</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {(customerData?.topCustomers || []).slice(0, 8).map((c: any, i: number) => (
                <div key={i} className="flex items-center justify-between py-1 text-sm border-b border-muted last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">{i + 1}</span>
                    <span>{c.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-medium">₹{c.spent.toLocaleString()}</span>
                    <span className="text-xs text-muted-foreground ml-2">({c.orders} orders)</span>
                  </div>
                </div>
              ))}
              {(!customerData?.topCustomers || customerData.topCustomers.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-4">No customer data</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader><CardTitle className="text-lg text-primary">Product Performance</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(productPerf?.topSelling || []).length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-secondary uppercase mb-1">Top Selling</p>
                  {productPerf.topSelling.slice(0, 5).map((p: any) => (
                    <div key={p.id} className="flex justify-between text-sm py-0.5">
                      <span className="truncate flex-1">{p.name}</span>
                      <span className="text-muted-foreground">{p.salesCount} sold</span>
                    </div>
                  ))}
                </div>
              )}
              {(productPerf?.lowStock || []).length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-red-600 uppercase mb-1">Low Stock Alert</p>
                  {productPerf.lowStock.slice(0, 5).map((p: any) => (
                    <div key={p.id} className="flex justify-between text-sm py-0.5">
                      <span className="truncate flex-1">{p.name}</span>
                      <span className="text-red-500 font-medium">{p.stock} left</span>
                    </div>
                  ))}
                </div>
              )}
              {(!productPerf?.topSelling || productPerf.topSelling.length === 0) && (!productPerf?.lowStock || productPerf.lowStock.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-4">No product performance data</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SalesChart({ data }: { data: any[] }) {
  const chartData = data.map((d: any) => ({
    date: new Date(d.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
    sales: Number(d.totalSales),
    orders: Number(d.orderCount),
  }));
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis dataKey="date" tick={{ fontSize: 10 }} />
        <YAxis tick={{ fontSize: 10 }} />
        <Tooltip formatter={(value: number) => [`₹${value.toLocaleString()}`, "Sales"]} />
        <Line type="monotone" dataKey="sales" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}


export default AnalyticsTab;
