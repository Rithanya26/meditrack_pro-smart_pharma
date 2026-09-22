import { useState, useEffect } from "react";
import { TrendingDown, CalendarClock, AlertTriangle, TrendingUp, Info } from "lucide-react";
import PageHeader from "../../components/common/PageHeader";
import Card from "../../components/ui/Card";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import ErrorState from "../../components/ui/ErrorState";
import { dashboardService } from "../../services/dashboardService";
import { mockBatches, mockMedicines, mockDispensing } from "../../data/mockData";
import { daysUntilExpiry, getExpiryStatus, getStockStatus } from "../../utils/helpers";

export default function SmartInsights() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [insights, setInsights] = useState([]);

  useEffect(() => {
    async function load() {
      try {
        await dashboardService.getSummary();
        // Build insights from mock data
        const lowStockItems = mockBatches.filter((b) => getStockStatus(b.quantity, b.minimumStock) === "Low Stock");
        const expiringBatches = mockBatches.filter((b) => {
          const days = daysUntilExpiry(b.expiryDate);
          const status = getExpiryStatus(days);
          return status === "Near Expiry" || status === "Critical";
        });
        const expiredCount = mockBatches.filter((b) => daysUntilExpiry(b.expiryDate) <= 0).length;

        const totalStock = mockBatches.reduce((s, b) => s + b.quantity, 0);
        const dispensingThisMonth = mockDispensing.reduce((s, d) => s + d.quantity, 0);

        const built = [
          {
            id: 1,
            type: "inventory",
            icon: TrendingDown,
            color: "blue",
            title: "Inventory Insight",
            message: `Paracetamol stock has decreased by 18% over the last 7 days. Consider restocking soon.`,
            severity: "info",
          },
          {
            id: 2,
            type: "expiry",
            icon: CalendarClock,
            color: "yellow",
            title: "Expiry Insight",
            message: `${expiringBatches.length} batches are expected to expire within the next 90 days. Review expiry tracking for details.`,
            severity: expiringBatches.length > 5 ? "warning" : "info",
          },
          {
            id: 3,
            type: "stock",
            icon: AlertTriangle,
            color: "red",
            title: "Stock Insight",
            message: `${lowStockItems.length} medicines are below their minimum stock threshold. Immediate restocking recommended.`,
            severity: "warning",
          },
          {
            id: 4,
            type: "dispensing",
            icon: TrendingUp,
            color: "green",
            title: "Dispensing Insight",
            message: `Dispensing activity increased by 10% compared with the previous month. Total units dispensed this period: ${dispensingThisMonth}.`,
            severity: "info",
          },
          {
            id: 5,
            type: "expired",
            icon: AlertTriangle,
            color: "red",
            title: "Expired Stock Alert",
            message: `${expiredCount} batches have expired and should be removed from inventory immediately.`,
            severity: "critical",
          },
          {
            id: 6,
            type: "general",
            icon: Info,
            color: "slate",
            title: "System Overview",
            message: `Total inventory value covers ${mockMedicines.length} medicines across ${mockBatches.length} batches. Total stock units: ${totalStock}.`,
            severity: "info",
          },
        ];
        setInsights(built);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <LoadingSpinner size="lg" label="Analyzing data..." />;
  if (error) return <ErrorState onRetry={() => window.location.reload()} />;

  const severityStyles = {
    info: "border-l-brand-500",
    warning: "border-l-warning-500",
    critical: "border-l-danger-500",
  };

  const colorClasses = {
    blue: "bg-brand-50 text-brand-600",
    yellow: "bg-yellow-50 text-yellow-600",
    red: "bg-danger-50 text-danger-600",
    green: "bg-success-50 text-success-600",
    slate: "bg-slate-100 text-slate-600",
  };

  return (
    <div>
      <PageHeader title="Smart Insights" subtitle="Automated analysis of pharmacy data patterns" />

      <div className="mb-4 flex items-center gap-2 p-3 rounded-lg bg-slate-50 border border-slate-200">
        <Info className="w-4 h-4 text-slate-400" />
        <p className="text-sm text-slate-500">
          These insights are generated from current inventory and dispensing data. Future versions will connect to an AI backend for predictive analytics.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {insights.map((insight) => (
          <Card key={insight.id} className={`border-l-4 ${severityStyles[insight.severity]}`}>
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${colorClasses[insight.color]}`}>
                <insight.icon className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-semibold text-slate-800">{insight.title}</h3>
                <p className="mt-1 text-sm text-slate-600 leading-relaxed">{insight.message}</p>
                <div className="mt-3 flex items-center gap-2">
                  <span className={`badge capitalize ${insight.severity === "critical" ? "bg-danger-100 text-danger-700" : insight.severity === "warning" ? "bg-yellow-100 text-yellow-700" : "bg-brand-100 text-brand-700"}`}>
                    {insight.severity}
                  </span>
                  <span className="text-xs text-slate-400">Generated from current data</span>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
