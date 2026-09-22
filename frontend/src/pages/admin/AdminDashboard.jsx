import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Pill,
  Boxes,
  AlertTriangle,
  CalendarClock,
  PackageX,
  Stethoscope,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area,
} from "recharts";
import StatCard from "../../components/common/StatCard";
import Card from "../../components/ui/Card";
import { StatusBadge } from "../../components/ui/StatusBadge";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import ErrorState from "../../components/ui/ErrorState";
import { dashboardService } from "../../services/dashboardService";
import { auditService } from "../../services/auditService";
import { formatNumber, formatDate, formatTime } from "../../utils/helpers";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [alerts, setAlerts] = useState(null);
  const [activities, setActivities] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [s, c, a, acts] = await Promise.all([
          dashboardService.getSummary(),
          dashboardService.getChartData(),
          dashboardService.getAlerts(),
          auditService.getAll(),
        ]);
        setSummary(s);
        setChartData(c);
        setAlerts(a);
        setActivities(acts.slice(0, 6));
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <LoadingSpinner size="lg" label="Loading dashboard..." />;
  if (error) return <ErrorState onRetry={() => window.location.reload()} />;

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard icon={Pill} label="Total Medicines" value={formatNumber(summary.totalMedicines)} trend={8} trendLabel="this month" color="blue" />
        <StatCard icon={Boxes} label="Total Stock" value={formatNumber(summary.totalStock)} trend={5} trendLabel="this month" color="green" />
        <StatCard icon={AlertTriangle} label="Low Stock" value={summary.lowStock} trend={-2} trendLabel="vs last week" color="yellow" />
        <StatCard icon={CalendarClock} label="Near Expiry" value={summary.nearExpiry} trend={3} trendLabel="batches" color="orange" />
        <StatCard icon={PackageX} label="Expired Batches" value={summary.expiredBatches} color="red" />
        <StatCard icon={Stethoscope} label="Today's Dispensing" value={formatNumber(summary.todayDispensing)} trend={12} trendLabel="units" color="purple" />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly dispensing — takes 2 columns */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-slate-800">Monthly Dispensing Trend</h3>
              <p className="text-sm text-slate-500">Units dispensed over the last 12 months</p>
            </div>
            <TrendingUp className="w-5 h-5 text-success-500" />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData.monthlyDispensing}>
              <defs>
                <linearGradient id="colorDisp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2487eb" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#2487eb" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "13px" }}
                labelStyle={{ color: "#0f172a", fontWeight: 600 }}
              />
              <Area type="monotone" dataKey="quantity" stroke="#2487eb" strokeWidth={2} fill="url(#colorDisp)" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Inventory by category */}
        <Card>
          <h3 className="text-base font-semibold text-slate-800 mb-1">Inventory by Category</h3>
          <p className="text-sm text-slate-500 mb-4">Stock distribution</p>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={chartData.inventoryByCategory}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
              >
                {chartData.inventoryByCategory.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "13px" }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {chartData.inventoryByCategory.map((cat) => (
              <div key={cat.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: cat.color }} />
                <span className="text-xs text-slate-600">{cat.name}</span>
                <span className="text-xs font-semibold text-slate-700 ml-auto">{cat.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stock status */}
        <Card>
          <h3 className="text-base font-semibold text-slate-800 mb-1">Stock Status</h3>
          <p className="text-sm text-slate-500 mb-4">Medicine stock health</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData.stockStatus} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} width={80} />
              <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "13px" }} />
              <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                {chartData.stockStatus.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Expiry distribution */}
        <Card>
          <h3 className="text-base font-semibold text-slate-800 mb-1">Expiry Distribution</h3>
          <p className="text-sm text-slate-500 mb-4">Batch expiry status breakdown</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData.expiryDistribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "13px" }} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {chartData.expiryDistribution.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Alerts section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Low stock alert */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-warning-50 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-warning-600" />
            </div>
            <h3 className="text-base font-semibold text-slate-800">Low Stock Alerts</h3>
          </div>
          <div className="space-y-3">
            {alerts.lowStockAlerts.map((a) => (
              <div key={a.id} className="p-3 rounded-lg bg-warning-50/50 border border-warning-100">
                <p className="text-sm font-medium text-slate-800">{a.medicine?.name}</p>
                <div className="mt-1 flex items-center gap-3 text-xs text-slate-500">
                  <span>Stock: <strong className="text-warning-700">{a.quantity}</strong></span>
                  <span>Min: {a.minimumStock}</span>
                </div>
                <button
                  onClick={() => navigate("/admin/inventory")}
                  className="mt-2 text-xs font-medium text-brand-600 hover:text-brand-700 flex items-center gap-1"
                >
                  View Inventory <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            ))}
            {alerts.lowStockAlerts.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-4">No low stock alerts</p>
            )}
          </div>
        </Card>

        {/* Near expiry alert */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-yellow-50 flex items-center justify-center">
              <CalendarClock className="w-4 h-4 text-yellow-600" />
            </div>
            <h3 className="text-base font-semibold text-slate-800">Near Expiry Alerts</h3>
          </div>
          <div className="space-y-3">
            {alerts.nearExpiryAlerts.map((a) => (
              <div key={a.id} className="p-3 rounded-lg bg-yellow-50/50 border border-yellow-100">
                <p className="text-sm font-medium text-slate-800">{a.medicine?.name}</p>
                <div className="mt-1 flex items-center gap-3 text-xs text-slate-500">
                  <span>Batch: <strong className="text-slate-700">{a.batchNumber}</strong></span>
                  <span className={a.daysRemaining <= 30 ? "text-orange-600 font-medium" : ""}>
                    Expires in {a.daysRemaining} days
                  </span>
                </div>
                <button
                  onClick={() => navigate("/admin/batches")}
                  className="mt-2 text-xs font-medium text-brand-600 hover:text-brand-700 flex items-center gap-1"
                >
                  View Batch <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            ))}
            {alerts.nearExpiryAlerts.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-4">No near expiry alerts</p>
            )}
          </div>
        </Card>

        {/* Expired alert */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-danger-50 flex items-center justify-center">
              <PackageX className="w-4 h-4 text-danger-600" />
            </div>
            <h3 className="text-base font-semibold text-slate-800">Expired Batch Alerts</h3>
          </div>
          <div className="space-y-3">
            {alerts.expiredAlerts.map((a) => (
              <div key={a.id} className="p-3 rounded-lg bg-danger-50/50 border border-danger-100">
                <p className="text-sm font-medium text-slate-800">{a.medicine?.name}</p>
                <div className="mt-1 flex items-center gap-3 text-xs text-slate-500">
                  <span>Batch: <strong className="text-slate-700">{a.batchNumber}</strong></span>
                  <span className="text-danger-600 font-medium">Expired on {formatDate(a.expiryDate)}</span>
                </div>
                <button
                  onClick={() => navigate("/admin/expiry")}
                  className="mt-2 text-xs font-medium text-danger-600 hover:text-danger-700 flex items-center gap-1"
                >
                  Review <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            ))}
            {alerts.expiredAlerts.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-4">No expired batches</p>
            )}
          </div>
        </Card>
      </div>

      {/* Recent activity */}
      <Card padding={false}>
        <div className="px-5 py-4 border-b border-slate-200">
          <h3 className="text-base font-semibold text-slate-800">Recent Activity</h3>
          <p className="text-sm text-slate-500">Latest actions across the system</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50">
                <th className="px-5 py-3 text-left font-semibold text-slate-600">User</th>
                <th className="px-5 py-3 text-left font-semibold text-slate-600">Role</th>
                <th className="px-5 py-3 text-left font-semibold text-slate-600">Action</th>
                <th className="px-5 py-3 text-left font-semibold text-slate-600">Description</th>
                <th className="px-5 py-3 text-left font-semibold text-slate-600">Date</th>
                <th className="px-5 py-3 text-left font-semibold text-slate-600">Time</th>
                <th className="px-5 py-3 text-left font-semibold text-slate-600">Status</th>
              </tr>
            </thead>
            <tbody>
              {activities.map((act) => (
                <tr key={act.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  <td className="px-5 py-3 text-slate-700 font-medium">{act.userName}</td>
                  <td className="px-5 py-3">
                    <span className={`badge ${act.role === "admin" ? "bg-brand-100 text-brand-700" : "bg-purple-100 text-purple-700"}`}>
                      {act.role}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-slate-600">{act.action.replace(/_/g, " ")}</td>
                  <td className="px-5 py-3 text-slate-600 max-w-xs truncate">{act.description}</td>
                  <td className="px-5 py-3 text-slate-500">{formatDate(act.timestamp)}</td>
                  <td className="px-5 py-3 text-slate-500">{formatTime(act.timestamp)}</td>
                  <td className="px-5 py-3"><StatusBadge status="completed" type="completed" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-slate-200">
          <button
            onClick={() => navigate("/admin/audit-logs")}
            className="text-sm font-medium text-brand-600 hover:text-brand-700 flex items-center gap-1"
          >
            View all audit logs <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </Card>
    </div>
  );
}
