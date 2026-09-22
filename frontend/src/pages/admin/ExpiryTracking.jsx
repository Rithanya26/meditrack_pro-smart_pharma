import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarClock, ArrowRight } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import PageHeader from "../../components/common/PageHeader";
import Card from "../../components/ui/Card";
import StatCard from "../../components/common/StatCard";
import SearchInput from "../../components/ui/SearchInput";
import { Select } from "../../components/ui/Input";
import DataTable from "../../components/ui/DataTable";
import { StatusBadge } from "../../components/ui/StatusBadge";
import EmptyState from "../../components/ui/EmptyState";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import ErrorState from "../../components/ui/ErrorState";
import { inventoryService } from "../../services/inventoryService";
import { EXPIRY_STATUS, formatDate } from "../../utils/helpers";

export default function ExpiryTracking() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    setError(false);
    try {
      const data = await inventoryService.getAll();
      setItems(data.sort((a, b) => a.daysRemaining - b.daysRemaining));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    return items.filter((i) => {
      const q = search.toLowerCase();
      const matchSearch = !q || i.medicine?.name?.toLowerCase().includes(q) || i.batchNumber.toLowerCase().includes(q);
      const matchStatus = !statusFilter || i.expiryStatus === statusFilter;
      const matchCat = !categoryFilter || i.medicine?.category === categoryFilter;
      return matchSearch && matchStatus && matchCat;
    });
  }, [items, search, statusFilter, categoryFilter]);

  const summary = useMemo(() => ({
    safe: items.filter((i) => i.expiryStatus === EXPIRY_STATUS.SAFE).length,
    near: items.filter((i) => i.expiryStatus === EXPIRY_STATUS.NEAR_EXPIRY).length,
    critical: items.filter((i) => i.expiryStatus === EXPIRY_STATUS.CRITICAL).length,
    expired: items.filter((i) => i.expiryStatus === EXPIRY_STATUS.EXPIRED).length,
  }), [items]);

  // Timeline chart data — count batches by days remaining bucket
  const timelineData = useMemo(() => {
    const buckets = [
      { range: "Expired", count: 0, color: "#ef4444" },
      { range: "1-30d", count: 0, color: "#f97316" },
      { range: "31-90d", count: 0, color: "#f59e0b" },
      { range: "91-180d", count: 0, color: "#2487eb" },
      { range: "180d+", count: 0, color: "#10b981" },
    ];
    items.forEach((i) => {
      const d = i.daysRemaining;
      if (d <= 0) buckets[0].count++;
      else if (d <= 30) buckets[1].count++;
      else if (d <= 90) buckets[2].count++;
      else if (d <= 180) buckets[3].count++;
      else buckets[4].count++;
    });
    return buckets;
  }, [items]);

  const columns = [
    { key: "medicine", header: "Medicine", render: (i) => <span className="font-medium text-slate-800">{i.medicine?.name}</span> },
    { key: "batchNumber", header: "Batch", render: (i) => <span className="font-mono text-xs text-slate-600">{i.batchNumber}</span> },
    { key: "quantity", header: "Quantity", render: (i) => <span className="font-semibold text-slate-700">{i.quantity}</span> },
    { key: "expiryDate", header: "Expiry Date", render: (i) => formatDate(i.expiryDate) },
    { key: "daysRemaining", header: "Days Remaining", render: (i) => (
      <span className={i.daysRemaining <= 0 ? "text-danger-600 font-semibold" : i.daysRemaining <= 30 ? "text-orange-600 font-semibold" : "text-slate-600"}>
        {i.daysRemaining <= 0 ? "Expired" : `${i.daysRemaining} days`}
      </span>
    )},
    { key: "expiryStatus", header: "Status", render: (i) => <StatusBadge status={i.expiryStatus} type="expiry" /> },
    { key: "action", header: "", align: "right", render: () => (
      <button onClick={() => navigate("/admin/inventory")} className="text-xs font-medium text-brand-600 hover:text-brand-700 flex items-center gap-1">
        View <ArrowRight className="w-3 h-3" />
      </button>
    )},
  ];

  return (
    <div>
      <PageHeader title="Expiry Tracking" subtitle="Monitor batch expiry with FEFO prioritization" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={CalendarClock} label="Safe" value={summary.safe} color="green" />
        <StatCard icon={CalendarClock} label="Near Expiry" value={summary.near} color="yellow" />
        <StatCard icon={CalendarClock} label="Critical" value={summary.critical} color="orange" />
        <StatCard icon={CalendarClock} label="Expired" value={summary.expired} color="red" />
      </div>

      {/* Timeline */}
      <Card className="mb-6">
        <h3 className="text-base font-semibold text-slate-800 mb-1">Expiry Timeline</h3>
        <p className="text-sm text-slate-500 mb-4">Distribution of batches by time remaining</p>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={timelineData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis dataKey="range" tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "13px" }} />
            <Bar dataKey="count" radius={[6, 6, 0, 0]}>
              {timelineData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card className="mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <SearchInput value={search} onChange={setSearch} placeholder="Search medicine or batch..." />
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Status</option>
            <option value={EXPIRY_STATUS.SAFE}>Safe</option>
            <option value={EXPIRY_STATUS.NEAR_EXPIRY}>Near Expiry</option>
            <option value={EXPIRY_STATUS.CRITICAL}>Critical</option>
            <option value={EXPIRY_STATUS.EXPIRED}>Expired</option>
          </Select>
          <Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="">All Categories</option>
            <option>Tablets</option><option>Capsules</option><option>Syrups</option>
            <option>Injections</option><option>Creams</option><option>Ointments</option>
          </Select>
        </div>
      </Card>

      <Card padding={false}>
        {loading ? <LoadingSpinner /> :
         error ? <ErrorState onRetry={load} /> :
         filtered.length === 0 ? <EmptyState icon={CalendarClock} title="No batches found" message="No batches match your filters." /> :
         <DataTable columns={columns} data={filtered} />}
      </Card>
    </div>
  );
}
