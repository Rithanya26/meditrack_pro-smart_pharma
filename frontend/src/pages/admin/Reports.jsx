import { useState } from "react";
import { FileBarChart, FileText, CalendarClock, Stethoscope, ScrollText, AlertTriangle, Download, Printer, FileSpreadsheet } from "lucide-react";
import PageHeader from "../../components/common/PageHeader";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import { useToast } from "../../context/ToastContext";
import DataTable from "../../components/ui/DataTable";
import { formatDate } from "../../utils/helpers";
import { mockMedicines, mockBatches, mockDispensing, mockDispensingTransactions, mockAuditLogs } from "../../data/mockData";
import { daysUntilExpiry, getExpiryStatus, getStockStatus } from "../../utils/helpers";

const REPORT_TYPES = [
  { id: "inventory", label: "Inventory Report", icon: FileText, description: "Current stock levels and status", color: "blue" },
  { id: "expiry", label: "Expiry Report", icon: CalendarClock, description: "Batch expiry analysis", color: "yellow" },
  { id: "dispensing", label: "Dispensing Report", icon: Stethoscope, description: "All dispensing transactions", color: "purple" },
  { id: "audit", label: "Audit Report", icon: ScrollText, description: "System activity log", color: "slate" },
  { id: "lowstock", label: "Low Stock Report", icon: AlertTriangle, description: "Items below minimum stock", color: "red" },
];

export default function Reports() {
  const toast = useToast();
  const [selectedReport, setSelectedReport] = useState(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [generated, setGenerated] = useState(null);
  const [generating, setGenerating] = useState(false);

  function generateReport(type) {
    setGenerating(true);
    setTimeout(() => {
      let data = [];
      let columns = [];

      if (type === "inventory") {
        columns = [
          { key: "name", header: "Medicine", render: (r) => r.name },
          { key: "category", header: "Category", render: (r) => r.category },
          { key: "stock", header: "Total Stock", render: (r) => r.stock },
          { key: "status", header: "Status", render: (r) => r.status },
        ];
        data = mockMedicines.map((m) => {
          const batches = mockBatches.filter((b) => b.medicineId === m.id);
          const stock = batches.reduce((s, b) => s + b.quantity, 0);
          return { id: m.id, name: m.name, category: m.category, stock, status: getStockStatus(stock, batches[0]?.minimumStock || 0) };
        });
      } else if (type === "expiry") {
        columns = [
          { key: "medicine", header: "Medicine", render: (r) => r.medicine },
          { key: "batch", header: "Batch", render: (r) => r.batch },
          { key: "expiry", header: "Expiry Date", render: (r) => formatDate(r.expiry) },
          { key: "days", header: "Days Left", render: (r) => r.days },
          { key: "status", header: "Status", render: (r) => r.status },
        ];
        data = mockBatches.map((b) => {
          const med = mockMedicines.find((m) => m.id === b.medicineId);
          const days = daysUntilExpiry(b.expiryDate);
          return { id: b.id, medicine: med?.name, batch: b.batchNumber, expiry: b.expiryDate, days, status: getExpiryStatus(days) };
        });
      } else if (type === "dispensing") {
        columns = [
          { key: "id", header: "Transaction ID", render: (r) => r.id },
          { key: "medicine", header: "Medicine", render: (r) => r.medicine },
          { key: "quantity", header: "Qty", render: (r) => r.quantity },
          { key: "pharmacist", header: "Pharmacist", render: (r) => r.pharmacist },
          { key: "date", header: "Date", render: (r) => formatDate(r.date) },
        ];
        data = [
          ...mockDispensing.map((d) => ({ id: d.id, medicine: d.medicineName, quantity: d.quantity, pharmacist: d.pharmacistName, date: d.date })),
          ...mockDispensingTransactions.flatMap((transaction) => transaction.items.map((item) => ({
            id: transaction.id,
            medicine: item.medicineName,
            quantity: item.quantity,
            pharmacist: transaction.pharmacistName,
            date: transaction.date,
          }))),
        ];
      } else if (type === "audit") {
        columns = [
          { key: "timestamp", header: "Timestamp", render: (r) => formatDate(r.timestamp) },
          { key: "user", header: "User", render: (r) => r.user },
          { key: "action", header: "Action", render: (r) => r.action },
          { key: "description", header: "Description", render: (r) => r.description },
        ];
        data = mockAuditLogs.map((l) => ({ id: l.id, timestamp: l.timestamp, user: l.userName, action: l.action, description: l.description }));
      } else if (type === "lowstock") {
        columns = [
          { key: "medicine", header: "Medicine", render: (r) => r.medicine },
          { key: "batch", header: "Batch", render: (r) => r.batch },
          { key: "stock", header: "Stock", render: (r) => r.stock },
          { key: "min", header: "Minimum", render: (r) => r.min },
        ];
        data = mockBatches
          .filter((b) => b.quantity <= b.minimumStock)
          .map((b) => {
            const med = mockMedicines.find((m) => m.id === b.medicineId);
            return { id: b.id, medicine: med?.name, batch: b.batchNumber, stock: b.quantity, min: b.minimumStock };
          });
      }

      setGenerated({ type, columns, data, count: data.length });
      setGenerating(false);
      toast.success("Report generated successfully.");
    }, 600);
  }

  return (
    <div>
      <PageHeader title="Reports" subtitle="Generate and export pharmacy reports" />

      {/* Report cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {REPORT_TYPES.map((r) => {
          const isActive = selectedReport === r.id;
          return (
            <Card key={r.id} className={isActive ? "ring-2 ring-brand-500" : ""}>
              <button onClick={() => { setSelectedReport(r.id); setGenerated(null); }} className="w-full text-left">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-3 ${
                  r.color === "blue" ? "bg-brand-50 text-brand-600" :
                  r.color === "yellow" ? "bg-yellow-50 text-yellow-600" :
                  r.color === "purple" ? "bg-purple-50 text-purple-600" :
                  r.color === "red" ? "bg-danger-50 text-danger-600" :
                  "bg-slate-100 text-slate-600"
                }`}>
                  <r.icon className="w-6 h-6" />
                </div>
                <h3 className="text-base font-semibold text-slate-800">{r.label}</h3>
                <p className="text-sm text-slate-500 mt-0.5">{r.description}</p>
              </button>
            </Card>
          );
        })}
      </div>

      {/* Date range + generate */}
      {selectedReport && (
        <Card className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            <div className="flex-1 grid grid-cols-2 gap-3">
              <div>
                <label className="label">From Date</label>
                <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="input" />
              </div>
              <div>
                <label className="label">To Date</label>
                <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="input" />
              </div>
            </div>
            <Button loading={generating} onClick={() => generateReport(selectedReport)}>
              <FileBarChart className="w-4 h-4" /> Generate Report
            </Button>
          </div>
        </Card>
      )}

      {/* Report preview */}
      {generated && (
        <Card padding={false}>
          <div className="px-5 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-slate-800">{REPORT_TYPES.find((r) => r.id === generated.type)?.label}</h3>
              <p className="text-sm text-slate-500">{generated.count} records found</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={() => toast.info("PDF export initiated (demo).")}>
                <Download className="w-4 h-4" /> PDF
              </Button>
              <Button variant="secondary" size="sm" onClick={() => toast.info("Excel export initiated (demo).")}>
                <FileSpreadsheet className="w-4 h-4" /> Excel
              </Button>
              <Button variant="secondary" size="sm" onClick={() => window.print()}>
                <Printer className="w-4 h-4" /> Print
              </Button>
            </div>
          </div>
          <DataTable columns={generated.columns} data={generated.data.slice(0, 50)} emptyMessage="No data for this report." />
        </Card>
      )}
    </div>
  );
}
