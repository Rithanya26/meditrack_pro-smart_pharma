import { useState, useEffect } from "react";
import {
  Search, Pill, Package, CheckCircle, AlertCircle, Trash2,
  ArrowRight, ArrowLeft, Stethoscope, Printer, Download, Check,
} from "lucide-react";
import PageHeader from "../../components/common/PageHeader";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { StatusBadge } from "../../components/ui/StatusBadge";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import EmptyState from "../../components/ui/EmptyState";
import { medicineService } from "../../services/medicineService";
import { dispensingService } from "../../services/dispensingService";
import { useToast } from "../../context/ToastContext";
import { useAuth } from "../../context/AuthContext";
import { formatDate, formatTime, classNames, calculateExpiryRisk } from "../../utils/helpers";

const STEPS = ["Search", "Select", "Batch", "Quantity", "Review", "Receipt"];

export default function DispenseMedicine() {
  const toast = useToast();
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedMed, setSelectedMed] = useState(null);
  const [batches, setBatches] = useState([]);
  const [batchLoading, setBatchLoading] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [quantity, setQuantity] = useState("");
  const [dailyDosage, setDailyDosage] = useState("");
  const [treatmentDays, setTreatmentDays] = useState("");
  const [qtyError, setQtyError] = useState("");
  const [dispensing, setDispensing] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [patientId, setPatientId] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [finalizeError, setFinalizeError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const data = await medicineService.getAll();
        setMedicines(data.filter((m) => m.status === "active"));
      } catch {
        toast.error("Unable to load medicines.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filteredMeds = medicines.filter((m) => {
    const q = search.toLowerCase();
    return !q || m.name.toLowerCase().includes(q) || m.genericName.toLowerCase().includes(q);
  });

  async function selectMedicine(med) {
    setSelectedMed(med);
    setSelectedBatch(null);
    setQuantity("");
    setDailyDosage("");
    setTreatmentDays("");
    setQtyError("");
    setStep(2);
    setBatchLoading(true);
    try {
      const fefoBatches = await dispensingService.getFefoBatches(med.id);
      setBatches(fefoBatches);
    } catch {
      toast.error("Unable to load batches.");
    } finally {
      setBatchLoading(false);
    }
  }

  function selectBatch(batch) {
    setSelectedBatch(batch);
    setQuantity("");
    setQtyError("");
    setStep(3);
  }

  const expiryRisk = selectedBatch
    ? calculateExpiryRisk({
      dailyDosage,
      treatmentDays,
      daysRemaining: selectedBatch.daysRemaining,
      availableQuantity: selectedBatch.quantity,
    })
    : null;

  const alternativeBatches = selectedBatch
    ? batches.filter((batch) => batch.id !== selectedBatch.id && batch.daysRemaining > selectedBatch.daysRemaining)
    : [];

  function validateQuantity() {
    const qty = Number(quantity);
    if (!quantity || isNaN(qty) || qty <= 0) {
      setQtyError("Quantity must be greater than zero.");
      return false;
    }
    if (qty > selectedBatch.quantity) {
      setQtyError(`Insufficient stock. Only ${selectedBatch.quantity} units are available.`);
      return false;
    }
    setQtyError("");
    return true;
  }

  function addToCart() {
    if (!validateQuantity()) return;
    const cartItem = {
      medicineId: selectedMed.id,
      medicineName: selectedMed.name,
      batchId: selectedBatch.id,
      batchNumber: selectedBatch.batchNumber,
      quantity: Number(quantity),
      dosage: dailyDosage ? `${dailyDosage} units/day` : "",
      expiryDate: selectedBatch.expiryDate,
      daysRemaining: selectedBatch.daysRemaining,
      expiryRisk,
    };
    setCart((current) => [...current.filter((item) => item.medicineId !== cartItem.medicineId), cartItem]);
    setSelectedBatch(null);
    setQuantity("");
    setStep(0);
  }

  function removeFromCart(medicineId) {
    setCart((current) => current.filter((item) => item.medicineId !== medicineId));
  }

  function goToReview() {
    if (!cart.length) return;
    setFinalizeError("");
    setStep(4);
  }

  async function confirmDispensing() {
    if (!customerName.trim() || !customerPhone.trim()) {
      setFinalizeError("Customer name and phone number are required.");
      return;
    }
    setDispensing(true);
    try {
      const tx = await dispensingService.finalizeTransaction({
        customerName,
        customerPhone,
        patientId,
        referenceNumber,
        pharmacistId: user.id,
        pharmacistName: user.name,
        items: cart,
      });
      setReceipt(tx);
      setStep(5);
      toast.success("Medicine dispensed successfully.");
    } catch (err) {
      setFinalizeError(err.message || "Unable to dispense medicine.");
    } finally {
      setDispensing(false);
    }
  }

  function reset() {
    setStep(0);
    setSelectedMed(null);
    setSelectedBatch(null);
    setBatches([]);
    setQuantity("");
    setDailyDosage("");
    setTreatmentDays("");
    setQtyError("");
    setReceipt(null);
    setCart([]);
    setCustomerName("");
    setCustomerPhone("");
    setPatientId("");
    setReferenceNumber("");
    setFinalizeError("");
    setSearch("");
  }

  return (
    <div>
      <PageHeader title="Dispense Medicine" subtitle="Search, select batch (FEFO), and dispense medicine" />

      {/* Stepper */}
      <div className="mb-6">
        <div className="flex items-center justify-between overflow-x-auto pb-2">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className={classNames(
                  "w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition",
                  i < step ? "bg-success-500 text-white" :
                  i === step ? "bg-brand-600 text-white" :
                  "bg-slate-200 text-slate-500"
                )}>
                  {i < step ? <Check className="w-4 h-4" /> : i + 1}
                </div>
                <span className={classNames(
                  "text-sm font-medium hidden sm:inline",
                  i === step ? "text-brand-700" : i < step ? "text-success-600" : "text-slate-400"
                )}>
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && <div className={classNames("w-6 sm:w-12 h-0.5 mx-1 sm:mx-2", i < step ? "bg-success-500" : "bg-slate-200")} />}
            </div>
          ))}
        </div>
      </div>

      {/* Step content */}
      {step < 5 && (
        <Card>
          {/* Step 0: Search */}
          {step === 0 && (
            <div>
              <div className="text-center mb-6">
                <div className="w-14 h-14 rounded-xl bg-brand-50 flex items-center justify-center mx-auto mb-3">
                  <Search className="w-7 h-7 text-brand-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-800">Search Medicine</h3>
                <p className="text-sm text-slate-500">Search by medicine name or generic name</p>
              </div>
              <div className="max-w-xl mx-auto relative mb-6">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Type a medicine name..."
                  className="input pl-12 py-3 text-base"
                  autoFocus
                />
              </div>
              {loading ? <LoadingSpinner /> : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-3xl mx-auto">
                  {filteredMeds.slice(0, 8).map((med) => (
                    <button
                      key={med.id}
                      onClick={() => selectMedicine(med)}
                      className="flex items-center gap-3 p-4 rounded-lg border border-slate-200 hover:border-brand-300 hover:bg-brand-50/50 transition text-left group"
                    >
                      <div className="w-10 h-10 rounded-lg bg-brand-50 flex items-center justify-center flex-shrink-0">
                        <Pill className="w-5 h-5 text-brand-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-800 truncate">{med.name}</p>
                        <p className="text-xs text-slate-500">{med.category} · {med.strength}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-brand-600 flex-shrink-0" />
                    </button>
                  ))}
                  {filteredMeds.length === 0 && (
                    <div className="col-span-2">
                      <EmptyState icon={Pill} title="No medicines found" message="Try a different search term." />
                    </div>
                  )}
                </div>
              )}
              {cart.length > 0 && (
                <div className="max-w-3xl mx-auto mt-8 border-t border-slate-200 pt-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-base font-semibold text-slate-800">Current Dispensing</h3>
                    <span className="text-sm text-slate-500">{cart.length} medicine{cart.length === 1 ? "" : "s"}</span>
                  </div>
                  <div className="space-y-2">
                    {cart.map((item) => (
                      <div key={item.medicineId} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 p-3">
                        <div className="min-w-0">
                          <p className="font-medium text-slate-800 truncate">{item.medicineName}</p>
                          <p className="text-xs text-slate-500">Batch {item.batchNumber} · {item.quantity} units · expires {formatDate(item.expiryDate)}</p>
                        </div>
                        <button type="button" onClick={() => removeFromCart(item.medicineId)} className="text-danger-600 hover:text-danger-700" title="Remove medicine">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-end mt-4">
                    <Button onClick={goToReview}>Review Dispensing <ArrowRight className="w-4 h-4" /></Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 1: Select (show details) */}
          {step === 1 && selectedMed && (
            <div className="max-w-2xl mx-auto">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-xl bg-brand-50 flex items-center justify-center">
                  <Pill className="w-7 h-7 text-brand-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-800">{selectedMed.name}</h3>
                  <p className="text-sm text-slate-500">{selectedMed.genericName} · {selectedMed.strength} · {selectedMed.dosageForm}</p>
                </div>
              </div>
              <dl className="grid grid-cols-2 gap-3 mb-6">
                <div className="p-3 rounded-lg bg-slate-50"><p className="text-xs text-slate-500">Category</p><p className="text-sm font-medium text-slate-700">{selectedMed.category}</p></div>
                <div className="p-3 rounded-lg bg-slate-50"><p className="text-xs text-slate-500">Manufacturer</p><p className="text-sm font-medium text-slate-700">{selectedMed.manufacturer}</p></div>
              </dl>
              <div className="flex justify-between">
                <Button variant="secondary" onClick={() => setStep(0)}><ArrowLeft className="w-4 h-4" /> Back</Button>
                <Button onClick={() => selectMedicine(selectedMed)}>Continue <ArrowRight className="w-4 h-4" /></Button>
              </div>
            </div>
          )}

          {/* Step 2: Select batch (FEFO) */}
          {step === 2 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Package className="w-5 h-5 text-brand-600" />
                <h3 className="text-lg font-semibold text-slate-800">Select Batch</h3>
              </div>
              <div className="p-3 mb-4 rounded-lg bg-brand-50 border border-brand-100 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-brand-600 flex-shrink-0" />
                <p className="text-sm text-brand-800">
                  <strong>FEFO Logic:</strong> Batches are sorted by earliest expiry first. The recommended batch has the soonest expiry date.
                </p>
              </div>
              {batchLoading ? <LoadingSpinner /> : batches.length === 0 ? (
                <EmptyState icon={Package} title="No available batches" message="All batches are expired, out of stock, or within 30 days of expiry and hidden from dispensing." />
              ) : (
                <div className="space-y-3">
                  {batches.map((batch, i) => (
                    <div
                      key={batch.id}
                      className={classNames(
                        "p-4 rounded-lg border transition cursor-pointer",
                        selectedBatch?.id === batch.id ? "border-brand-500 bg-brand-50/50 ring-2 ring-brand-500/20" :
                        i === 0 ? "border-success-200 bg-success-50/30 hover:border-brand-300" :
                        "border-slate-200 hover:border-brand-300"
                      )}
                      onClick={() => selectBatch(batch)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={classNames(
                            "w-10 h-10 rounded-lg flex items-center justify-center",
                            i === 0 ? "bg-success-100 text-success-700" : "bg-slate-100 text-slate-500"
                          )}>
                            <Package className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-800">{batch.batchNumber}</p>
                            <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                              <span>Expires: {formatDate(batch.expiryDate)}</span>
                              <span>Stock: <strong className="text-slate-700">{batch.quantity}</strong></span>
                              <span>{batch.daysRemaining} days left</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {i === 0 && (
                            <span className="badge bg-success-100 text-success-700">
                              <CheckCircle className="w-3 h-3" /> Recommended
                            </span>
                          )}
                          <StatusBadge status={batch.expiryStatus} type="expiry" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex justify-between mt-6">
                <Button variant="secondary" onClick={() => setStep(0)}><ArrowLeft className="w-4 h-4" /> Back</Button>
              </div>
            </div>
          )}

          {/* Step 3: Enter quantity */}
          {step === 3 && selectedBatch && (
            <div className="max-w-md mx-auto">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-slate-800">Enter Quantity</h3>
                <p className="text-sm text-slate-500">Specify the number of units to dispense</p>
              </div>
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-500">Medicine</span>
                  <span className="text-sm font-medium text-slate-800">{selectedMed.name}</span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-500">Batch</span>
                  <span className="text-sm font-medium text-slate-800">{selectedBatch.batchNumber}</span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-500">Expiry Date</span>
                  <span className="text-sm font-medium text-slate-800">{formatDate(selectedBatch.expiryDate)}</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                  <span className="text-sm text-slate-600 font-medium">Available Stock</span>
                  <span className="text-lg font-bold text-brand-700">{selectedBatch.quantity}</span>
                </div>
              </div>
              <Input
                type="number"
                label="Authorized Daily Dosage (units/day) *"
                value={dailyDosage}
                onChange={(e) => setDailyDosage(e.target.value)}
                placeholder="Enter prescribed dosage"
                min="0.01"
                step="0.01"
                className="mb-4"
              />
              <Input
                type="number"
                label="Requested Treatment Duration (days) *"
                value={treatmentDays}
                onChange={(e) => setTreatmentDays(e.target.value)}
                placeholder="Enter treatment days"
                min="1"
                step="1"
                className="mb-4"
              />
              {expiryRisk && (
                <div className={classNames(
                  "mb-4 rounded-lg border p-4",
                  expiryRisk.conflict ? "border-danger-200 bg-danger-50" : expiryRisk.riskLevel === "MEDIUM" ? "border-yellow-200 bg-yellow-50" : "border-success-200 bg-success-50"
                )}>
                  <div className="flex items-start gap-3">
                    <AlertCircle className={classNames("w-5 h-5 flex-shrink-0", expiryRisk.conflict ? "text-danger-600" : expiryRisk.riskLevel === "MEDIUM" ? "text-yellow-600" : "text-success-600")} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h4 className={classNames("font-semibold", expiryRisk.conflict ? "text-danger-800" : expiryRisk.riskLevel === "MEDIUM" ? "text-yellow-800" : "text-success-800")}>
                          {expiryRisk.conflict ? "Expiry Risk Detected" : "Batch Covers Requested Duration"}
                        </h4>
                        <span className="badge bg-slate-100 text-slate-700">{expiryRisk.riskLevel} RISK</span>
                      </div>
                      <p className="mt-1 text-sm text-slate-700">
                        {expiryRisk.conflict
                          ? `This batch expires in ${expiryRisk.daysRemaining} days, before the requested ${expiryRisk.treatmentDays}-day treatment period is completed. Approximately ${expiryRisk.estimatedConsumption} units can be consumed before expiry, while ${expiryRisk.requiredQuantity} units are required.`
                          : `The selected batch remains valid for the requested ${expiryRisk.treatmentDays}-day treatment period. Approximately ${expiryRisk.requiredQuantity} units are required.`}
                      </p>
                      <dl className="grid grid-cols-2 gap-2 mt-3 text-xs text-slate-600 sm:grid-cols-3">
                        <div><dt>Days until expiry</dt><dd className="font-semibold text-slate-800">{expiryRisk.daysRemaining}</dd></div>
                        <div><dt>Required quantity</dt><dd className="font-semibold text-slate-800">{expiryRisk.requiredQuantity}</dd></div>
                        <div><dt>Usable before expiry</dt><dd className="font-semibold text-slate-800">{expiryRisk.estimatedConsumption}</dd></div>
                        <div><dt>Quantity beyond expiry</dt><dd className="font-semibold text-slate-800">{expiryRisk.quantityAffected}</dd></div>
                        <div><dt>Expiry status</dt><dd className="font-semibold text-slate-800">{expiryRisk.conflict ? "At Risk" : "Covered"}</dd></div>
                      </dl>
                      {expiryRisk.conflict && (
                        <p className="mt-3 text-xs text-slate-600">Review another available batch with a later expiry date. The pharmacist remains responsible for the final dispensing decision.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
              {expiryRisk?.conflict && alternativeBatches.length > 0 && (
                <div className="mb-4 rounded-lg border border-brand-200 bg-brand-50 p-3">
                  <p className="text-sm font-semibold text-brand-800">Available alternative batches</p>
                  <p className="mt-1 text-xs text-brand-700">Review these later-expiry batches according to pharmacy procedures.</p>
                  <div className="mt-2 space-y-1 text-xs text-brand-800">
                    {alternativeBatches.map((batch) => <div key={batch.id} className="flex justify-between"><span>{batch.batchNumber}</span><span>{batch.daysRemaining} days left · {batch.quantity} units</span></div>)}
                  </div>
                </div>
              )}
              <Input
                type="number"
                label="Quantity to Dispense *"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="Enter quantity"
                min="1"
                max={selectedBatch.quantity}
                error={qtyError}
                autoFocus
              />
              {qtyError && (
                <div className="mt-2 p-3 rounded-lg bg-danger-50 border border-danger-200 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-danger-600 flex-shrink-0" />
                  <p className="text-sm text-danger-700">{qtyError}</p>
                </div>
              )}
              <div className="flex justify-between mt-6">
                <Button variant="secondary" onClick={() => setStep(2)}><ArrowLeft className="w-4 h-4" /> Back</Button>
                <Button onClick={addToCart}>Add to Dispensing <CheckCircle className="w-4 h-4" /></Button>
              </div>
            </div>
          )}

          {/* Step 4: Review */}
          {step === 4 && cart.length > 0 && (
            <div className="max-w-lg mx-auto">
              <div className="text-center mb-6">
                <div className="w-14 h-14 rounded-xl bg-brand-50 flex items-center justify-center mx-auto mb-3">
                  <Stethoscope className="w-7 h-7 text-brand-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-800">Finalize Dispensing</h3>
                <p className="text-sm text-slate-500">Enter customer details before confirming the complete transaction</p>
              </div>
              <div className="grid gap-3 mb-5">
                <Input label="Customer / Patient Name *" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Full name" />
                <Input label="Phone Number *" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="Phone number" />
                <Input label="Patient / Customer ID" value={patientId} onChange={(e) => setPatientId(e.target.value)} placeholder="Optional" />
                <Input label="Prescription / Reference Number" value={referenceNumber} onChange={(e) => setReferenceNumber(e.target.value)} placeholder="Optional" />
              </div>
              {finalizeError && <div className="mb-4 rounded-lg border border-danger-200 bg-danger-50 p-3 text-sm text-danger-700">{finalizeError}</div>}
              <div className="space-y-2 mb-6">
                {[
                  { label: "Medicines", value: `${cart.length} selected` },
                  { label: "Total Units", value: cart.reduce((sum, item) => sum + item.quantity, 0) },
                  ...cart.map((item) => ({
                    label: item.medicineName,
                    value: `${item.quantity} units · ${item.batchNumber}${item.expiryRisk?.conflict ? ` · ${item.expiryRisk.riskLevel} EXPIRY RISK` : ""}`,
                  })),
                  { label: "Pharmacist", value: user.name },
                  { label: "Date", value: formatDate(new Date().toISOString()) },
                  { label: "Time", value: formatTime(new Date().toISOString()) },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between py-2.5 px-4 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-sm text-slate-500">{item.label}</span>
                    <span className="text-sm font-semibold text-slate-800">{item.value}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between">
                <Button variant="secondary" onClick={() => setStep(0)}><ArrowLeft className="w-4 h-4" /> Back</Button>
                <Button onClick={confirmDispensing} loading={dispensing}>Confirm Dispensing <CheckCircle className="w-4 h-4" /></Button>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Step 5: Receipt */}
      {step === 5 && receipt && (
        <div className="max-w-lg mx-auto">
          <Card>
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-full bg-success-50 flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="w-7 h-7 text-success-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800">Dispensing Successful</h3>
              <p className="text-sm text-slate-500">Transaction ID: <span className="font-mono font-semibold text-brand-700">{receipt.id}</span></p>
            </div>

            {/* Receipt */}
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <div className="bg-brand-600 text-white px-5 py-3 text-center">
                <p className="font-bold">MediTrack Pro</p>
                <p className="text-xs text-brand-100">Dispensing Transaction</p>
              </div>
              <div className="p-5 space-y-2">
                {[
                  { label: "Transaction ID", value: receipt.id, mono: true },
                  { label: "Customer", value: receipt.customerName },
                  { label: "Phone", value: receipt.customerPhone },
                  { label: "Medicines", value: `${receipt.totalItems}` },
                  { label: "Pharmacist", value: receipt.pharmacistName },
                  { label: "Date", value: formatDate(receipt.date) },
                  { label: "Time", value: formatTime(receipt.date) },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                    <span className="text-sm text-slate-500">{item.label}</span>
                    <span className={`text-sm font-semibold text-slate-800 ${item.mono ? "font-mono text-xs" : ""}`}>{item.value}</span>
                  </div>
                ))}
                <div className="mt-3 border-t border-slate-200 pt-3">
                  {receipt.items.map((item) => (
                    <div key={item.itemId || `${item.medicineId}-${item.batchId}`} className="flex items-center justify-between py-2 text-sm">
                      <span className="text-slate-600">{item.medicineName} <span className="text-xs text-slate-400">({item.batchNumber})</span></span>
                      <span className="font-semibold text-slate-800">{item.quantity} units</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 mt-6">
              <Button variant="secondary" onClick={() => window.print()}>
                <Printer className="w-4 h-4" /> Print
              </Button>
              <Button variant="secondary" onClick={() => toast.info("Receipt download initiated (demo).")}>
                <Download className="w-4 h-4" /> Download
              </Button>
              <Button onClick={reset}>
                <Stethoscope className="w-4 h-4" /> New Dispensing
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
