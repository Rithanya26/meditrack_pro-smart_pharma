import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Pill, Package, Boxes, CalendarClock } from "lucide-react";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import { StatusBadge } from "../../components/ui/StatusBadge";
import DataTable from "../../components/ui/DataTable";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import ErrorState from "../../components/ui/ErrorState";
import { medicineService } from "../../services/medicineService";
import { batchService } from "../../services/batchService";
import { daysUntilExpiry, getExpiryStatus, formatDate, formatNumber } from "../../utils/helpers";

export default function MedicineDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [medicine, setMedicine] = useState(null);
  const [batches, setBatches] = useState([]);
  const [dispensing, setDispensing] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [med, bats, disp] = await Promise.all([
          medicineService.getById(id),
          batchService.getByMedicine(id),
          medicineService.getDispensingHistory(id),
        ]);
        setMedicine(med);
        setBatches(bats.map((b) => ({ ...b, daysRemaining: daysUntilExpiry(b.expiryDate), expiryStatus: getExpiryStatus(daysUntilExpiry(b.expiryDate)) })));
        setDispensing(disp);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) return <LoadingSpinner size="lg" />;
  if (error || !medicine) return <ErrorState message="Medicine not found." onRetry={() => navigate("/admin/medicines")} />;

  const totalStock = batches.reduce((sum, b) => sum + b.quantity, 0);
  const activeBatches = batches.filter((b) => b.quantity > 0 && getExpiryStatus(daysUntilExpiry(b.expiryDate)) !== "Expired").length;
  const earliestExpiry = batches.length > 0 ? batches.reduce((min, b) => new Date(b.expiryDate) < new Date(min) ? b.expiryDate : min, batches[0].expiryDate) : null;

  const infoItems = [
    { label: "Generic Name", value: medicine.genericName },
    { label: "Category", value: medicine.category },
    { label: "Manufacturer", value: medicine.manufacturer },
    { label: "Strength", value: medicine.strength },
    { label: "Dosage Form", value: medicine.dosageForm },
    { label: "Status", value: <StatusBadge status={medicine.status} type="active" /> },
  ];

  const summaryCards = [
    { label: "Total Stock", value: formatNumber(totalStock), icon: Boxes, color: "blue" },
    { label: "Active Batches", value: activeBatches, icon: Package, color: "green" },
    { label: "Earliest Expiry", value: earliestExpiry ? formatDate(earliestExpiry) : "—", icon: CalendarClock, color: earliestExpiry ? "yellow" : "slate" },
  ];

  const batchColumns = [
    { key: "batchNumber", header: "Batch Number", render: (b) => <span className="font-medium text-slate-700">{b.batchNumber}</span> },
    { key: "expiryDate", header: "Expiry Date", render: (b) => formatDate(b.expiryDate) },
    { key: "quantity", header: "Available Qty", render: (b) => <span className="font-semibold text-slate-700">{b.quantity}</span> },
    { key: "expiryStatus", header: "Status", render: (b) => <StatusBadge status={b.expiryStatus} type="expiry" /> },
  ];

  const dispColumns = [
    { key: "id", header: "Transaction ID", render: (d) => <span className="font-mono text-xs text-slate-600">{d.id}</span> },
    { key: "batchNumber", header: "Batch", render: (d) => d.batchNumber },
    { key: "quantity", header: "Quantity", render: (d) => <span className="font-semibold">{d.quantity}</span> },
    { key: "pharmacistName", header: "Pharmacist", render: (d) => d.pharmacistName },
    { key: "date", header: "Date", render: (d) => formatDate(d.date) },
    { key: "status", header: "Status", render: (d) => <StatusBadge status={d.status} type="completed" /> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="secondary" size="sm" onClick={() => navigate("/admin/medicines")}>
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>
      </div>

      {/* Medicine header */}
      <Card>
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-xl bg-brand-50 flex items-center justify-center flex-shrink-0">
            <Pill className="w-7 h-7 text-brand-600" />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-slate-800">{medicine.name}</h1>
            <p className="text-sm text-slate-500">{medicine.description}</p>
          </div>
          <StatusBadge status={medicine.status} type="active" />
        </div>
      </Card>

      {/* Medicine info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-base font-semibold text-slate-800 mb-4">Medicine Information</h3>
          <dl className="space-y-3">
            {infoItems.map((item) => (
              <div key={item.label} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                <dt className="text-sm text-slate-500">{item.label}</dt>
                <dd className="text-sm font-medium text-slate-800">{item.value}</dd>
              </div>
            ))}
          </dl>
        </Card>

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {summaryCards.map((card) => (
            <Card key={card.label}>
              <div className="flex flex-col items-center text-center">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${
                  card.color === "blue" ? "bg-brand-50 text-brand-600" :
                  card.color === "green" ? "bg-success-50 text-success-600" :
                  card.color === "yellow" ? "bg-yellow-50 text-yellow-600" :
                  "bg-slate-100 text-slate-500"
                }`}>
                  <card.icon className="w-5 h-5" />
                </div>
                <p className="text-2xl font-bold text-slate-800">{card.value}</p>
                <p className="text-xs text-slate-500 mt-1">{card.label}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Batch summary */}
      <Card padding={false}>
        <div className="px-5 py-4 border-b border-slate-200">
          <h3 className="text-base font-semibold text-slate-800">Batch Summary</h3>
        </div>
        <DataTable columns={batchColumns} data={batches} emptyMessage="No batches available for this medicine." />
      </Card>

      {/* Dispensing history */}
      <Card padding={false}>
        <div className="px-5 py-4 border-b border-slate-200">
          <h3 className="text-base font-semibold text-slate-800">Dispensing History</h3>
        </div>
        <DataTable columns={dispColumns} data={dispensing} emptyMessage="No dispensing records found." />
      </Card>
    </div>
  );
}
