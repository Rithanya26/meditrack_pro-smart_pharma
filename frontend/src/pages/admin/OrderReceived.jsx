import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Truck,
  Package,
  PackageCheck,
  Clock,
  CheckCircle2,
  AlertCircle,
  Search,
  Layers,
  ArrowRight,
  Sparkles,
  Calendar,
  Building2,
  X,
  Boxes,
  ShoppingCart,
  RefreshCw,
  Info,
  Check,
} from "lucide-react";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import ErrorState from "../../components/ui/ErrorState";
import { reorderService } from "../../services/reorderService";
import { batchService } from "../../services/batchService";
import { medicineService } from "../../services/medicineService";
import { classNames, formatDate } from "../../utils/helpers";
import { useToast } from "../../context/ToastContext";

export default function OrderReceived() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [orders, setOrders] = useState([]);
  const [batches, setBatches] = useState([]);
  const [medicines, setMedicines] = useState([]);

  // Filters & Tabs
  const [activeTab, setActiveTab] = useState("AWAITING"); // "AWAITING" | "RECEIVED" | "ALL"
  const [searchQuery, setSearchQuery] = useState("");

  // Modal State
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [receiptForm, setReceiptForm] = useState({
    actualReceivedQuantity: "",
    batchNumber: "",
    manufacturingDate: "2026-10-01",
    expiryDate: "2028-10-01",
    supplier: "",
  });

  // Load all data
  const loadData = async () => {
    setLoading(true);
    setError(false);
    try {
      const [ordersData, batchesData, medsData] = await Promise.all([
        reorderService.getAll(),
        batchService.getAll(),
        medicineService.getAll(),
      ]);
      setOrders(ordersData);
      setBatches(batchesData);
      setMedicines(medsData);
    } catch (err) {
      console.error("Failed to load Order Received data:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute live current stock per medicine from active batches
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

  // Enriched orders with accurate current stock & medicine metadata
  const enrichedOrders = useMemo(() => {
    return orders.map((order) => {
      const medId = String(order.medicineId || order.medicine?.id);
      const matchedMed =
        medicines.find((m) => String(m.id) === medId) || order.medicine || {};

      const brandName =
        matchedMed.brandName || matchedMed.name || order.medicineName || "Medicine";
      const genericMedicine =
        matchedMed.genericMedicine || matchedMed.genericName || "General";
      const strength = matchedMed.strength || "Standard";
      const dosageForm = matchedMed.dosageForm || "Tablet";
      const supplier =
        order.supplier || matchedMed.manufacturer || "Pharmaceutical Supplier";

      const liveStock =
        medicineStockMap[medId] != null
          ? medicineStockMap[medId]
          : order.currentStock || 0;

      return {
        ...order,
        brandName,
        genericMedicine,
        strength,
        dosageForm,
        supplier,
        currentStock: liveStock,
        matchedMed,
      };
    });
  }, [orders, medicines, medicineStockMap]);

  // Metrics
  const awaitingOrders = useMemo(
    () => enrichedOrders.filter((o) => (o.status || "").toUpperCase() === "ORDERED"),
    [enrichedOrders]
  );

  const receivedOrders = useMemo(
    () => enrichedOrders.filter((o) => (o.status || "").toUpperCase() === "RECEIVED"),
    [enrichedOrders]
  );

  const awaitingCount = awaitingOrders.length;
  const receivedTodayCount = receivedOrders.length;
  // Batches created from goods receipt (at least equal to received orders count)
  const batchesCreatedCount = receivedOrders.length;

  // Filtered orders based on Tab and Search
  const filteredOrders = useMemo(() => {
    return enrichedOrders.filter((item) => {
      // 1. Tab filter
      const isReceived = (item.status || "").toUpperCase() === "RECEIVED";
      if (activeTab === "AWAITING" && isReceived) return false;
      if (activeTab === "RECEIVED" && !isReceived) return false;

      // 2. Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesBrand = (item.brandName || "").toLowerCase().includes(q);
        const matchesGen = (item.genericMedicine || "").toLowerCase().includes(q);
        const matchesId = (item.orderNumber || item.id || "")
          .toLowerCase()
          .includes(q);
        const matchesSupp = (item.supplier || "").toLowerCase().includes(q);
        if (!matchesBrand && !matchesGen && !matchesId && !matchesSupp) {
          return false;
        }
      }

      return true;
    });
  }, [enrichedOrders, activeTab, searchQuery]);

  // Open the Goods Received Modal for a selected order
  const handleOpenReceiptModal = (order) => {
    setSelectedOrder(order);

    const approvedQty = order.approvedQuantity || order.suggestedQuantity || 100;
    const cleanBrand = (order.brandName || "MED")
      .replace(/[^a-zA-Z]/g, "")
      .slice(0, 3)
      .toUpperCase();
    const suggestedBatch =
      order.suggestedBatchNumber ||
      order.batchNumber ||
      `${cleanBrand}2026C`;

    setReceiptForm({
      actualReceivedQuantity: String(approvedQty),
      batchNumber: suggestedBatch,
      manufacturingDate: order.mfgDate || "2026-10-01",
      expiryDate: order.expDate || "2028-10-01",
      supplier: order.supplier || "Standard Supply Logistics",
    });
  };

  // Close Modal
  const handleCloseModal = () => {
    setSelectedOrder(null);
    setSubmitting(false);
  };

  // Confirm Goods Receipt Submission
  const handleConfirmReceipt = async (e) => {
    e.preventDefault();
    if (submitting) return; // Immediate lock against rapid double-clicks
    if (!selectedOrder) return;

    if ((selectedOrder.status || "").toUpperCase() === "RECEIVED") {
      showToast("This order has already been marked as received.", "warning");
      handleCloseModal();
      return;
    }

    const actualQty = Number(receiptForm.actualReceivedQuantity);
    if (isNaN(actualQty) || actualQty <= 0) {
      showToast("Please enter a valid positive received quantity.", "error");
      return;
    }

    const enteredBatch = receiptForm.batchNumber.trim().toUpperCase();
    if (!enteredBatch) {
      showToast("Batch number is required.", "error");
      return;
    }

    if (!receiptForm.supplier.trim()) {
      showToast("Supplier name is required.", "error");
      return;
    }

    if (!receiptForm.manufacturingDate || !receiptForm.expiryDate) {
      showToast("Manufacturing date and expiry date are required.", "error");
      return;
    }

    if (new Date(receiptForm.expiryDate) <= new Date(receiptForm.manufacturingDate)) {
      showToast("Expiry date must be after manufacturing date.", "error");
      return;
    }

    // Check if batch number already exists in active batches list
    const isBatchDuplicate = (batches || []).some(
      (b) => (b.batchNumber || "").trim().toUpperCase() === enteredBatch
    );
    if (isBatchDuplicate) {
      showToast(
        `Batch ${enteredBatch} already exists in inventory. Please enter a unique batch number.`,
        "error"
      );
      return;
    }

    setSubmitting(true);
    try {
      const medId = selectedOrder.medicineId || selectedOrder.medicine?.id;

      // 1. Ensure Medicine Exists in Medicine module
      let medicineObj = selectedOrder.matchedMed;
      if (!medicineObj || !medicineObj.id) {
        try {
          medicineObj = await medicineService.create({
            brandName: selectedOrder.brandName,
            genericMedicine: selectedOrder.genericMedicine,
            strength: selectedOrder.strength,
            dosageForm: selectedOrder.dosageForm,
            minimumStock: 40,
            status: "active",
          });
        } catch {
          // Continue if already exists
        }
      }

      // 2. Automatically Create Batch in Medicine and Batch Module
      const createdBatch = await batchService.create({
        productId: medId,
        medicineId: medId,
        medicine: medicineObj || { id: medId },
        batchNumber: enteredBatch,
        manufacturingDate: receiptForm.manufacturingDate,
        expiryDate: receiptForm.expiryDate,
        supplier: receiptForm.supplier.trim(),
        receivedDate: new Date().toISOString().split("T")[0],
        quantity: actualQty, // Saves actual received quantity in that batch
      });

      // 3. Mark the Order as RECEIVED in Reorder Service
      const updatedOrder = await reorderService.receive(selectedOrder.id, {
        medicineId: medId,
        actualReceivedQuantity: actualQty,
        batchNumber: enteredBatch,
        supplier: receiptForm.supplier.trim(),
        status: "RECEIVED",
        receivedDate: new Date().toISOString(),
      });

      // 4. Update Local State immediately
      setOrders((prev) =>
        prev.map((ord) =>
          String(ord.id) === String(selectedOrder.id) ||
          (ord.medicineId && String(ord.medicineId) === String(medId))
            ? {
                ...ord,
                ...updatedOrder,
                status: "RECEIVED",
                actualReceivedQuantity: actualQty,
                batchNumber: enteredBatch,
              }
            : ord
        )
      );

      // Append new batch into local batches list without duplicating
      setBatches((prev) => {
        const withoutDup = (prev || []).filter(
          (b) => (b.batchNumber || "").trim().toUpperCase() !== enteredBatch
        );
        return [createdBatch, ...withoutDup];
      });

      showToast(
        `Goods received! Batch ${enteredBatch} with ${actualQty} units registered for ${selectedOrder.brandName}. Inventory updated automatically!`,
        "success"
      );

      handleCloseModal();
      // Re-sync all state in background to ensure database integrity
      loadData();
    } catch (err) {
      console.error("Error receiving goods:", err);
      showToast(err.message || "Failed to process goods receipt. Please try again.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <LoadingSpinner
        size="lg"
        label="Loading approved orders and inventory receipt queue..."
      />
    );
  }

  if (error) {
    return <ErrorState onRetry={loadData} />;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                ORDER RECEIVED
              </h1>
              <p className="text-sm text-slate-500">
                Receive approved medicine orders and automatically create in medicine and batches module, update inventory.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Action Navigation */}
        <div className="flex items-center gap-3">
          <Link
            to="/admin/reorder"
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-brand-700 bg-brand-50 hover:bg-brand-100 rounded-lg border border-brand-200 transition-colors shadow-sm"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            Auto Reorder Module
          </Link>

          <Link
            to="/admin/batches"
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 rounded-lg border border-slate-200 transition-colors shadow-sm"
          >
            <Layers className="w-3.5 h-3.5 text-slate-500" />
            Batch Management
          </Link>

          <button
            onClick={loadData}
            title="Refresh Orders"
            className="p-2 text-slate-500 hover:text-slate-800 bg-white hover:bg-slate-50 rounded-lg border border-slate-200 transition-colors shadow-sm"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Top 3 Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Awaiting Receipt */}
        <Card className="p-5 border-amber-200 bg-amber-50/30 relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold text-amber-700 uppercase tracking-wider">
                Awaiting Receipt
              </p>
              <p className="text-3xl font-black text-amber-900 tracking-tight">
                {awaitingCount}
              </p>
              <p className="text-xs text-amber-700/80 font-medium pt-0.5">
                Approved orders awaiting supplier delivery
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-600 shadow-sm">
              <Clock className="w-6 h-6 animate-pulse" />
            </div>
          </div>
        </Card>

        {/* Card 2: Received Today */}
        <Card className="p-5 border-emerald-200 bg-emerald-50/30 relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
                Received Today
              </p>
              <p className="text-3xl font-black text-emerald-900 tracking-tight">
                {receivedTodayCount}
              </p>
              <p className="text-xs text-emerald-700/80 font-medium pt-0.5">
                Shipments verified and accepted
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-sm">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>
        </Card>

        {/* Card 3: Batches Created */}
        <Card className="p-5 border-indigo-200 bg-indigo-50/30 relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold text-indigo-700 uppercase tracking-wider">
                Batches Created
              </p>
              <p className="text-3xl font-black text-indigo-900 tracking-tight">
                {batchesCreatedCount}
              </p>
              <p className="text-xs text-indigo-700/80 font-medium pt-0.5">
                Batches automatically integrated into stock
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-600 shadow-sm">
              <Layers className="w-6 h-6" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filter Tabs and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-lg">
          <button
            onClick={() => setActiveTab("AWAITING")}
            className={classNames(
              "px-3.5 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2",
              activeTab === "AWAITING"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
            )}
          >
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            <span>Awaiting Receipt</span>
            <span
              className={classNames(
                "px-2 py-0.5 rounded-full text-[11px] font-mono",
                activeTab === "AWAITING"
                  ? "bg-amber-100 text-amber-800"
                  : "bg-slate-200 text-slate-600"
              )}
            >
              {awaitingCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("RECEIVED")}
            className={classNames(
              "px-3.5 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2",
              activeTab === "RECEIVED"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
            )}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>Received Today</span>
            <span
              className={classNames(
                "px-2 py-0.5 rounded-full text-[11px] font-mono",
                activeTab === "RECEIVED"
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-slate-200 text-slate-600"
              )}
            >
              {receivedTodayCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("ALL")}
            className={classNames(
              "px-3.5 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2",
              activeTab === "ALL"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
            )}
          >
            <span>All Orders</span>
            <span
              className={classNames(
                "px-2 py-0.5 rounded-full text-[11px] font-mono",
                activeTab === "ALL"
                  ? "bg-slate-200 text-slate-900"
                  : "bg-slate-200/80 text-slate-600"
              )}
            >
              {enrichedOrders.length}
            </span>
          </button>
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search medicine, generic, order ID, supplier..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* Section Title */}
      <div>
        <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
          <span>Approved Orders</span>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-normal">
            {filteredOrders.length} {filteredOrders.length === 1 ? "order" : "orders"}
          </span>
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Review approved quantities retrieved from Auto Reorder and click "Goods Received" when inventory arrives.
        </p>
      </div>

      {/* Orders Grid */}
      {filteredOrders.length === 0 ? (
        <Card className="p-12 text-center border-dashed border-slate-300">
          <div className="w-12 h-12 rounded-full bg-slate-100 mx-auto flex items-center justify-center text-slate-400 mb-3">
            <Package className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-700">No orders found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {searchQuery
              ? "No approved orders match your search criteria. Try a different keyword."
              : activeTab === "AWAITING"
              ? "All approved orders have been received! Check the Received Today tab."
              : "No orders available in this view."}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredOrders.map((order) => {
            const isReceived =
              (order.status || "").toUpperCase() === "RECEIVED";
            const approvedQty =
              order.approvedQuantity || order.suggestedQuantity || 0;
            const currentStock = order.currentStock || 0;

            return (
              <div
                key={order.id}
                className={classNames(
                  "bg-white rounded-xl border transition-all duration-200 p-6 flex flex-col justify-between shadow-sm hover:shadow-md",
                  isReceived
                    ? "border-emerald-200 bg-emerald-50/10"
                    : "border-slate-200 hover:border-brand-300"
                )}
              >
                {/* Header Strip */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-xl font-black text-slate-900 tracking-tight">
                        {order.brandName}
                      </h3>
                      <p className="text-xs font-semibold text-slate-600 mt-0.5">
                        {order.genericMedicine} · {order.strength} · {order.dosageForm}
                      </p>
                    </div>

                    {/* Status Badge */}
                    {isReceived ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Received
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">
                        <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                        Awaiting Receipt
                      </span>
                    )}
                  </div>

                  {/* Order ID & Meta tags */}
                  <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 text-xs">
                    <span className="font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      Order ID: {order.orderNumber || order.id}
                    </span>
                    <span className="text-slate-400">·</span>
                    <span className="text-slate-600 flex items-center gap-1">
                      <Building2 className="w-3 h-3 text-slate-400" />
                      {order.supplier}
                    </span>
                  </div>
                </div>

                {/* 2 Prominent Metric Blocks */}
                <div className="grid grid-cols-2 gap-3 my-5">
                  {/* Block 1: Approved quantity */}
                  <div className="p-4 rounded-xl bg-brand-50/60 border border-brand-200/80 space-y-1">
                    <p className="text-xs font-bold text-brand-800 uppercase tracking-wider">
                      Approved quantity
                    </p>
                    <p className="text-2xl font-black text-brand-900 tracking-tight">
                      {approvedQty} <span className="text-xs font-semibold text-brand-700">units</span>
                    </p>
                    <p className="text-[11px] leading-tight text-brand-700/90 pt-1 font-medium">
                      The approved quantity is automatically taken from Auto Reorder. No need to enter it again.
                    </p>
                  </div>

                  {/* Block 2: Current stock */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1 flex flex-col justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                        Current stock
                      </p>
                      <p className="text-2xl font-black text-slate-900 tracking-tight">
                        {currentStock} <span className="text-xs font-semibold text-slate-500">units</span>
                      </p>
                    </div>
                    <p className="text-[11px] leading-tight text-slate-400 font-medium">
                      Current usable stock tracked in batches before receipt.
                    </p>
                  </div>
                </div>

                {/* Card Footer: Action or Receipt summary */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  {isReceived ? (
                    <div className="w-full flex items-center justify-between text-xs">
                      <div className="space-y-0.5">
                        <p className="font-bold text-emerald-800 flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          Batch Created: {order.batchNumber || "BAT-VERIFIED"}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Actual Received: <strong className="text-slate-800">{order.actualReceivedQuantity || approvedQty} units</strong>
                        </p>
                      </div>
                      <Link
                        to="/admin/batches"
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 border border-brand-200 transition-colors"
                      >
                        View in Batches →
                      </Link>
                    </div>
                  ) : (
                    <div className="w-full flex items-center justify-between gap-3">
                      <span className="text-xs text-slate-400 font-medium">
                        Supplier delivery pending
                      </span>
                      <Button
                        variant="primary"
                        onClick={() => handleOpenReceiptModal(order)}
                        className="px-5 py-2 font-bold shadow-sm flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white"
                      >
                        <Truck className="w-4 h-4" />
                        Goods Received
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* =========================================================================
          CONFIRM GOODS RECEIPT MODAL
          ========================================================================= */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-5 bg-slate-50 border-b border-slate-200 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-brand-100 text-brand-700">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-900 tracking-tight">
                      Confirm Goods Receipt
                    </h2>
                    <p className="text-xs font-semibold text-slate-600 mt-0.5">
                      {selectedOrder.orderNumber || selectedOrder.id} · {selectedOrder.brandName} · {selectedOrder.genericMedicine} {selectedOrder.strength}
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={handleCloseModal}
                disabled={submitting}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleConfirmReceipt} className="p-6 space-y-5">
              {/* Field 1: Quantity approved in Auto Reorder (Read-Only) */}
              <div className="p-4 rounded-xl bg-slate-100/80 border border-slate-200">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Quantity approved in Auto Reorder
                  </span>
                  <span className="text-[11px] font-semibold text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                    Read-only · Retrieved from the approved order
                  </span>
                </div>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-3xl font-black text-slate-900">
                    {selectedOrder.approvedQuantity || selectedOrder.suggestedQuantity || 0}
                  </span>
                  <span className="text-sm font-bold text-slate-500">units</span>
                </div>
              </div>

              {/* Field 2: Actual Received Quantity (Editable, Prefilled) */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Actual Received Quantity <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max="10000"
                    required
                    value={receiptForm.actualReceivedQuantity}
                    onChange={(e) =>
                      setReceiptForm((prev) => ({
                        ...prev,
                        actualReceivedQuantity: e.target.value,
                      }))
                    }
                    className="w-full pl-4 pr-16 py-2.5 text-lg font-bold text-slate-900 bg-white border-2 border-brand-500 rounded-lg focus:outline-none focus:ring-4 focus:ring-brand-500/20 shadow-sm"
                    placeholder="135"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-500 select-none">
                    units
                  </span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed pt-0.5">
                  Prefilled from the approved quantity. Admin can change it if the delivery differs.
                </p>

                {/* Delivery Calculation Callout */}
                {(() => {
                  const approved =
                    Number(selectedOrder.approvedQuantity || selectedOrder.suggestedQuantity || 0);
                  const actual = Number(receiptForm.actualReceivedQuantity || 0);

                  if (actual > 0 && actual < approved) {
                    return (
                      <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 flex items-start gap-2.5 text-xs text-amber-900 mt-2">
                        <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold">
                            Partial delivery ({actual} of {approved} units arrived)
                          </p>
                          <p className="text-[11px] text-amber-800 leading-normal mt-0.5">
                            The system will create a batch of exactly <strong>{actual} units</strong> and increase inventory stock by <strong>+{actual}</strong>, not {approved}.
                          </p>
                        </div>
                      </div>
                    );
                  }

                  if (actual === approved && actual > 0) {
                    return (
                      <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-xs text-emerald-900 mt-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        <span>
                          Full delivery: All <strong>{actual} units</strong> arrived. Order will be marked as fully <strong>RECEIVED</strong>.
                        </span>
                      </div>
                    );
                  }

                  if (actual > approved) {
                    return (
                      <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-200 flex items-center gap-2 text-xs text-blue-900 mt-2">
                        <Info className="w-4 h-4 text-blue-600 flex-shrink-0" />
                        <span>
                          Surplus delivery: <strong>{actual} units</strong> arrived ({actual - approved} extra). Batch of {actual} units will be registered.
                        </span>
                      </div>
                    );
                  }

                  return null;
                })()}
              </div>

              {/* Field 3: Batch Number */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Batch Number <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={receiptForm.batchNumber}
                    onChange={(e) =>
                      setReceiptForm((prev) => ({
                        ...prev,
                        batchNumber: e.target.value.toUpperCase(),
                      }))
                    }
                    className="w-full px-4 py-2 text-sm font-mono font-bold text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                    placeholder="e.g. DLO2026C"
                  />
                </div>
                <p className="text-[11px] text-slate-400">
                  Unique manufacturer batch identifier for stock tracking and FIFO dispensing.
                </p>
              </div>

              {/* Field 4 & 5: Manufacturing Date and Expiry Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Manufacturing Date <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      required
                      value={receiptForm.manufacturingDate}
                      onChange={(e) =>
                        setReceiptForm((prev) => ({
                          ...prev,
                          manufacturingDate: e.target.value,
                        }))
                      }
                      className="w-full px-3.5 py-2 text-xs font-medium text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Expiry Date <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      required
                      value={receiptForm.expiryDate}
                      onChange={(e) =>
                        setReceiptForm((prev) => ({
                          ...prev,
                          expiryDate: e.target.value,
                        }))
                      }
                      className="w-full px-3.5 py-2 text-xs font-medium text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                </div>
              </div>

              {/* Field 6: Supplier */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Supplier <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={receiptForm.supplier}
                    onChange={(e) =>
                      setReceiptForm((prev) => ({
                        ...prev,
                        supplier: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                    placeholder="e.g. Micro Supply Co"
                  />
                </div>
              </div>

              {/* Automatic Actions Checklist */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs text-slate-700">
                <p className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-brand-600" />
                  Automated System Actions Upon Confirmation:
                </p>
                <ul className="space-y-1 text-slate-600 pl-4 list-disc text-[11px]">
                  <li>Automatically creates batch entry in Medicine & Batch modules.</li>
                  <li>Saves actual received quantity ({receiptForm.actualReceivedQuantity || 0} units) in the batch record.</li>
                  <li>Increases usable stock of <strong>{selectedOrder.brandName}</strong> automatically.</li>
                  <li>Marks order <strong>{selectedOrder.orderNumber || selectedOrder.id}</strong> as <strong>RECEIVED</strong>.</li>
                </ul>
              </div>

              {/* Modal Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  disabled={submitting}
                  onClick={handleCloseModal}
                  className="px-5 py-2 text-xs font-bold"
                >
                  Cancel
                </Button>

                <Button
                  type="submit"
                  variant="success"
                  loading={submitting}
                  disabled={submitting}
                  className="px-6 py-2.5 text-xs font-bold shadow-md bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  Confirm Goods Received
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
