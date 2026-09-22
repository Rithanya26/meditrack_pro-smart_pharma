import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Stethoscope, Pill, AlertTriangle, CalendarClock, Clock } from "lucide-react";
import StatCard from "../../components/common/StatCard";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import { StatusBadge } from "../../components/ui/StatusBadge";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import ErrorState from "../../components/ui/ErrorState";
import { dashboardService } from "../../services/dashboardService";
import { dispensingService } from "../../services/dispensingService";
import { inventoryService } from "../../services/inventoryService";
import { useAuth } from "../../context/AuthContext";
import { mockMedicines } from "../../data/mockData";
import { formatDate, formatNumber } from "../../utils/helpers";

export default function PharmacistDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [summary, setSummary] = useState(null);
  const [myTransactions, setMyTransactions] = useState([]);
  const [expiryAlerts, setExpiryAlerts] = useState([]);

  useEffect(() => {
    async function load() {
      try {
        const [s, txns, inv] = await Promise.all([
          dashboardService.getSummary(),
          dispensingService.getByPharmacist(user.id),
          inventoryService.getAll(),
        ]);
        setSummary(s);
        setMyTransactions(txns.slice(0, 5));
        setExpiryAlerts(inv.filter((i) => i.expiryStatus === "Near Expiry" || i.expiryStatus === "Critical").slice(0, 4));
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user.id]);

  if (loading) return <LoadingSpinner size="lg" label="Loading dashboard..." />;
  if (error) return <ErrorState onRetry={() => window.location.reload()} />;

  const activeMeds = mockMedicines.filter((m) => m.status === "active").length;

  return (
    <div className="space-y-6">
      {/* Welcome + main CTA */}
      <Card className="bg-gradient-to-r from-brand-600 to-brand-800 text-white border-0">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold">Welcome back, {user.name.split(" ")[0]}</h2>
            <p className="mt-1 text-brand-100 text-sm">Ready to dispense medicine? Start a new transaction.</p>
          </div>
          <Button variant="secondary" size="lg" onClick={() => navigate("/pharmacist/dispense")} className="bg-white text-brand-700 hover:bg-brand-50 border-0">
            <Stethoscope className="w-5 h-5" /> Dispense Medicine
          </Button>
        </div>
      </Card>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Stethoscope} label="Today's Dispensing" value={formatNumber(summary.todayDispensing)} color="blue" />
        <StatCard icon={Pill} label="Available Medicines" value={activeMeds} color="green" />
        <StatCard icon={AlertTriangle} label="Low Stock" value={summary.lowStock} color="yellow" />
        <StatCard icon={CalendarClock} label="Near Expiry" value={summary.nearExpiry} color="orange" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expiry alerts */}
        <Card padding={false}>
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarClock className="w-5 h-5 text-yellow-600" />
              <h3 className="text-base font-semibold text-slate-800">Expiry Alerts</h3>
            </div>
            <button onClick={() => navigate("/pharmacist/expiry-alerts")} className="text-sm text-brand-600 hover:text-brand-700 font-medium">
              View All
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {expiryAlerts.map((a) => (
              <div key={a.id} className="px-5 py-3 flex items-center justify-between hover:bg-slate-50">
                <div>
                  <p className="text-sm font-medium text-slate-800">{a.medicine?.name}</p>
                  <p className="text-xs text-slate-500">Batch: {a.batchNumber} · Expires {formatDate(a.expiryDate)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-semibold ${a.daysRemaining <= 30 ? "text-orange-600" : "text-yellow-600"}`}>
                    {a.daysRemaining}d left
                  </span>
                  <StatusBadge status={a.expiryStatus} type="expiry" />
                </div>
              </div>
            ))}
            {expiryAlerts.length === 0 && <p className="px-5 py-8 text-center text-sm text-slate-400">No expiry alerts</p>}
          </div>
        </Card>

        {/* Recent transactions */}
        <Card padding={false}>
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-brand-600" />
              <h3 className="text-base font-semibold text-slate-800">Recent Dispensing</h3>
            </div>
            <button onClick={() => navigate("/pharmacist/history")} className="text-sm text-brand-600 hover:text-brand-700 font-medium">
              View All
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {myTransactions.map((t) => (
              <div key={t.id} className="px-5 py-3 flex items-center justify-between hover:bg-slate-50">
                <div>
                  <p className="text-sm font-medium text-slate-800">{t.medicineName}</p>
                  <p className="text-xs text-slate-500 font-mono">{t.id}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-slate-700">{t.quantity} units</span>
                  <span className="text-xs text-slate-400">{formatDate(t.date)}</span>
                </div>
              </div>
            ))}
            {myTransactions.length === 0 && <p className="px-5 py-8 text-center text-sm text-slate-400">No recent transactions</p>}
          </div>
        </Card>
      </div>
    </div>
  );
}
