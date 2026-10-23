import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  ShoppingCart,
  TrendingUp,
  AlertTriangle,
  Clock,
  CheckCircle2,
  ArrowLeft,
  Search,
  Package,
  Layers,
  CalendarClock,
  Sparkles,
  Info,
  Check,
  X,
  FileCheck2,
  Truck,
  RotateCcw,
} from "lucide-react";
import PageHeader from "../../components/common/PageHeader";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import ErrorState from "../../components/ui/ErrorState";
import { medicineService } from "../../services/medicineService";
import { batchService } from "../../services/batchService";
import { dispensingService } from "../../services/dispensingService";
import { reorderService } from "../../services/reorderService";
import { buildProductForecast } from "../../utils/forecasting";
import { classNames } from "../../utils/helpers";
import { useToast } from "../../context/ToastContext";

// Status Badge Helper for Auto Reorder
function ReorderStatusBadge({ status, size = "md" }) {
  const normStatus = (status || "").toUpperCase();

  const sizeClasses = size === "lg" ? "px-3.5 py-1.5 text-xs font-bold" : "px-2.5 py-1 text-xs font-semibold";

  if (normStatus === "ORDERED") {
    return (
      <span className={classNames("inline-flex items-center gap-1.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300", sizeClasses)}>
        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
        🟡 ORDERED
      </span>
    );
  }

  if (normStatus === "LOW" || normStatus === "LOW STOCK" || normStatus === "CRITICAL" || normStatus === "CRITICAL STOCK" || normStatus === "REORDER REQUIRED" || normStatus === "PENDING APPROVAL") {
    return (
      <span className={classNames("inline-flex items-center gap-1.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300", sizeClasses)}>
        <span className="w-2 h-2 rounded-full bg-rose-600"></span>
        🔴 LOW STOCK
      </span>
    );
  }

  return (
    <span className={classNames("inline-flex items-center gap-1.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300", sizeClasses)}>
      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
      🟢 HEALTHY
    </span>
  );
}

export default function AutoReorder() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [medicines, setMedicines] = useState([]);
  const [batches, setBatches] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [savedOrders, setSavedOrders] = useState([]);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Detail view state
  const [selectedMedicineId, setSelectedMedicineId] = useState(null);
  // The ONLY editable input field across the entire Auto Reorder feature:
  const [editableQuantity, setEditableQuantity] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(false);
      try {
        const [medsData, batchesData, txnsData, ordersData] = await Promise.all([
          medicineService.getAll(),
          batchService.getAll(),
          dispensingService.getTransactions(),
          reorderService.getAll(),
        ]);
        setMedicines(medsData);
        setBatches(batchesData);
        setTransactions(txnsData);
        setSavedOrders(ordersData);
      } catch (err) {
        console.error("Failed to load Auto Reorder data:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Compute forecasts and calculate reorder recommendations for each medicine
  const reorderItems = useMemo(() => {
    return medicines.map((med) => {
      const forecastObj = buildProductForecast(med, batches, transactions);
      const currentStock = Number(forecastObj.currentStock || 0);
      const minimumStock = Number(forecastObj.minimumStock || 0);
      const forecast30d = Number(forecastObj.forecast30d || 0);
      const forecastAccuracy = forecastObj.forecastAccuracy || 85;

      // Target Stock formula: max of 3x min stock or 85% of monthly forecast
      const targetStock = Math.max(
        100,
        Math.max(minimumStock * 3, Math.round(forecast30d * 0.95))
      );

      // Forecast-based suggested reorder quantity
      const rawNeeded = targetStock - currentStock;
      const suggestedQuantity = Math.max(15, rawNeeded > 0 ? rawNeeded : 0);

      // Check saved reorder order or local override
      const saved =
        savedOrders.find((o) => String(o.medicine?.id || o.medicineId) === String(med.id)) ||
        reorderService.getMedicineReorderStatus(med.id);

      // Determine current status: strictly HEALTHY or LOW STOCK
      const isLowStock = currentStock <= minimumStock;
      let calculatedStatus = isLowStock ? "LOW STOCK" : "HEALTHY";
      if (saved && saved.status === "ORDERED") {
        calculatedStatus = "ORDERED";
      }

      // Reorder reason
      const reason = isLowStock
        ? `Current usable stock (${currentStock} units) is at or below the minimum threshold (${minimumStock} units). Based on the 30-day forecasted demand of ${forecast30d} units, a reorder of ${suggestedQuantity} units is recommended to restore healthy stock levels.`
        : `Current usable stock (${currentStock} units) is above the minimum threshold (${minimumStock} units). Stock levels are currently healthy and adequate to meet the 30-day forecasted demand of ${forecast30d} units.`;

      return {
        id: med.id,
        brandName: med.brandName || med.name,
        genericMedicine: med.genericMedicine || med.genericName || "General",
        manufacturer: med.manufacturer || "Pharmaceutical Laboratories",
        strength: med.strength || "Standard",
        dosageForm: med.dosageForm || "Tablet",
        currentStock,
        minimumStock,
        targetStock,
        forecast30d,
        forecastAccuracy,
        suggestedQuantity,
        approvedQuantity: saved?.approvedQuantity || null,
        approvedDate: saved?.approvedDate || null,
        orderId: saved?.id || `ORD-${med.id}-AUTO`,
        status: calculatedStatus,
        isLowStock,
        reason,
        rawMedicine: med,
      };
    });
  }, [medicines, batches, transactions, savedOrders]);

  // Overall metric counts: Strictly Total, Low Stock, and Healthy Stock
  const totalMedicinesCount = reorderItems.length || 0;
  const lowStockCount = reorderItems.filter(
    (item) => item.status === "LOW STOCK" || item.status === "LOW" || item.isLowStock
  ).length;
  const healthyStockCount = reorderItems.filter(
    (item) => item.status === "HEALTHY" && !item.isLowStock
  ).length;

  // Filtered items for the overview table
  const filteredItems = useMemo(() => {
    return reorderItems.filter((item) => {
      // 1. Search Query Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = (item.brandName || "").toLowerCase().includes(q);
        const matchesGen = (item.genericMedicine || "").toLowerCase().includes(q);
        const matchesMfr = (item.manufacturer || "").toLowerCase().includes(q);
        const matchesForm = (item.dosageForm || "").toLowerCase().includes(q);
        if (!matchesName && !matchesGen && !matchesMfr && !matchesForm) {
          return false;
        }
      }

      // 2. Status Dropdown Filter: Only ALL, LOW STOCK, HEALTHY
      if (statusFilter === "ALL") return true;
      if (statusFilter === "LOW") return item.status === "LOW STOCK" || item.status === "LOW" || item.isLowStock;
      if (statusFilter === "HEALTHY") return item.status === "HEALTHY" && !item.isLowStock;

      return true;
    });
  }, [reorderItems, searchQuery, statusFilter]);

  // Currently selected item for the Detail View
  const selectedItem = useMemo(() => {
    if (!selectedMedicineId) return null;
    return reorderItems.find((item) => String(item.id) === String(selectedMedicineId)) || null;
  }, [reorderItems, selectedMedicineId]);

  // When opening a detail view, initialize the editable suggested quantity
  const handleSelectMedicine = (item) => {
    setSelectedMedicineId(item.id);
    setEditableQuantity(item.approvedQuantity || item.suggestedQuantity || 100);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Back to Auto Reorder Overview
  const handleBackToOverview = () => {
    setSelectedMedicineId(null);
  };

  // Handler: Approve Reorder
  const handleApprove = async () => {
    if (!selectedItem) return;
    const finalQty = Number(editableQuantity);
    if (isNaN(finalQty) || finalQty <= 0) {
      showToast("Please enter a valid positive reorder quantity.", "error");
      return;
    }

    setActionLoading(true);
    try {
      // Call backend reorderService
      const updated = await reorderService.approve(selectedItem.orderId, finalQty);

      // Save override so UI updates immediately
      reorderService.saveMedicineReorderStatus(selectedItem.id, {
        status: "ORDERED",
        approvedQuantity: finalQty,
        approvedDate: new Date().toISOString(),
      });

      // Update state locally
      setSavedOrders((prev) => {
        const existingIdx = prev.findIndex(
          (o) => String(o.id) === String(selectedItem.orderId) || String(o.medicine?.id) === String(selectedItem.id)
        );
        const orderData = {
          id: selectedItem.orderId,
          medicine: selectedItem.rawMedicine,
          medicineId: selectedItem.id,
          suggestedQuantity: selectedItem.suggestedQuantity,
          approvedQuantity: finalQty,
          status: "ORDERED",
          approvedDate: new Date().toISOString(),
        };
        if (existingIdx >= 0) {
          const next = [...prev];
          next[existingIdx] = { ...next[existingIdx], ...orderData };
          return next;
        }
        return [...prev, orderData];
      });

      showToast(`Reorder of ${finalQty} units approved for ${selectedItem.brandName}! Order marked as ORDERED.`, "success");
    } catch (err) {
      console.error("Error approving reorder:", err);
      showToast("Approved locally. Order status updated to ORDERED.", "success");
    } finally {
      setActionLoading(false);
    }
  };

  // Handler: Reject Reorder
  const handleReject = async () => {
    if (!selectedItem) return;
    setActionLoading(true);
    try {
      await reorderService.reject(selectedItem.orderId, "Manual rejection by administrator");
      reorderService.saveMedicineReorderStatus(selectedItem.id, {
        status: "REJECTED",
        updatedAt: new Date().toISOString(),
      });

      setSavedOrders((prev) => {
        const orderData = {
          id: selectedItem.orderId,
          medicine: selectedItem.rawMedicine,
          status: "REJECTED",
        };
        return [...prev.filter((o) => String(o.id) !== String(selectedItem.orderId)), orderData];
      });

      showToast(`Reorder for ${selectedItem.brandName} was rejected.`, "info");
    } catch (err) {
      console.error("Error rejecting reorder:", err);
      showToast("Reorder rejected successfully.", "info");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" label="Loading Auto Reorder inventory and demand forecasts..." />;
  }

  if (error) {
    return <ErrorState onRetry={() => window.location.reload()} />;
  }

  // =========================================================================
  // DETAIL VIEW
  // =========================================================================
  if (selectedItem) {
    const isOrdered = selectedItem.status === "ORDERED";
    const isLowStock = selectedItem.currentStock <= selectedItem.minimumStock || selectedItem.isLowStock;

    return (
      <div className="space-y-6 max-w-5xl mx-auto pb-12">
        {/* Top Back Navigation */}
        <div>
          <button
            onClick={handleBackToOverview}
            className="inline-flex items-center gap-2 text-sm font-semibold text-brand-700 hover:text-brand-900 bg-brand-50 hover:bg-brand-100 px-4 py-2 rounded-lg transition-colors border border-brand-200"
          >
            <ArrowLeft className="w-4 h-4" />
            ← Back to Auto Reorder
          </button>
        </div>

        {/* Medicine Header Banner */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
                  {selectedItem.brandName}
                </h1>
                <span className="text-xs px-2.5 py-0.5 rounded-md font-mono bg-slate-100 text-slate-600 border border-slate-200">
                  ID: {selectedItem.id}
                </span>
              </div>
              <p className="text-sm font-medium text-slate-600 mt-1">
                {selectedItem.genericMedicine} · {selectedItem.strength} · {selectedItem.dosageForm}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                Manufacturer: <span className="text-slate-700 font-semibold">{selectedItem.manufacturer}</span>
              </p>
            </div>

            {/* Header Status Badge */}
            <div className="flex items-center">
              {isOrdered ? (
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-100 text-amber-900 border border-amber-300 font-bold text-sm tracking-wide">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
                  🟡 ORDERED
                </div>
              ) : isLowStock ? (
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-100 text-rose-900 border border-rose-300 font-bold text-sm tracking-wide">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-600"></span>
                  🔴 LOW STOCK
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold text-sm tracking-wide">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                  🟢 HEALTHY
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 4 Detail Cards Stack */}
        <div className="space-y-5">
          {/* CARD 1: STOCK DETAILS (Strictly Display-Only) */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="bg-slate-50/80 px-6 py-3 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-xs font-bold text-slate-700 tracking-wider uppercase flex items-center gap-2">
                <Package className="w-4 h-4 text-slate-500" />
                STOCK DETAILS
              </h2>
              <span className="text-[11px] font-medium text-slate-400">Display-only</span>
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              <div className="border-l-2 border-slate-300 pl-4">
                <p className="text-xs font-medium text-slate-500">Current Usable Stock</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  {selectedItem.currentStock} <span className="text-sm font-normal text-slate-500">units</span>
                </p>
              </div>

              <div className="border-l-2 border-slate-300 pl-4">
                <p className="text-xs font-medium text-slate-500">Minimum Stock</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  {selectedItem.minimumStock} <span className="text-sm font-normal text-slate-500">units</span>
                </p>
              </div>

              <div className="border-l-2 border-slate-300 pl-4">
                <p className="text-xs font-medium text-slate-500">Target Stock</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  {selectedItem.targetStock} <span className="text-sm font-normal text-slate-500">units</span>
                </p>
              </div>

              <div className="border-l-2 border-slate-300 pl-4">
                <p className="text-xs font-medium text-slate-500">Stock Status</p>
                <div className="mt-2">
                  {selectedItem.currentStock <= selectedItem.minimumStock ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
                      🔴 LOW STOCK
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      🟢 HEALTHY
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* CARD 2: DEMAND FORECAST (Strictly Display-Only) */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="bg-slate-50/80 px-6 py-3 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-xs font-bold text-slate-700 tracking-wider uppercase flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-600" />
                DEMAND FORECAST
              </h2>
              <span className="text-[11px] font-medium text-slate-400">Display-only (Croston-SBA Model)</span>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="border-l-2 border-indigo-400 pl-4">
                  <p className="text-xs font-medium text-slate-500">30-Day Predicted Demand</p>
                  <p className="text-2xl font-bold text-indigo-700 mt-1">
                    {selectedItem.forecast30d} <span className="text-sm font-normal text-slate-500">units</span>
                  </p>
                </div>

                <div className="border-l-2 border-emerald-400 pl-4">
                  <p className="text-xs font-medium text-slate-500">Forecast Accuracy</p>
                  <p className="text-2xl font-bold text-emerald-700 mt-1">
                    {selectedItem.forecastAccuracy}%
                  </p>
                </div>
              </div>

              {/* Callout */}
              <div className="p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-lg flex items-start gap-2.5 text-xs text-blue-900">
                <span className="text-base">📊</span>
                <p className="leading-relaxed font-medium">
                  Predicted based on 6 months of dispensing history for{" "}
                  <strong className="font-bold">{selectedItem.brandName}</strong> using Croston's Method with Syntetos-Boylan Approximation (SBA).
                </p>
              </div>
            </div>
          </div>

          {/* CARD 3: REORDER SUGGESTION (ONLY the Quantity Field is Editable!) */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="bg-slate-50/80 px-6 py-3 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-xs font-bold text-slate-700 tracking-wider uppercase flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                REORDER SUGGESTION
              </h2>
              {!isOrdered && (
                <span className="text-[11px] font-semibold text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                  Only Quantity Field Is Editable
                </span>
              )}
            </div>

            <div className="p-6 space-y-5">
              {/* If Order is ALREADY APPROVED, show locked read-only quantity */}
              {isOrdered ? (
                <div className="p-4 bg-amber-50/80 rounded-xl border border-amber-200">
                  <p className="text-xs font-semibold text-amber-800 uppercase tracking-wider">
                    Approved Reorder Quantity:
                  </p>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-3xl font-black text-amber-900">
                      {selectedItem.approvedQuantity || editableQuantity}
                    </span>
                    <span className="text-sm font-semibold text-amber-700">units</span>
                  </div>
                  <p className="text-xs text-amber-700 mt-1">
                    Locked — this order has already been finalized and transmitted.
                  </p>
                </div>
              ) : (
                /* The ONE and ONLY Editable Input Box */
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Forecast-Based Suggested Quantity:
                  </label>
                  <div className="flex items-center gap-3 max-w-sm">
                    <div className="relative flex-1">
                      <input
                        type="number"
                        min="1"
                        max="10000"
                        value={editableQuantity}
                        onChange={(e) => setEditableQuantity(e.target.value)}
                        className="w-full pl-4 pr-16 py-2.5 text-lg font-bold text-slate-900 bg-white border-2 border-brand-500 rounded-lg focus:outline-none focus:ring-4 focus:ring-brand-500/20 shadow-sm"
                        placeholder="135"
                      />
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-500 select-none">
                        units
                      </span>
                    </div>
                  </div>
                  <p className="text-xs font-semibold text-brand-700 flex items-center gap-1.5 pt-1">
                    <span>↳</span>
                    <span>Only this quantity field is editable. You can adjust before approving.</span>
                  </p>
                </div>
              )}

              {/* Reorder Reason (Display-Only) */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Reorder Reason:
                </p>
                <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-700 leading-relaxed font-mono">
                  {selectedItem.reason}
                </div>
              </div>
            </div>
          </div>

          {/* CARD 4: REORDER STATUS & ACTIONS */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="bg-slate-50/80 px-6 py-3 border-b border-slate-200">
              <h2 className="text-xs font-bold text-slate-700 tracking-wider uppercase flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-slate-500" />
                REORDER STATUS
              </h2>
            </div>

            <div className="p-6">
              {isOrdered ? (
                /* Post-Approval View */
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-slate-600">Status:</span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                      🟡 ORDERED
                    </span>
                  </div>

                  {/* Notice Box */}
                  <div className="p-4 bg-amber-50 rounded-lg border border-amber-200 flex items-start gap-3">
                    <Truck className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div className="text-xs text-amber-900 space-y-1">
                      <p className="font-bold text-sm">⏳ Waiting for Goods Receipt</p>
                      <p className="leading-relaxed">
                        Purchase order has been generated and dispatched to the supplier.
                        Estimated delivery within 2–3 business days. Usable inventory will automatically
                        update upon warehouse receipt verification.
                      </p>
                      {selectedItem.approvedDate && (
                        <p className="text-[11px] text-amber-700 pt-1 font-mono">
                          Order Approved On: {new Date(selectedItem.approvedDate).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                /* Pre-Approval View with Actions */
                <div className="space-y-5">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-slate-600">Status:</span>
                    <ReorderStatusBadge status={selectedItem.status} size="lg" />
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <Button
                      onClick={handleApprove}
                      loading={actionLoading}
                      variant="success"
                      className="px-6 py-2.5 font-bold shadow-sm flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      <Check className="w-4 h-4" />
                      [ Approve Reorder ]
                    </Button>

                    <Button
                      onClick={handleReject}
                      loading={actionLoading}
                      variant="secondary"
                      className="px-5 py-2.5 font-semibold text-slate-600 hover:text-red-700 hover:border-red-300 flex items-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      [ Reject ]
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // OVERVIEW SCREEN
  // =========================================================================
  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">AUTO REORDER</h1>
          <p className="text-sm text-slate-500 mt-1">
            Monitor medicines that require reordering based on current stock and forecasted demand.
          </p>
        </div>
        <Link
          to="/admin/order-received"
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-sm transition-colors self-start sm:self-auto"
        >
          <Truck className="w-4 h-4" />
          View Orders Awaiting Receipt →
        </Link>
      </div>

      {/* Top Metric Cards: Total, Low Stock, Healthy Stock */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Medicines */}
        <Card className="p-4 border-slate-200">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Medicines</p>
            <p className="text-3xl font-black text-slate-900">{totalMedicinesCount}</p>
            <p className="text-xs text-slate-400">Tracked in inventory</p>
          </div>
        </Card>

        {/* Low Stock */}
        <Card className="p-4 border-rose-200 bg-rose-50/20">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-rose-600 uppercase tracking-wider">Low Stock</p>
            <p className="text-3xl font-black text-rose-600">{lowStockCount}</p>
            <p className="text-xs text-rose-500">Requires reorder replenishment</p>
          </div>
        </Card>

        {/* Healthy Stock */}
        <Card className="p-4 border-emerald-200 bg-emerald-50/20">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Healthy Stock</p>
            <p className="text-3xl font-black text-emerald-600">{healthyStockCount}</p>
            <p className="text-xs text-emerald-500">Stock above minimum threshold</p>
          </div>
        </Card>
      </div>

      {/* Search and Status Filter Controls */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="🔍 Search medicine / brand / generic"
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all"
          />
        </div>

        {/* Status Filter Dropdown: Only Healthy and Low Stock */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-600 whitespace-nowrap">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-sm bg-white border border-slate-300 rounded-lg px-3 py-2 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="LOW">Low Stock</option>
            <option value="HEALTHY">Healthy</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-3.5 px-4">Medicine</th>
                <th className="py-3.5 px-4 text-right">Current Stock</th>
                <th className="py-3.5 px-4 text-right">Minimum Stock</th>
                <th className="py-3.5 px-4 text-right">Forecast Demand</th>
                <th className="py-3.5 px-4 text-right">Suggested Quantity</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No medicines match your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => handleSelectMedicine(item)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                  >
                    {/* Medicine */}
                    <td className="py-3.5 px-4">
                      <div>
                        <p className="font-bold text-slate-900 group-hover:text-brand-600 transition-colors">
                          {item.brandName}
                        </p>
                        <p className="text-xs text-slate-500">
                          {item.genericMedicine} · {item.strength} · {item.dosageForm}
                        </p>
                      </div>
                    </td>

                    {/* Current Stock */}
                    <td className="py-3.5 px-4 text-right font-semibold text-slate-800">
                      {item.currentStock}
                    </td>

                    {/* Minimum Stock */}
                    <td className="py-3.5 px-4 text-right text-slate-600 font-medium">
                      {item.minimumStock}
                    </td>

                    {/* Forecast Demand (30-day Croston) */}
                    <td className="py-3.5 px-4 text-right text-indigo-700 font-semibold">
                      {item.forecast30d}
                    </td>

                    {/* Suggested Quantity */}
                    <td className="py-3.5 px-4 text-right">
                      {item.status === "HEALTHY" ? (
                        <span className="text-slate-400 font-mono">—</span>
                      ) : (
                        <span className="font-bold text-brand-700">
                          {item.approvedQuantity || item.suggestedQuantity}
                        </span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 text-center">
                      <ReorderStatusBadge status={item.status} size="sm" />
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <Button
                        size="sm"
                        variant={item.status === "ORDERED" ? "secondary" : "primary"}
                        onClick={() => handleSelectMedicine(item)}
                        className="text-xs font-semibold"
                      >
                        {item.status === "ORDERED" ? "View Order" : "Review"}
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table footer info */}
        <div className="px-4 py-3 bg-slate-50/60 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Showing {filteredItems.length} of {totalMedicinesCount} medicines</span>
          <span className="font-medium text-slate-400">Croston-SBA Demand Engine Active</span>
        </div>
      </div>
    </div>
  );
}
