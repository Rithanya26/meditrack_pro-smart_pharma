import { useState, useEffect, useMemo } from "react";
import { Plus, Package } from "lucide-react";
import PageHeader from "../../components/common/PageHeader";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import SearchInput from "../../components/ui/SearchInput";
import { Select, Input } from "../../components/ui/Input";
import DataTable from "../../components/ui/DataTable";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { TableActions } from "../../components/ui/TableActions";
import EmptyState from "../../components/ui/EmptyState";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import ErrorState from "../../components/ui/ErrorState";
import { batchService } from "../../services/batchService";
import { medicineService } from "../../services/medicineService";
import { useToast } from "../../context/ToastContext";
import { daysUntilExpiry, getExpiryStatus, formatDate, EXPIRY_STATUS } from "../../utils/helpers";

export default function BatchManagement() {
  const toast = useToast();
  const [batches, setBatches] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editBatch, setEditBatch] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    medicineId: "", batchNumber: "", manufacturingDate: "", expiryDate: "",
    supplier: "", receivedDate: "", quantity: "", minimumStock: "",
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    setError(false);
    try {
      const [bats, meds] = await Promise.all([batchService.getAll(), medicineService.getAll()]);
      setBatches(bats.map((b) => ({ ...b, daysRemaining: daysUntilExpiry(b.expiryDate), expiryStatus: getExpiryStatus(daysUntilExpiry(b.expiryDate)) })));
      setMedicines(meds.filter((m) => m.status === "active"));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    return batches.filter((b) => {
      const q = search.toLowerCase();
      const matchSearch = !q || b.medicine?.name?.toLowerCase().includes(q) || b.batchNumber.toLowerCase().includes(q);
      const matchStatus = !statusFilter || b.expiryStatus === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [batches, search, statusFilter]);

  function openAdd() {
    setEditBatch(null);
    setFormData({ medicineId: "", batchNumber: "", manufacturingDate: "", expiryDate: "", supplier: "", receivedDate: "", quantity: "", minimumStock: "" });
    setFormErrors({});
    setModalOpen(true);
  }

  function openEdit(batch) {
    setEditBatch(batch);
    setFormData({
      medicineId: batch.medicineId,
      batchNumber: batch.batchNumber,
      manufacturingDate: batch.manufacturingDate,
      expiryDate: batch.expiryDate,
      supplier: batch.supplier,
      receivedDate: batch.receivedDate,
      quantity: String(batch.quantity),
      minimumStock: String(batch.minimumStock),
    });
    setFormErrors({});
    setModalOpen(true);
  }

  function validate() {
    const e = {};
    if (!formData.medicineId) e.medicineId = "Medicine is required";
    if (!formData.batchNumber.trim()) e.batchNumber = "Batch number is required";
    else {
      const dup = batches.find((b) => b.batchNumber.toLowerCase() === formData.batchNumber.toLowerCase() && b.id !== editBatch?.id);
      if (dup) e.batchNumber = "Batch number must be unique";
    }
    if (!formData.manufacturingDate) e.manufacturingDate = "Manufacturing date is required";
    if (!formData.expiryDate) e.expiryDate = "Expiry date is required";
    if (formData.manufacturingDate && formData.expiryDate && new Date(formData.expiryDate) < new Date(formData.manufacturingDate)) {
      e.expiryDate = "Expiry date cannot be before manufacturing date";
    }
    if (!formData.supplier.trim()) e.supplier = "Supplier is required";
    if (!formData.receivedDate) e.receivedDate = "Received date is required";
    const qty = Number(formData.quantity);
    if (!formData.quantity || isNaN(qty) || qty <= 0) e.quantity = "Quantity must be a positive number";
    const min = Number(formData.minimumStock);
    if (!formData.minimumStock || isNaN(min) || min < 0) e.minimumStock = "Minimum stock must be 0 or greater";
    setFormErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const data = {
        ...formData,
        quantity: Number(formData.quantity),
        minimumStock: Number(formData.minimumStock),
      };
      if (editBatch) {
        await batchService.update(editBatch.id, data);
        toast.success("Batch updated successfully.");
      } else {
        await batchService.create(data);
        toast.success("Batch added successfully.");
      }
      setModalOpen(false);
      load();
    } catch {
      toast.error("Unable to save batch.");
    } finally {
      setSaving(false);
    }
  }

  // Calculate days remaining preview
  const previewDays = formData.expiryDate ? daysUntilExpiry(formData.expiryDate) : null;
  const previewStatus = previewDays !== null ? getExpiryStatus(previewDays) : null;

  const columns = [
    { key: "medicine", header: "Medicine", render: (b) => <span className="font-medium text-slate-800">{b.medicine?.name || "—"}</span> },
    { key: "batchNumber", header: "Batch Number", render: (b) => <span className="font-mono text-xs text-slate-600">{b.batchNumber}</span> },
    { key: "manufacturingDate", header: "Mfg Date", render: (b) => formatDate(b.manufacturingDate) },
    { key: "expiryDate", header: "Expiry Date", render: (b) => formatDate(b.expiryDate) },
    { key: "supplier", header: "Supplier", render: (b) => <span className="text-slate-600">{b.supplier}</span> },
    { key: "receivedDate", header: "Received", render: (b) => formatDate(b.receivedDate) },
    { key: "quantity", header: "Quantity", render: (b) => <span className="font-semibold text-slate-700">{b.quantity}</span> },
    { key: "expiryStatus", header: "Status", render: (b) => <StatusBadge status={b.expiryStatus} type="expiry" /> },
    { key: "actions", header: "Actions", align: "right", render: (b) => (
      <TableActions onEdit={() => openEdit(b)} />
    )},
  ];

  return (
    <div>
      <PageHeader
        title="Batch Management"
        subtitle="Track and manage medicine batches with expiry dates"
        actions={<Button onClick={openAdd}><Plus className="w-4 h-4" /> Add Batch</Button>}
      />

      <Card className="mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by medicine or batch number..." />
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Status</option>
            <option value={EXPIRY_STATUS.SAFE}>Safe</option>
            <option value={EXPIRY_STATUS.NEAR_EXPIRY}>Near Expiry</option>
            <option value={EXPIRY_STATUS.CRITICAL}>Critical</option>
            <option value={EXPIRY_STATUS.EXPIRED}>Expired</option>
          </Select>
        </div>
      </Card>

      <Card padding={false}>
        {loading ? <LoadingSpinner /> :
         error ? <ErrorState onRetry={load} /> :
         filtered.length === 0 ? <EmptyState icon={Package} title="No batches found" message="Try adjusting your filters or add a new batch." /> :
         <DataTable columns={columns} data={filtered} />}
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editBatch ? "Edit Batch" : "Add New Batch"} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select label="Medicine *" value={formData.medicineId} onChange={(e) => setFormData({ ...formData, medicineId: e.target.value })} error={formErrors.medicineId}>
            <option value="">Select medicine</option>
            {medicines.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </Select>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Batch Number *" value={formData.batchNumber} onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })} error={formErrors.batchNumber} placeholder="e.g. PCM2026A" />
            <Input label="Supplier *" value={formData.supplier} onChange={(e) => setFormData({ ...formData, supplier: e.target.value })} error={formErrors.supplier} placeholder="e.g. MediSupply Co" />
            <Input type="date" label="Manufacturing Date *" value={formData.manufacturingDate} onChange={(e) => setFormData({ ...formData, manufacturingDate: e.target.value })} error={formErrors.manufacturingDate} />
            <Input type="date" label="Expiry Date *" value={formData.expiryDate} onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })} error={formErrors.expiryDate} />
            <Input type="date" label="Received Date *" value={formData.receivedDate} onChange={(e) => setFormData({ ...formData, receivedDate: e.target.value })} error={formErrors.receivedDate} />
            <Input type="number" label="Quantity *" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: e.target.value })} error={formErrors.quantity} placeholder="e.g. 500" min="1" />
            <Input type="number" label="Minimum Stock" value={formData.minimumStock} onChange={(e) => setFormData({ ...formData, minimumStock: e.target.value })} error={formErrors.minimumStock} placeholder="e.g. 50" min="0" />
          </div>

          {/* Expiry preview */}
          {previewStatus && (
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">Days remaining until expiry</p>
                <p className="text-lg font-bold text-slate-800">{previewDays} days</p>
              </div>
              <StatusBadge status={previewStatus} type="expiry" />
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-200">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>{editBatch ? "Update Batch" : "Add Batch"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
