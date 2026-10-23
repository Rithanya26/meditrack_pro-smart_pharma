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

  useEffect(() => { load(); }, [user?.id]);

  async function load() {
    setLoading(true);
    setError(false);
    try {
      const data = await dispensingService.getTransactions({ pharmacistId: user?.id });
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
      const matchSearch = !q || [
        r.id,
        r.customerName,
        r.customerPhone,
        r.pharmacistName,
        ...(r.items || []).flatMap((item) => [item.brandName, item.medicineName, item.genericMedicine, item.batchNumber])
      ].some((value) => String(value || "").toLowerCase().includes(q));
      const matchDate = !dateFilter || (r.date && r.date.startsWith(dateFilter));
      return matchSearch && matchDate;
    });
  }, [records, search, dateFilter]);

  const columns = [
    { key: "id", header: "Transaction ID", render: (r) => <span className="font-mono text-xs font-semibold text-slate-700">#{r.id}</span> },
    { key: "customerName", header: "Customer", render: (r) => (
      <div>
        <p className="font-medium text-slate-800">{r.customerName}</p>
        {r.customerPhone && <p className="text-xs text-slate-500">{r.customerPhone}</p>}
      </div>
    )},
    {
      key: "medicines",
      header: "Dispensed Medicines",
      render: (r) => (
        <div className="space-y-1">
          {r.items && r.items.length > 0 ? (
            r.items.map((item, idx) => (
              <div key={idx} className="text-xs leading-tight">
                <span className="font-bold text-indigo-700">{item.brandName || item.medicineName}</span>
                {item.genericMedicine && <span className="text-slate-500 ml-1">· {item.genericMedicine}</span>}
                <span className="text-slate-600 font-medium ml-1">({item.quantity} units)</span>
              </div>
            ))
          ) : (
            <span className="text-xs text-slate-500">{r.totalItems} item(s)</span>
          )}
        </div>
      )
    },
    { key: "date", header: "Date & Time", render: (r) => (
      <div className="text-xs">
        <p className="font-medium text-slate-700">{formatDate(r.date)}</p>
        <p className="text-slate-400">{formatTime(r.date)}</p>
      </div>
    )},
    { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status || "completed"} type="completed" /> },
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
      <Modal open={Boolean(selectedTransaction)} onClose={() => setSelectedTransaction(null)} title="Dispensing Transaction Details" size="lg">
        {selectedTransaction && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm bg-slate-50 p-3.5 rounded-lg border border-slate-100">
              <div><p className="text-xs text-slate-500 uppercase tracking-wider">Transaction ID</p><p className="font-mono font-semibold text-slate-800">#{selectedTransaction.id}</p></div>
              <div><p className="text-xs text-slate-500 uppercase tracking-wider">Date</p><p className="font-semibold text-slate-800">{formatDate(selectedTransaction.date)}</p></div>
              <div><p className="text-xs text-slate-500 uppercase tracking-wider">Customer</p><p className="font-semibold text-slate-800">{selectedTransaction.customerName}</p></div>
              <div><p className="text-xs text-slate-500 uppercase tracking-wider">Phone</p><p className="font-semibold text-slate-800">{selectedTransaction.customerPhone || "-"}</p></div>
            </div>
            <div className="border-t border-slate-200 pt-3 space-y-2.5">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Dispensed Medicines ({selectedTransaction.items?.length || 0})</p>
              {selectedTransaction.items.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <div>
                    <p className="font-bold text-indigo-700 text-sm">{item.brandName || item.medicineName}</p>
                    <p className="text-xs text-slate-600 font-medium mt-0.5">
                      {item.genericMedicine ? `${item.genericMedicine} · ` : ""}{item.strength ? `${item.strength} · ` : ""}Batch: <span className="font-mono font-semibold text-slate-700">{item.batchNumber}</span>
                    </p>
                  </div>
                  <span className="font-semibold text-slate-800 bg-white px-3 py-1 rounded border border-slate-200 text-xs">
                    {item.quantity} units
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
