import { useState, useEffect, useMemo } from "react";
import { Plus, Users } from "lucide-react";
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
import { mockUsers } from "../../data/mockData";
import { useToast } from "../../context/ToastContext";
import { formatDate } from "../../utils/helpers";

export default function PharmacistManagement() {
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [viewUser, setViewUser] = useState(null);
  const [editUser, setEditUser] = useState(null);
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", password: "", confirmPassword: "", status: "active" });
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      setUsers(mockUsers.filter((u) => u.role === "pharmacist"));
      setLoading(false);
    }, 400);
  }, []);

  const filtered = useMemo(() => {
    return users.filter((u) => {
      const q = search.toLowerCase();
      const matchSearch = !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
      const matchStatus = !statusFilter || u.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [users, search, statusFilter]);

  function openAdd() {
    setEditUser(null);
    setFormData({ name: "", email: "", phone: "", password: "", confirmPassword: "", status: "active" });
    setFormErrors({});
    setModalOpen(true);
  }

  function openEdit(u) {
    setEditUser(u);
    setFormData({ name: u.name, email: u.email, phone: u.phone, password: "", confirmPassword: "", status: u.status });
    setFormErrors({});
    setModalOpen(true);
  }

  function validate() {
    const e = {};
    if (!formData.name.trim()) e.name = "Name is required";
    if (!formData.email.trim()) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) e.email = "Invalid email format";
    else {
      const dup = mockUsers.find((u) => u.email === formData.email && u.id !== editUser?.id);
      if (dup) e.email = "Email already in use";
    }
    if (!formData.phone.trim()) e.phone = "Phone is required";
    if (!editUser) {
      if (!formData.password) e.password = "Password is required";
      else if (formData.password.length < 6) e.password = "Password must be at least 6 characters";
      if (formData.password !== formData.confirmPassword) e.confirmPassword = "Passwords do not match";
    }
    setFormErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    setTimeout(() => {
      if (editUser) {
        const idx = mockUsers.findIndex((u) => u.id === editUser.id);
        mockUsers[idx] = { ...mockUsers[idx], name: formData.name, email: formData.email, phone: formData.phone, status: formData.status };
        toast.success("Pharmacist updated successfully.");
      } else {
        const newUser = {
          id: `USR-${String(mockUsers.length + 1).padStart(3, "0")}`,
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          role: "pharmacist",
          status: formData.status,
          createdAt: new Date().toISOString(),
          avatar: formData.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase(),
        };
        mockUsers.push(newUser);
        toast.success("Pharmacist added successfully.");
      }
      setUsers(mockUsers.filter((u) => u.role === "pharmacist"));
      setModalOpen(false);
      setSaving(false);
    }, 500);
  }

  function toggleStatus(u) {
    const idx = mockUsers.findIndex((x) => x.id === u.id);
    mockUsers[idx].status = mockUsers[idx].status === "active" ? "inactive" : "active";
    setUsers([...mockUsers.filter((x) => x.role === "pharmacist")]);
    toast.success(`Pharmacist ${mockUsers[idx].status === "active" ? "activated" : "deactivated"} successfully.`);
  }

  const columns = [
    { key: "name", header: "Name", render: (u) => (
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-semibold">{u.avatar}</div>
        <span className="font-medium text-slate-800">{u.name}</span>
      </div>
    )},
    { key: "email", header: "Email", render: (u) => <span className="text-slate-600">{u.email}</span> },
    { key: "phone", header: "Phone", render: (u) => <span className="text-slate-600">{u.phone}</span> },
    { key: "status", header: "Status", render: (u) => <StatusBadge status={u.status} type="active" /> },
    { key: "createdAt", header: "Created", render: (u) => formatDate(u.createdAt) },
    { key: "actions", header: "Actions", align: "right", render: (u) => (
      <TableActions
        onView={() => setViewUser(u)}
        onEdit={() => openEdit(u)}
        onToggle={() => toggleStatus(u)}
        isActive={u.status === "active"}
      />
    )},
  ];

  return (
    <div>
      <PageHeader title="Pharmacist Management" subtitle="Manage pharmacist accounts and access" actions={<Button onClick={openAdd}><Plus className="w-4 h-4" /> Add Pharmacist</Button>} />

      <Card className="mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by name or email..." />
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </Select>
        </div>
      </Card>

      <Card padding={false}>
        {loading ? <LoadingSpinner /> :
         filtered.length === 0 ? <EmptyState icon={Users} title="No pharmacists found" message="Add a pharmacist to get started." /> :
         <DataTable columns={columns} data={filtered} />}
      </Card>

      {/* View modal */}
      <Modal open={!!viewUser} onClose={() => setViewUser(null)} title="Pharmacist Details" size="sm">
        {viewUser && (
          <dl className="space-y-3">
            {[
              { label: "Name", value: viewUser.name },
              { label: "Email", value: viewUser.email },
              { label: "Phone", value: viewUser.phone },
              { label: "Role", value: <span className="capitalize">{viewUser.role}</span> },
              { label: "Status", value: <StatusBadge status={viewUser.status} type="active" /> },
              { label: "Created", value: formatDate(viewUser.createdAt) },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                <dt className="text-sm text-slate-500">{item.label}</dt>
                <dd className="text-sm font-medium text-slate-800">{item.value}</dd>
              </div>
            ))}
          </dl>
        )}
      </Modal>

      {/* Add/Edit modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editUser ? "Edit Pharmacist" : "Add New Pharmacist"} size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Full Name *" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} error={formErrors.name} placeholder="e.g. John Smith" />
          <Input label="Email *" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} error={formErrors.email} placeholder="e.g. john@meditrack.com" />
          <Input label="Phone *" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} error={formErrors.phone} placeholder="e.g. +1-555-0100" />
          {!editUser && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Password *" type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} error={formErrors.password} placeholder="Min 6 characters" />
              <Input label="Confirm Password *" type="password" value={formData.confirmPassword} onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })} error={formErrors.confirmPassword} placeholder="Re-enter password" />
            </div>
          )}
          <Select label="Status" value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </Select>
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-200">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>{editUser ? "Update Pharmacist" : "Add Pharmacist"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
