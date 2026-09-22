import { useState, useEffect, useMemo } from "react";
import { CalendarClock } from "lucide-react";
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

export default function ExpiryAlerts() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

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
      return matchSearch && matchStatus;
    });
  }, [items, search, statusFilter]);

  const summary = useMemo(() => ({
    near: items.filter((i) => i.expiryStatus === EXPIRY_STATUS.NEAR_EXPIRY).length,
    critical: items.filter((i) => i.expiryStatus === EXPIRY_STATUS.CRITICAL).length,
    expired: items.filter((i) => i.expiryStatus === EXPIRY_STATUS.EXPIRED).length,
  }), [items]);

  const columns = [
    { key: "medicine", header: "Medicine", render: (i) => <span className="font-medium text-slate-800">{i.medicine?.name}</span> },
    { key: "batchNumber", header: "Batch", render: (i) => <span className="font-mono text-xs text-slate-600">{i.batchNumber}</span> },
    { key: "quantity", header: "Qty", render: (i) => <span className="font-semibold text-slate-700">{i.quantity}</span> },
    { key: "expiryDate", header: "Expiry Date", render: (i) => formatDate(i.expiryDate) },
    { key: "daysRemaining", header: "Days Left", render: (i) => (
      <span className={i.daysRemaining <= 0 ? "text-danger-600 font-semibold" : i.daysRemaining <= 30 ? "text-orange-600 font-semibold" : "text-yellow-600 font-semibold"}>
        {i.daysRemaining <= 0 ? "Expired" : `${i.daysRemaining}d`}
      </span>
    )},
    { key: "expiryStatus", header: "Status", render: (i) => <StatusBadge status={i.expiryStatus} type="expiry" /> },
  ];

  return (
    <div>
      <PageHeader title="Expiry Alerts" subtitle="Monitor medicines approaching expiry" />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard icon={CalendarClock} label="Near Expiry" value={summary.near} color="yellow" />
        <StatCard icon={CalendarClock} label="Critical" value={summary.critical} color="orange" />
        <StatCard icon={CalendarClock} label="Expired" value={summary.expired} color="red" />
      </div>

      <Card className="mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <SearchInput value={search} onChange={setSearch} placeholder="Search medicine or batch..." />
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Status</option>
            <option value={EXPIRY_STATUS.NEAR_EXPIRY}>Near Expiry</option>
            <option value={EXPIRY_STATUS.CRITICAL}>Critical</option>
            <option value={EXPIRY_STATUS.EXPIRED}>Expired</option>
          </Select>
        </div>
      </Card>

      <Card padding={false}>
        {loading ? <LoadingSpinner /> :
         error ? <ErrorState onRetry={load} /> :
         filtered.length === 0 ? <EmptyState icon={CalendarClock} title="No expiry alerts" message="No batches match your filters." /> :
         <DataTable columns={columns} data={filtered} />}
      </Card>
    </div>
  );
}
