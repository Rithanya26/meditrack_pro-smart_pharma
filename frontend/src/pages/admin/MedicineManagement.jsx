import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Pill, Boxes, AlertTriangle, CheckCircle2 } from "lucide-react";
import PageHeader from "../../components/common/PageHeader";
import StatCard from "../../components/common/StatCard";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import SearchInput from "../../components/ui/SearchInput";
import { Select, Input, TextArea } from "../../components/ui/Input";
import DataTable from "../../components/ui/DataTable";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { TableActions } from "../../components/ui/TableActions";
import EmptyState from "../../components/ui/EmptyState";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import ErrorState from "../../components/ui/ErrorState";
import { medicineService } from "../../services/medicineService";
import { batchService } from "../../services/batchService";
import { DOSAGE_FORMS } from "../../data/mockData";
import { formatNumber } from "../../utils/helpers";
import { useToast } from "../../context/ToastContext";

export default function MedicineManagement() {
  const navigate = useNavigate();
  const toast = useToast();
  const [medicines, setMedicines] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState("");
  const [formFilter, setFormFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editMed, setEditMed] = useState(null);
  const [formData, setFormData] = useState({
    genericMedicine: "",
    brandName: "",
    manufacturer: "",
    strength: "",
    dosageForm: "",
    minimumStock: "",
    status: "active",
    description: "",
  });
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadMedicines();
  }, []);

  async function loadMedicines() {
    setLoading(true);
    setError(false);
    try {
      const [medsData, batchesData] = await Promise.all([
        medicineService.getAll(),
        batchService.getAll(),
      ]);
      setMedicines(medsData);
      setBatches(batchesData);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  // Live stock mapping per medicine ID calculated from active usable batches
  const medicineStockMap = useMemo(() => {
    const map = {};
    (medicines || []).forEach((m) => {
      map[String(m.id)] = 0;
    });

    (batches || []).forEach((b) => {
      const medId = String(b.medicine?.id || b.medicineId);
      const isNotExpired = !b.expiryDate || new Date(b.expiryDate) > new Date();
      if (isNotExpired) {
        map[medId] = (map[medId] || 0) + Number(b.quantity || 0);
      }
    });
    return map;
  }, [medicines, batches]);

  // Inventory KPI metrics
  const stockSummary = useMemo(() => {
    let inStock = 0;
    let lowStock = 0;
    let outOfStock = 0;
    let totalUnits = 0;

    medicines.forEach((m) => {
      const stock = medicineStockMap[String(m.id)] ?? 0;
      totalUnits += stock;
      if (stock === 0) {
        outOfStock++;
      } else if (stock <= (m.minimumStock ?? 0)) {
        lowStock++;
      } else {
        inStock++;
      }
    });

    return { inStock, lowStock, outOfStock, totalUnits };
  }, [medicines, medicineStockMap]);

  const filtered = useMemo(() => {
    return medicines.filter((m) => {
      const q = search.trim().toLowerCase();
      const brandName = (m.brandName || m.name || "").toLowerCase();
      const genericMed = (m.genericMedicine || m.genericName || "").toLowerCase();
      const manufacturer = (m.manufacturer || "").toLowerCase();
      const strength = (m.strength || "").toLowerCase();
      const dosageForm = (m.dosageForm || "").toLowerCase();

      const matchSearch =
        !q ||
        brandName.includes(q) ||
        genericMed.includes(q) ||
        manufacturer.includes(q) ||
        strength.includes(q) ||
        dosageForm.includes(q);

      const matchForm = !formFilter || m.dosageForm === formFilter;
      const matchStatus = !statusFilter || m.status === statusFilter;
      return matchSearch && matchForm && matchStatus;
    });
  }, [medicines, search, formFilter, statusFilter]);

  function openAdd() {
    setEditMed(null);
    setFormData({
      genericMedicine: "",
      brandName: "",
      manufacturer: "",
      strength: "",
      dosageForm: "",
      minimumStock: "",
      status: "active",
      description: "",
    });
    setFormErrors({});
    setModalOpen(true);
  }

  function openEdit(med) {
    setEditMed(med);
    setFormData({
      genericMedicine: med.genericMedicine || med.genericName || "",
      brandName: med.brandName || med.name || "",
      manufacturer: med.manufacturer || "",
      strength: med.strength || "",
      dosageForm: med.dosageForm || "",
      minimumStock:
        med.minimumStock !== undefined && med.minimumStock !== null ? String(med.minimumStock) : "0",
      status: med.status || "active",
      description: med.description || "",
    });
    setFormErrors({});
    setModalOpen(true);
  }

  function validate() {
    const e = {};
    if (!formData.genericMedicine?.trim()) {
      e.genericMedicine = "Generic medicine is required";
    }
    if (!formData.brandName?.trim()) {
      e.brandName = "Brand name is required";
    } else {
      const dup = medicines.find(
        (m) =>
          (m.brandName || m.name)?.toLowerCase() === formData.brandName.trim().toLowerCase() &&
          m.id !== editMed?.id
      );
      if (dup) {
        e.brandName = "A medicine with this brand name already exists";
      }
    }
    if (!formData.manufacturer?.trim()) {
      e.manufacturer = "Manufacturer is required";
    }
    if (!formData.strength?.trim()) {
      e.strength = "Strength is required";
    }
    if (!formData.dosageForm?.trim()) {
      e.dosageForm = "Dosage form is required";
    }
    const minStock = Number(formData.minimumStock);
    if (
      formData.minimumStock === "" ||
      formData.minimumStock === null ||
      isNaN(minStock) ||
      minStock < 0
    ) {
      e.minimumStock = "Minimum stock is required and must be 0 or greater";
    }
    if (!formData.status?.trim()) {
      e.status = "Status is required";
    }
    setFormErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        brandName: formData.brandName.trim(),
        name: formData.brandName.trim(),
        genericMedicine: formData.genericMedicine.trim(),
        genericName: formData.genericMedicine.trim(),
        manufacturer: formData.manufacturer.trim(),
        strength: formData.strength.trim(),
        dosageForm: formData.dosageForm.trim(),
        minimumStock: Number(formData.minimumStock),
        description: formData.description?.trim() || "",
        status: formData.status,
      };

      if (editMed) {
        await medicineService.update(editMed.id, payload);
        toast.success("Medicine updated successfully.");
      } else {
        await medicineService.create(payload);
        toast.success("Medicine added successfully.");
      }
      setModalOpen(false);
      loadMedicines();
    } catch {
      toast.error("Unable to save medicine.");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(med) {
    try {
      await medicineService.toggleStatus(med.id);
      toast.success(`Medicine ${med.status === "active" ? "deactivated" : "activated"} successfully.`);
      loadMedicines();
    } catch {
      toast.error("Unable to update medicine status.");
    }
  }

  const columns = [
    {
      key: "brandName",
      header: "Brand Name",
      render: (m) => (
        <div className="flex flex-col">
          <button
            type="button"
            onClick={() => navigate(`/admin/medicines/${m.id}`)}
            className="font-bold text-slate-900 hover:text-brand-600 text-left text-sm"
          >
            {m.brandName || m.name}
          </button>
          <span className="text-xs text-slate-500 font-medium mt-0.5">
            {m.genericMedicine || m.genericName} · {m.strength} · {m.dosageForm}
          </span>
        </div>
      ),
    },
    {
      key: "genericMedicine",
      header: "Generic Medicine",
      render: (m) => (
        <span className="text-slate-700 font-medium">
          {m.genericMedicine || m.genericName}
        </span>
      ),
    },
    {
      key: "strength",
      header: "Strength",
      render: (m) => <span className="text-slate-600">{m.strength}</span>,
    },
    {
      key: "dosageForm",
      header: "Dosage Form",
      render: (m) => <span className="text-slate-600">{m.dosageForm}</span>,
    },
    {
      key: "manufacturer",
      header: "Manufacturer",
      render: (m) => <span className="text-slate-600">{m.manufacturer}</span>,
    },
    {
      key: "minimumStock",
      header: "Min Stock",
      render: (m) => <span className="font-semibold text-slate-700">{m.minimumStock ?? 0}</span>,
    },
    {
      key: "currentStock",
      header: "Current Stock",
      render: (m) => {
        const stock = medicineStockMap[String(m.id)] ?? 0;
        const minStock = m.minimumStock ?? 0;
        const isOutOfStock = stock === 0;
        const isLowStock = stock > 0 && stock <= minStock;

        return (
          <div className="flex flex-col">
            <span className="font-bold text-slate-900 text-sm">
              {formatNumber(stock)} <span className="text-xs text-slate-500 font-normal">units</span>
            </span>
            <span className="text-[11px] font-semibold mt-0.5">
              {isOutOfStock ? (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-rose-700 bg-rose-50 border border-rose-200">
                  Out of Stock
                </span>
              ) : isLowStock ? (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-amber-700 bg-amber-50 border border-amber-200">
                  Low Stock (≤{minStock})
                </span>
              ) : (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-emerald-700 bg-emerald-50 border border-emerald-200">
                  Healthy Level
                </span>
              )}
            </span>
          </div>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      render: (m) => <StatusBadge status={m.status} type="active" />,
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (m) => (
        <TableActions
          onView={() => navigate(`/admin/medicines/${m.id}`)}
          onEdit={() => openEdit(m)}
          onToggle={() => handleToggle(m)}
          isActive={m.status === "active"}
        />
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Medicine Management"
        subtitle="Manage all medicines and live stock levels in the pharmacy inventory"
        actions={
          <Button onClick={openAdd}>
            <Plus className="w-4 h-4" /> Add Medicine
          </Button>
        }
      />

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          icon={Pill}
          label="Total Medicines"
          value={medicines.length}
          color="blue"
        />
        <StatCard
          icon={CheckCircle2}
          label="Healthy Stock Level"
          value={stockSummary.inStock}
          color="green"
        />
        <StatCard
          icon={AlertTriangle}
          label="Low Stock Alert"
          value={stockSummary.lowStock}
          color="orange"
        />
        <StatCard
          icon={Boxes}
          label="Total Inventory Units"
          value={formatNumber(stockSummary.totalUnits)}
          color="purple"
        />
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search by brand, generic, manufacturer, strength, form..."
          />
          <Select value={formFilter} onChange={(e) => setFormFilter(e.target.value)}>
            <option value="">All Dosage Forms</option>
            {DOSAGE_FORMS.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </Select>
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </Select>
        </div>
      </Card>

      {/* Table */}
      <Card padding={false}>
        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <ErrorState onRetry={loadMedicines} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Pill}
            title="No medicines found"
            message="Try adjusting your filters or add a new medicine."
          />
        ) : (
          <DataTable
            columns={columns}
            data={filtered}
            onRowClick={(m) => navigate(`/admin/medicines/${m.id}`)}
          />
        )}
      </Card>

      {/* Add/Edit modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editMed ? "Edit Medicine" : "Add New Medicine"}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 1. Generic Medicine * */}
            <Input
              label="Generic Medicine *"
              value={formData.genericMedicine}
              onChange={(e) => setFormData({ ...formData, genericMedicine: e.target.value })}
              error={formErrors.genericMedicine}
              placeholder="e.g. Paracetamol"
            />
            {/* 2. Brand Name * */}
            <Input
              label="Brand Name *"
              value={formData.brandName}
              onChange={(e) => setFormData({ ...formData, brandName: e.target.value })}
              error={formErrors.brandName}
              placeholder="e.g. Dolo 650"
            />
            {/* 3. Manufacturer * */}
            <Input
              label="Manufacturer *"
              value={formData.manufacturer}
              onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
              error={formErrors.manufacturer}
              placeholder="e.g. Micro Labs"
            />
            {/* 4. Strength * */}
            <Input
              label="Strength *"
              value={formData.strength}
              onChange={(e) => setFormData({ ...formData, strength: e.target.value })}
              error={formErrors.strength}
              placeholder="e.g. 650 mg"
            />
            {/* 5. Dosage Form * */}
            <Select
              label="Dosage Form *"
              value={formData.dosageForm}
              onChange={(e) => setFormData({ ...formData, dosageForm: e.target.value })}
              error={formErrors.dosageForm}
            >
              <option value="">Select dosage form</option>
              {DOSAGE_FORMS.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </Select>
            {/* 6. Minimum Stock * */}
            <Input
              type="number"
              label="Minimum Stock *"
              value={formData.minimumStock}
              onChange={(e) => setFormData({ ...formData, minimumStock: e.target.value })}
              error={formErrors.minimumStock}
              placeholder="e.g. 50"
              min="0"
            />
            {/* 7. Status * */}
            <Select
              label="Status *"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              error={formErrors.status}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </Select>
          </div>
          {/* 8. Description */}
          <TextArea
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Brief description of the medicine (optional)..."
          />
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-200">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              {editMed ? "Update Medicine" : "Add Medicine"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
