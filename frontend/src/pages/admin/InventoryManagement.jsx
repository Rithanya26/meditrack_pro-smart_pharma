import { useState, useEffect, useMemo } from "react";
import { Plus, Minus, Boxes, Save } from "lucide-react";
import PageHeader from "../../components/common/PageHeader";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import SearchInput from "../../components/ui/SearchInput";
import { Select, Input } from "../../components/ui/Input";
import DataTable from "../../components/ui/DataTable";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { TableActions } from "../../components/ui/TableActions";
import StatCard from "../../components/common/StatCard";
import EmptyState from "../../components/ui/EmptyState";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import ErrorState from "../../components/ui/ErrorState";
import { inventoryService } from "../../services/inventoryService";
import { useToast } from "../../context/ToastContext";
import { useAuth } from "../../context/AuthContext";
import { STOCK_STATUS, EXPIRY_STATUS, formatDate, formatNumber } from "../../utils/helpers";
import { mockAuditLogs } from "../../data/mockData";

export default function InventoryManagement() {
  const toast = useToast();
  const { user } = useAuth();
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [stockFilter, setStockFilter] = useState("");
  const [expiryFilter, setExpiryFilter] = useState("");
  const [adjustModal, setAdjustModal] = useState(false);
  const [adjustBatch, setAdjustBatch] = useState(null);
  const [adjustType, setAdjustType] = useState("add");
  const [adjustQty, setAdjustQty] = useState("");
  const [adjustReason, setAdjustReason] = useState("");
  const [adjustError, setAdjustError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    setError(false);
    try {
      const data = await inventoryService.getAll();
      setInventory(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    return inventory.filter((item) => {
      const q = search.toLowerCase();
      const matchSearch = !q || item.medicine?.name?.toLowerCase().includes(q) || item.batchNumber.toLowerCase().includes(q);
      const matchCat = !categoryFilter || item.medicine?.category === categoryFilter;
      const matchStock = !stockFilter || item.stockStatus === stockFilter;
      const matchExpiry = !expiryFilter || item.expiryStatus === expiryFilter;
      return matchSearch && matchCat && matchStock && matchExpiry;
    });
  }, [inventory, search, categoryFilter, stockFilter, expiryFilter]);

  const summary = useMemo(() => {
    const total = inventory.reduce((s, i) => s + i.quantity, 0);
    const low = inventory.filter((i) => i.stockStatus === STOCK_STATUS.LOW).length;
    const out = inventory.filter((i) => i.stockStatus === STOCK_STATUS.OUT).length;
    const near = inventory.filter((i) => i.expiryStatus === EXPIRY_STATUS.NEAR_EXPIRY || i.expiryStatus === EXPIRY_STATUS.CRITICAL).length;
    return { total, low, out, near };
  }, [inventory]);

  function openAdjust(batch) {
    setAdjustBatch(batch);
    setAdjustType("add");
    setAdjustQty("");
    setAdjustReason("");
    setAdjustError("");
    setAdjustModal(true);
  }

  async function handleAdjust(e) {
    e.preventDefault();
    setAdjustError("");
    const qty = Number(adjustQty);
    if (!adjustQty || isNaN(qty) || qty <= 0) {
      setAdjustError("Quantity must be a positive number.");
      return;
    }
    if (adjustType === "remove" && qty > adjustBatch.quantity) {
      setAdjustError(`Cannot remove more than available stock (${adjustBatch.quantity} units).`);
      return;
    }
    setSaving(true);
    try {
      await inventoryService.adjust(adjustBatch.id, qty, adjustReason, adjustType);
      // Log to audit
      const newAudit = {
        id: `AUD-${String(mockAuditLogs.length + 1).padStart(3, "0")}`,
        timestamp: new Date().toISOString(),
        userId: user.id,
        userName: user.name,
        role: user.role,
        action: "INVENTORY_UPDATED",
        entity: "Inventory",
        entityId: adjustBatch.id,
        description: `Stock adjusted for ${adjustBatch.medicine?.name} batch ${adjustBatch.batchNumber}: ${adjustType === "add" ? "+" : "-"}${qty} units`,
      };
      mockAuditLogs.unshift(newAudit);
      toast.success("Inventory adjusted successfully.");
      setAdjustModal(false);
      load();
    } catch (err) {
      setAdjustError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const newQty = adjustBatch && adjustQty ? adjustType === "add" ? adjustBatch.quantity + Number(adjustQty) : adjustBatch.quantity - Number(adjustQty) : null;

  const columns = [
    { key: "medicine", header: "Medicine", render: (i) => <span className="font-medium text-slate-800">{i.medicine?.name}</span> },
    { key: "batchNumber", header: "Batch", render: (i) => <span className="font-mono text-xs text-slate-600">{i.batchNumber}</span> },
    { key: "quantity", header: "Available Qty", render: (i) => <span className="font-semibold text-slate-700">{i.quantity}</span> },
    { key: "minimumStock", header: "Min Stock", render: (i) => <span className="text-slate-600">{i.minimumStock}</span> },
    { key: "expiryDate", header: "Expiry Date", render: (i) => formatDate(i.expiryDate) },
    { key: "stockStatus", header: "Stock Status", render: (i) => <StatusBadge status={i.stockStatus} type="stock" /> },
    { key: "expiryStatus", header: "Expiry", render: (i) => <StatusBadge status={i.expiryStatus} type="expiry" /> },
    { key: "actions", header: "Actions", align: "right", render: (i) => (
      <TableActions onEdit={() => openAdjust(i)} />
    )},
  ];

  return (
    <div>
      <PageHeader title="Inventory Management" subtitle="Monitor and adjust stock levels across all batches" />

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={Boxes} label="Total Stock" value={formatNumber(summary.total)} color="blue" />
        <StatCard icon={Boxes} label="Low Stock" value={summary.low} color="yellow" />
        <StatCard icon={Boxes} label="Out of Stock" value={summary.out} color="red" />
        <StatCard icon={Boxes} label="Near Expiry" value={summary.near} color="orange" />
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <SearchInput value={search} onChange={setSearch} placeholder="Search medicine or batch..." />
          <Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="">All Categories</option>
            <option>Tablets</option><option>Capsules</option><option>Syrups</option>
            <option>Injections</option><option>Creams</option><option>Ointments</option>
          </Select>
          <Select value={stockFilter} onChange={(e) => setStockFilter(e.target.value)}>
            <option value="">All Stock Status</option>
            <option value={STOCK_STATUS.HEALTHY}>Healthy</option>
            <option value={STOCK_STATUS.LOW}>Low Stock</option>
            <option value={STOCK_STATUS.OUT}>Out of Stock</option>
          </Select>
          <Select value={expiryFilter} onChange={(e) => setExpiryFilter(e.target.value)}>
            <option value="">All Expiry Status</option>
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
         filtered.length === 0 ? <EmptyState icon={Boxes} title="No inventory found" message="Try adjusting your filters." /> :
         <DataTable columns={columns} data={filtered} />}
      </Card>

      {/* Stock adjustment modal */}
      <Modal open={adjustModal} onClose={() => setAdjustModal(false)} title="Stock Adjustment" size="sm">
        {adjustBatch && (
          <form onSubmit={handleAdjust} className="space-y-4">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <p className="text-sm font-medium text-slate-800">{adjustBatch.medicine?.name}</p>
              <p className="text-xs text-slate-500 mt-0.5">Batch: {adjustBatch.batchNumber}</p>
              <p className="text-xs text-slate-500">Current Quantity: <strong className="text-slate-700">{adjustBatch.quantity}</strong></p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setAdjustType("add")}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium border transition ${
                  adjustType === "add" ? "bg-success-50 border-success-300 text-success-700" : "border-slate-200 text-slate-500 hover:bg-slate-50"
                }`}
              >
                <Plus className="w-4 h-4" /> Add Stock
              </button>
              <button
                type="button"
                onClick={() => setAdjustType("remove")}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium border transition ${
                  adjustType === "remove" ? "bg-danger-50 border-danger-300 text-danger-700" : "border-slate-200 text-slate-500 hover:bg-slate-50"
                }`}
              >
                <Minus className="w-4 h-4" /> Remove Stock
              </button>
            </div>

            <Input
              type="number"
              label="Adjustment Quantity *"
              value={adjustQty}
              onChange={(e) => setAdjustQty(e.target.value)}
              placeholder="Enter quantity"
              min="1"
              error={adjustError}
            />

            <Input
              label="Reason"
              value={adjustReason}
              onChange={(e) => setAdjustReason(e.target.value)}
              placeholder="e.g. New stock received, damaged, etc."
            />

            {/* Preview */}
            {newQty !== null && !isNaN(newQty) && newQty >= 0 && (
              <div className="p-3 rounded-lg bg-brand-50 border border-brand-100">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Previous:</span>
                  <span className="font-semibold text-slate-700">{adjustBatch.quantity}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Adjustment:</span>
                  <span className={`font-semibold ${adjustType === "add" ? "text-success-600" : "text-danger-600"}`}>
                    {adjustType === "add" ? "+" : "-"}{adjustQty}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm pt-2 border-t border-brand-200 mt-2">
                  <span className="text-slate-700 font-medium">New Quantity:</span>
                  <span className="font-bold text-brand-700">{newQty}</span>
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-200">
              <Button type="button" variant="secondary" onClick={() => setAdjustModal(false)}>Cancel</Button>
              <Button type="submit" loading={saving} variant={adjustType === "add" ? "primary" : "danger"}>
                <Save className="w-4 h-4" /> Confirm Adjustment
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
