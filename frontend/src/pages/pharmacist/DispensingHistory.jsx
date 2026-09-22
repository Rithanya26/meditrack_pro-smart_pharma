import { useState, useEffect, useMemo } from "react";
import { ScrollText } from "lucide-react";
import PageHeader from "../../components/common/PageHeader";
import Card from "../../components/ui/Card";
import SearchInput from "../../components/ui/SearchInput";
import DataTable from "../../components/ui/DataTable";
import { StatusBadge } from "../../components/ui/StatusBadge";
import EmptyState from "../../components/ui/EmptyState";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import ErrorState from "../../components/ui/ErrorState";
import Modal from "../../components/ui/Modal";
import { dispensingService } from "../../services/dispensingService";
import { useAuth } from "../../context/AuthContext";
import { formatDate, formatTime } from "../../utils/helpers";

export default function DispensingHistory() {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  useEffect(() => { load(); }, [user.id]);

  async function load() {
    setLoading(true);
    setError(false);
    try {
      const data = await dispensingService.getTransactions({ pharmacistId: user.id });
      setRecords(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    return records.filter((r) => {
      const q = search.toLowerCase();
      const matchSearch = !q || [r.id, r.customerName, r.customerPhone, r.pharmacistName, ...r.items.map((item) => item.medicineName)]
        .some((value) => String(value || "").toLowerCase().includes(q));
      const matchDate = !dateFilter || r.date.startsWith(dateFilter);
      return matchSearch && matchDate;
    });
  }, [records, search, dateFilter]);

  const columns = [
    { key: "id", header: "Transaction ID", render: (r) => <span className="font-mono text-xs text-slate-600">{r.id}</span> },
    { key: "customerName", header: "Customer", render: (r) => <span className="font-medium text-slate-800">{r.customerName}</span> },
    { key: "customerPhone", header: "Phone", render: (r) => <span className="text-slate-600">{r.customerPhone}</span> },
    { key: "totalItems", header: "Medicines", render: (r) => <span className="font-semibold text-slate-700">{r.totalItems}</span> },
    { key: "date", header: "Date", render: (r) => formatDate(r.date) },
    { key: "time", header: "Time", render: (r) => formatTime(r.date) },
    { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} type="completed" /> },
  ];

  return (
    <div>
      <PageHeader title="Dispensing History" subtitle="Your personal dispensing records" />

      <Card className="mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <SearchInput value={search} onChange={setSearch} placeholder="Search medicine, batch, or ID..." />
          <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="input" />
        </div>
      </Card>

      <Card padding={false}>
        {loading ? <LoadingSpinner /> :
         error ? <ErrorState onRetry={load} /> :
         filtered.length === 0 ? <EmptyState icon={ScrollText} title="No dispensing history" message="You have no dispensing records yet." /> :
         <DataTable columns={columns} data={filtered} onRowClick={setSelectedTransaction} />}
      </Card>
      <Modal open={Boolean(selectedTransaction)} onClose={() => setSelectedTransaction(null)} title="Dispensing Transaction" size="lg">
        {selectedTransaction && (
          <div>
            <div className="grid grid-cols-2 gap-3 mb-5 text-sm">
              <div><p className="text-slate-500">Transaction ID</p><p className="font-mono font-semibold">{selectedTransaction.id}</p></div>
              <div><p className="text-slate-500">Date</p><p className="font-semibold">{formatDate(selectedTransaction.date)}</p></div>
              <div><p className="text-slate-500">Customer</p><p className="font-semibold">{selectedTransaction.customerName}</p></div>
              <div><p className="text-slate-500">Phone</p><p className="font-semibold">{selectedTransaction.customerPhone}</p></div>
            </div>
            <div className="border-t border-slate-200 pt-3 space-y-2">
              {selectedTransaction.items.map((item) => <div key={item.batchId} className="flex justify-between text-sm"><span>{item.medicineName} · {item.batchNumber}</span><strong>{item.quantity} units</strong></div>)}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
