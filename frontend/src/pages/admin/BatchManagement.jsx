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
    genericMedicine: "",
    productId: "",
    batchNumber: "",
    supplier: "",
    manufacturingDate: "",
    expiryDate: "",
    receivedDate: "",
    quantity: "",
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    setError(false);
    try {
      const [bats, meds] = await Promise.all([batchService.getAll(), medicineService.getAll()]);
      setBatches(
        bats.map((b) => ({
          ...b,
          daysRemaining: daysUntilExpiry(b.expiryDate),
          expiryStatus: getExpiryStatus(daysUntilExpiry(b.expiryDate)),
        }))
      );
      setMedicines(meds.filter((m) => m.status === "ACTIVE" || m.status === "active"));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  // Unique list of Generic Medicines extracted from available products
  const genericOptions = useMemo(() => {
    const generics = new Set();
    medicines.forEach((m) => {
      const gen = (m.genericMedicine || m.genericName || "").trim();
      if (gen) {
        generics.add(gen);
      }
    });
    return Array.from(generics).sort((a, b) => a.localeCompare(b));
  }, [medicines]);

  // Filtered products list based on selected Generic Medicine
  const availableProducts = useMemo(() => {
    if (!formData.genericMedicine) return [];
    return medicines.filter((m) => {
      const gen = (m.genericMedicine || m.genericName || "").trim();
      return gen.toLowerCase() === formData.genericMedicine.trim().toLowerCase();
    });
  }, [medicines, formData.genericMedicine]);

  // Search across Batch Number, Product / Brand, Generic Medicine, Manufacturer, Supplier
  const filtered = useMemo(() => {
    return batches.filter((b) => {
      const q = search.trim().toLowerCase();
      const brand = (b.medicine?.brandName || b.medicine?.name || "").toLowerCase();
      const generic = (b.medicine?.genericMedicine || b.medicine?.genericName || "").toLowerCase();
      const manufacturer = (b.medicine?.manufacturer || "").toLowerCase();
      const supplier = (b.supplier || "").toLowerCase();
      const batchNum = (b.batchNumber || "").toLowerCase();

      const matchSearch =
        !q ||
        brand.includes(q) ||
        generic.includes(q) ||
        manufacturer.includes(q) ||
        supplier.includes(q) ||
        batchNum.includes(q);

      const matchStatus = !statusFilter || b.expiryStatus === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [batches, search, statusFilter]);

  function openAdd() {
    setEditBatch(null);
    setFormData({
      genericMedicine: "",
      productId: "",
      batchNumber: "",
      supplier: "",
      manufacturingDate: "",
      expiryDate: "",
      receivedDate: "",
      quantity: "",
    });
    setFormErrors({});
    setModalOpen(true);
  }

  function openEdit(batch) {
    setEditBatch(batch);
    const medId = batch.medicine?.id || batch.medicineId;
    const matchingMed = medicines.find((m) => m.id === medId);
    const generic =
      matchingMed?.genericMedicine ||
      matchingMed?.genericName ||
      batch.medicine?.genericMedicine ||
      batch.medicine?.genericName ||
      "";

    setFormData({
      genericMedicine: generic,
      productId: medId ? String(medId) : "",
      batchNumber: batch.batchNumber || "",
      supplier: batch.supplier || "",
      manufacturingDate: batch.manufacturingDate || "",
      expiryDate: batch.expiryDate || "",
      receivedDate: batch.receivedDate || "",
      quantity: batch.quantity !== undefined && batch.quantity !== null ? String(batch.quantity) : "",
    });
    setFormErrors({});
    setModalOpen(true);
  }

  function validate() {
    const e = {};
    if (!formData.genericMedicine) {
      e.genericMedicine = "Generic Medicine is required";
    }
    if (!formData.productId) {
      e.productId = "Product / Brand is required";
    }
    if (!formData.batchNumber.trim()) {
      e.batchNumber = "Batch number is required";
    } else {
      const dup = batches.find(
        (b) => b.batchNumber?.toLowerCase() === formData.batchNumber.trim().toLowerCase() && b.id !== editBatch?.id
      );
      if (dup) {
        e.batchNumber = "Batch number must be unique";
      }
    }
    if (!formData.supplier.trim()) {
      e.supplier = "Supplier is required";
    }
    if (!formData.manufacturingDate) {
      e.manufacturingDate = "Manufacturing date is required";
    }
    if (!formData.expiryDate) {
      e.expiryDate = "Expiry date is required";
    }
    if (!formData.receivedDate) {
      e.receivedDate = "Received date is required";
    }

    if (formData.manufacturingDate && formData.expiryDate) {
      if (new Date(formData.expiryDate) < new Date(formData.manufacturingDate)) {
        e.expiryDate = "Expiry date cannot be before manufacturing date";
      }
    }

    if (formData.manufacturingDate && formData.receivedDate) {
      if (new Date(formData.receivedDate) < new Date(formData.manufacturingDate)) {
        e.receivedDate = "Received date cannot be before manufacturing date";
      }
    }

    const qty = Number(formData.quantity);
    if (!formData.quantity || isNaN(qty) || qty <= 0) {
      e.quantity = "Quantity must be greater than 0";
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
        medicineId: Number(formData.productId),
        batchNumber: formData.batchNumber.trim(),
        supplier: formData.supplier.trim(),
        manufacturingDate: formData.manufacturingDate,
        expiryDate: formData.expiryDate,
        receivedDate: formData.receivedDate,
        quantity: Number(formData.quantity),
      };

      if (editBatch) {
        await batchService.update(editBatch.id, payload);
        toast.success("Batch updated successfully.");
      } else {
        await batchService.create(payload);
        toast.success("Batch added successfully.");
      }
      setModalOpen(false);
      load();
    } catch (err) {
      toast.error(err.message || "Unable to save batch.");
    } finally {
      setSaving(false);
    }
  }

  // Calculate days remaining preview
  const previewDays = formData.expiryDate ? daysUntilExpiry(formData.expiryDate) : null;
  const previewStatus = previewDays !== null ? getExpiryStatus(previewDays) : null;

  // Table columns
  const columns = [
    {
      key: "batchNumber",
      header: "Batch Number",
      render: (b) => <span className="font-mono text-xs font-semibold text-slate-800">{b.batchNumber}</span>,
    },
    {
      key: "product",
      header: "Product / Brand",
      render: (b) => (
        <span className="font-medium text-slate-800">
          {b.medicine?.brandName || b.medicine?.name || "—"}
        </span>
      ),
    },
    {
      key: "genericMedicine",
      header: "Generic Medicine",
      render: (b) => (
        <span className="text-slate-600">
          {b.medicine?.genericMedicine || b.medicine?.genericName || "—"}
        </span>
      ),
    },
    {
      key: "manufacturer",
      header: "Manufacturer",
      render: (b) => (
        <span className="text-slate-600">
          {b.medicine?.manufacturer || "—"}
        </span>
      ),
    },
    {
      key: "supplier",
      header: "Supplier",
      render: (b) => <span className="text-slate-600">{b.supplier}</span>,
    },
    {
      key: "manufacturingDate",
      header: "Manufacturing Date",
      render: (b) => formatDate(b.manufacturingDate),
    },
    {
      key: "expiryDate",
      header: "Expiry Date",
      render: (b) => formatDate(b.expiryDate),
    },
    {
      key: "receivedDate",
      header: "Received Date",
      render: (b) => formatDate(b.receivedDate),
    },
    {
      key: "quantity",
      header: "Quantity",
      render: (b) => <span className="font-semibold text-slate-800">{b.quantity}</span>,
    },
    {
      key: "expiryStatus",
      header: "Status",
      render: (b) => <StatusBadge status={b.expiryStatus} type="expiry" />,
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (b) => <TableActions onEdit={() => openEdit(b)} />,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Batch Management"
        subtitle="Track and manage medicine batches with expiry dates"
        actions={
          <Button onClick={openAdd}>
            <Plus className="w-4 h-4" /> Add Batch
          </Button>
        }
      />

      <Card className="mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search by batch, product, generic, manufacturer, or supplier..."
          />
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
        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <ErrorState onRetry={load} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No batches found"
            message="Try adjusting your filters or add a new batch."
          />
        ) : (
          <DataTable columns={columns} data={filtered} />
        )}
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editBatch ? "Edit Batch" : "Add New Batch"}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 1. Generic Medicine * */}
            <Select
              label="Generic Medicine *"
              value={formData.genericMedicine}
              onChange={(e) => {
                const gen = e.target.value;
                setFormData((prev) => ({
                  ...prev,
                  genericMedicine: gen,
                  productId: "", // Reset Product / Brand selection
                }));
                setFormErrors((prev) => ({
                  ...prev,
                  genericMedicine: undefined,
                  productId: undefined,
                }));
              }}
              error={formErrors.genericMedicine}
            >
              <option value="">Select Generic Medicine</option>
              {genericOptions.map((gen) => (
                <option key={gen} value={gen}>
                  {gen}
                </option>
              ))}
            </Select>

            {/* 2. Product / Brand * (Filtered based on Generic Medicine) */}
            <Select
              label="Product / Brand *"
              value={formData.productId}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, productId: e.target.value }));
                setFormErrors((prev) => ({ ...prev, productId: undefined }));
              }}
              error={formErrors.productId}
              disabled={!formData.genericMedicine}
            >
              {!formData.genericMedicine ? (
                <option value="">Select Generic Medicine first</option>
              ) : (
                <>
                  <option value="">Select Product / Brand</option>
                  {availableProducts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.brandName || p.name}
                    </option>
                  ))}
                </>
              )}
            </Select>

            {/* 3. Batch Number * */}
            <Input
              label="Batch Number *"
              value={formData.batchNumber}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, batchNumber: e.target.value }));
                setFormErrors((prev) => ({ ...prev, batchNumber: undefined }));
              }}
              error={formErrors.batchNumber}
              placeholder="e.g. PCM2026A"
            />

            {/* 4. Supplier * */}
            <Input
              label="Supplier *"
              value={formData.supplier}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, supplier: e.target.value }));
                setFormErrors((prev) => ({ ...prev, supplier: undefined }));
              }}
              error={formErrors.supplier}
              placeholder="e.g. MediSupply Co"
            />

            {/* 5. Manufacturing Date * */}
            <Input
              type="date"
              label="Manufacturing Date *"
              value={formData.manufacturingDate}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, manufacturingDate: e.target.value }));
                setFormErrors((prev) => ({ ...prev, manufacturingDate: undefined }));
              }}
              error={formErrors.manufacturingDate}
            />

            {/* 6. Expiry Date * */}
            <Input
              type="date"
              label="Expiry Date *"
              value={formData.expiryDate}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, expiryDate: e.target.value }));
                setFormErrors((prev) => ({ ...prev, expiryDate: undefined }));
              }}
              error={formErrors.expiryDate}
            />

            {/* 7. Received Date * */}
            <Input
              type="date"
              label="Received Date *"
              value={formData.receivedDate}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, receivedDate: e.target.value }));
                setFormErrors((prev) => ({ ...prev, receivedDate: undefined }));
              }}
              error={formErrors.receivedDate}
            />

            {/* 8. Quantity * */}
            <Input
              type="number"
              label="Quantity *"
              value={formData.quantity}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, quantity: e.target.value }));
                setFormErrors((prev) => ({ ...prev, quantity: undefined }));
              }}
              error={formErrors.quantity}
              placeholder="e.g. 500"
              min="1"
            />
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
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              {editBatch ? "Update Batch" : "Add Batch"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
