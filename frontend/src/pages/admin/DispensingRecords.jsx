import { useState, useEffect, useMemo } from "react";
import { Stethoscope } from "lucide-react";
import PageHeader from "../../components/common/PageHeader";
import Card from "../../components/ui/Card";
import SearchInput from "../../components/ui/SearchInput";
import { Select } from "../../components/ui/Input";
import DataTable from "../../components/ui/DataTable";
import { StatusBadge } from "../../components/ui/StatusBadge";
import EmptyState from "../../components/ui/EmptyState";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import ErrorState from "../../components/ui/ErrorState";
import Modal from "../../components/ui/Modal";
import { dispensingService } from "../../services/dispensingService";
import { formatDate, formatTime, formatNumber } from "../../utils/helpers";

export default function DispensingRecords() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState("");
  const [pharmacistFilter, setPharmacistFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    setError(false);
    try {
      const [transactions, legacy] = await Promise.all([
        dispensingService.getTransactions(),
        dispensingService.getAll(),
      ]);
      const legacyTransactions = legacy.map((record) => ({
        ...record,
        customerName: "Legacy transaction",
        customerPhone: "",
        totalItems: 1,
        items: [{ ...record, medicineName: record.medicineName }],
      }));
      setRecords([...transactions, ...legacyTransactions]);
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
      const matchPharm = !pharmacistFilter || r.pharmacistName === pharmacistFilter;
      const matchDate = !dateFilter || r.date.startsWith(dateFilter);
      return matchSearch && matchPharm && matchDate;
    });
  }, [records, search, pharmacistFilter, dateFilter]);

  const pharmacists = [...new Set(records.map((r) => r.pharmacistName))];
  const totalDispensed = filtered.reduce((sum, record) => sum + record.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0);

  const columns = [
    { key: "id", header: "Transaction ID", render: (r) => <span className="font-mono text-xs text-slate-600">{r.id}</span> },
    { key: "customerName", header: "Customer", render: (r) => <span className="font-medium text-slate-800">{r.customerName}</span> },
    { key: "customerPhone", header: "Phone", render: (r) => <span className="text-slate-600">{r.customerPhone || "-"}</span> },
    { key: "totalItems", header: "Medicines", render: (r) => <span className="font-semibold text-slate-700">{r.totalItems}</span> },
    { key: "pharmacistName", header: "Pharmacist", render: (r) => <span className="text-slate-600">{r.pharmacistName}</span> },
    { key: "date", header: "Date", render: (r) => formatDate(r.date) },
    { key: "time", header: "Time", render: (r) => formatTime(r.date) },
    { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} type="completed" /> },
  ];

  return (
    <div>
      <PageHeader title="Dispensing Records" subtitle={`Total dispensed: ${formatNumber(totalDispensed)} units`} />

      <Card className="mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <SearchInput value={search} onChange={setSearch} placeholder="Search medicine, batch, or ID..." />
          <Select value={pharmacistFilter} onChange={(e) => setPharmacistFilter(e.target.value)}>
            <option value="">All Pharmacists</option>
            {pharmacists.map((p) => <option key={p} value={p}>{p}</option>)}
          </Select>
          <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="input" />
        </div>
      </Card>

      <Card padding={false}>
        {loading ? <LoadingSpinner /> :
         error ? <ErrorState onRetry={load} /> :
         filtered.length === 0 ? <EmptyState icon={Stethoscope} title="No dispensing records" message="No dispensing activity found with current filters." /> :
         <DataTable columns={columns} data={filtered} onRowClick={setSelectedTransaction} />}
      </Card>
      <Modal open={Boolean(selectedTransaction)} onClose={() => setSelectedTransaction(null)} title="Dispensing Transaction" size="lg">
        {selectedTransaction && <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><p className="text-slate-500">Transaction ID</p><p className="font-mono font-semibold">{selectedTransaction.id}</p></div>
            <div><p className="text-slate-500">Customer</p><p className="font-semibold">{selectedTransaction.customerName}</p></div>
            <div><p className="text-slate-500">Phone</p><p className="font-semibold">{selectedTransaction.customerPhone || "-"}</p></div>
            <div><p className="text-slate-500">Pharmacist</p><p className="font-semibold">{selectedTransaction.pharmacistName}</p></div>
          </div>
          <div className="border-t border-slate-200 pt-3 space-y-2 text-sm">
            {selectedTransaction.items.map((item) => <div key={`${item.batchId}-${item.quantity}`} className="flex justify-between"><span>{item.medicineName} · {item.batchNumber}</span><strong>{item.quantity} units</strong></div>)}
          </div>
        </div>}
      </Modal>
    </div>
  );
}
