import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Pill } from "lucide-react";
import PageHeader from "../../components/common/PageHeader";
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
import { CATEGORIES, DOSAGE_FORMS } from "../../data/mockData";
import { useToast } from "../../context/ToastContext";

export default function MedicineManagement() {
  const navigate = useNavigate();
  const toast = useToast();
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [formFilter, setFormFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editMed, setEditMed] = useState(null);
  const [formData, setFormData] = useState({
    name: "", genericName: "", category: "", manufacturer: "",
    strength: "", dosageForm: "", description: "", status: "active",
  });
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadMedicines(); }, []);

  async function loadMedicines() {
    setLoading(true);
    setError(false);
    try {
      const data = await medicineService.getAll();
      setMedicines(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    return medicines.filter((m) => {
      const q = search.toLowerCase();
      const matchSearch = !q || m.name.toLowerCase().includes(q) || m.genericName.toLowerCase().includes(q) || m.manufacturer.toLowerCase().includes(q);
      const matchCat = !categoryFilter || m.category === categoryFilter;
      const matchForm = !formFilter || m.dosageForm === formFilter;
      const matchStatus = !statusFilter || m.status === statusFilter;
      return matchSearch && matchCat && matchForm && matchStatus;
    });
  }, [medicines, search, categoryFilter, formFilter, statusFilter]);

  function openAdd() {
    setEditMed(null);
    setFormData({ name: "", genericName: "", category: "", manufacturer: "", strength: "", dosageForm: "", description: "", status: "active" });
    setFormErrors({});
    setModalOpen(true);
  }

  function openEdit(med) {
    setEditMed(med);
    setFormData({ ...med });
    setFormErrors({});
    setModalOpen(true);
  }

  function validate() {
    const e = {};
    if (!formData.name.trim()) e.name = "Medicine name is required";
    else {
      const dup = medicines.find((m) => m.name.toLowerCase() === formData.name.toLowerCase() && m.id !== editMed?.id);
      if (dup) e.name = "A medicine with this name already exists";
    }
    if (!formData.genericName.trim()) e.genericName = "Generic name is required";
    if (!formData.category) e.category = "Category is required";
    if (!formData.manufacturer.trim()) e.manufacturer = "Manufacturer is required";
    if (!formData.strength.trim()) e.strength = "Strength is required";
    if (!formData.dosageForm) e.dosageForm = "Dosage form is required";
    setFormErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      if (editMed) {
        await medicineService.update(editMed.id, formData);
        toast.success("Medicine updated successfully.");
      } else {
        await medicineService.create(formData);
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
    { key: "name", header: "Medicine Name", render: (m) => (
      <button onClick={() => navigate(`/admin/medicines/${m.id}`)} className="font-medium text-slate-800 hover:text-brand-600 text-left">
        {m.name}
      </button>
    )},
    { key: "genericName", header: "Generic Name", render: (m) => <span className="text-slate-600">{m.genericName}</span> },
    { key: "category", header: "Category", render: (m) => <span className="text-slate-600">{m.category}</span> },
    { key: "strength", header: "Strength", render: (m) => <span className="text-slate-600">{m.strength}</span> },
    { key: "dosageForm", header: "Dosage Form", render: (m) => <span className="text-slate-600">{m.dosageForm}</span> },
    { key: "manufacturer", header: "Manufacturer", render: (m) => <span className="text-slate-600">{m.manufacturer}</span> },
    { key: "status", header: "Status", render: (m) => <StatusBadge status={m.status} type="active" /> },
    { key: "actions", header: "Actions", align: "right", render: (m) => (
      <TableActions
        onView={() => navigate(`/admin/medicines/${m.id}`)}
        onEdit={() => openEdit(m)}
        onToggle={() => handleToggle(m)}
        isActive={m.status === "active"}
      />
    )},
  ];

  return (
    <div>
      <PageHeader
        title="Medicine Management"
        subtitle="Manage all medicines in the pharmacy inventory"
        actions={<Button onClick={openAdd}><Plus className="w-4 h-4" /> Add Medicine</Button>}
      />

      {/* Filters */}
      <Card className="mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <SearchInput value={search} onChange={setSearch} placeholder="Search name, generic, manufacturer..." />
          <Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="">All Categories</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
          <Select value={formFilter} onChange={(e) => setFormFilter(e.target.value)}>
            <option value="">All Dosage Forms</option>
            {DOSAGE_FORMS.map((f) => <option key={f} value={f}>{f}</option>)}
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
        {loading ? <LoadingSpinner /> :
         error ? <ErrorState onRetry={loadMedicines} /> :
         filtered.length === 0 ? <EmptyState icon={Pill} title="No medicines found" message="Try adjusting your filters or add a new medicine." /> :
         <DataTable columns={columns} data={filtered} onRowClick={(m) => navigate(`/admin/medicines/${m.id}`)} />}
      </Card>

      {/* Add/Edit modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editMed ? "Edit Medicine" : "Add New Medicine"} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Medicine Name *" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} error={formErrors.name} placeholder="e.g. Paracetamol 500mg" />
            <Input label="Generic Name *" value={formData.genericName} onChange={(e) => setFormData({ ...formData, genericName: e.target.value })} error={formErrors.genericName} placeholder="e.g. Acetaminophen" />
            <Select label="Category *" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} error={formErrors.category}>
              <option value="">Select category</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </Select>
            <Input label="Manufacturer *" value={formData.manufacturer} onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })} error={formErrors.manufacturer} placeholder="e.g. MediCorp Ltd" />
            <Input label="Strength *" value={formData.strength} onChange={(e) => setFormData({ ...formData, strength: e.target.value })} error={formErrors.strength} placeholder="e.g. 500mg" />
            <Select label="Dosage Form *" value={formData.dosageForm} onChange={(e) => setFormData({ ...formData, dosageForm: e.target.value })} error={formErrors.dosageForm}>
              <option value="">Select form</option>
              {DOSAGE_FORMS.map((f) => <option key={f} value={f}>{f}</option>)}
            </Select>
          </div>
          <TextArea label="Description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Brief description of the medicine..." />
          <Select label="Status" value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </Select>
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-200">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>{editMed ? "Update Medicine" : "Add Medicine"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
