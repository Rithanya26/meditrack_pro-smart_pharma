// Dispensing service — currently uses mock data, structured for Flask API replacement
// GET /api/dispensing, POST /api/dispensing
import { mockDispensing, mockDispensingTransactions, mockBatches, mockAuditLogs } from "../data/mockData";
import { daysUntilExpiry, getExpiryStatus } from "../utils/helpers";
import { generateTransactionId } from "../utils/helpers";

const MOCK_DELAY = 400;
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const dispensingService = {
  async getTransactions({ pharmacistId, search = "" } = {}) {
    await delay(MOCK_DELAY);
    const query = search.toLowerCase();
    return mockDispensingTransactions
      .filter((transaction) => !pharmacistId || transaction.pharmacistId === pharmacistId)
      .filter((transaction) => !query || [transaction.id, transaction.customerName, transaction.customerPhone, transaction.pharmacistName]
        .some((value) => String(value || "").toLowerCase().includes(query)))
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  },

  async getAll() {
    await delay(MOCK_DELAY);
    return [...mockDispensing].sort((a, b) => new Date(b.date) - new Date(a.date));
  },

  async getByPharmacist(pharmacistId) {
    await delay(MOCK_DELAY);
    const legacyRecords = mockDispensing
      .filter((d) => d.pharmacistId === pharmacistId)
      .map((record) => ({ ...record, transactionId: record.id }));
    const groupedItems = mockDispensingTransactions
      .filter((transaction) => transaction.pharmacistId === pharmacistId)
      .flatMap((transaction) => transaction.items.map((item) => ({
        ...item,
        id: transaction.id,
        transactionId: transaction.id,
        pharmacistId: transaction.pharmacistId,
        pharmacistName: transaction.pharmacistName,
        date: transaction.date,
        status: transaction.status,
      })));
    return [...legacyRecords, ...groupedItems].sort((a, b) => new Date(b.date) - new Date(a.date));
  },

  async finalizeTransaction({ customerName, customerPhone, patientId, referenceNumber, pharmacistId, pharmacistName, items }) {
    await delay(MOCK_DELAY);
    if (!customerName?.trim()) throw new Error("Customer name is required.");
    if (!customerPhone?.trim()) throw new Error("Customer phone number is required.");
    if (!items?.length) throw new Error("Add at least one medicine before finalizing.");

    const validatedItems = items.map((item) => {
      const batch = mockBatches.find((candidate) => candidate.id === item.batchId);
      if (!batch) throw new Error(`${item.medicineName}: batch not found.`);
      if (daysUntilExpiry(batch.expiryDate) <= 0) throw new Error(`${item.medicineName}: selected batch has expired.`);
      if (!Number.isFinite(Number(item.quantity)) || Number(item.quantity) <= 0) throw new Error(`${item.medicineName}: quantity must be greater than zero.`);
      if (Number(item.quantity) > batch.quantity) throw new Error(`${item.medicineName}: insufficient stock. Only ${batch.quantity} units are available.`);
      return { ...item, quantity: Number(item.quantity), expiryDate: batch.expiryDate };
    });

    // Every check completes before any inventory is mutated.
    validatedItems.forEach((item) => {
      const batch = mockBatches.find((candidate) => candidate.id === item.batchId);
      batch.quantity -= item.quantity;
    });

    const transaction = {
      id: `DISP-${new Date().getFullYear()}-${String(mockDispensingTransactions.length + 1).padStart(5, "0")}`,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      patientId: patientId?.trim() || "",
      referenceNumber: referenceNumber?.trim() || "",
      pharmacistId,
      pharmacistName,
      date: new Date().toISOString(),
      status: "completed",
      totalItems: validatedItems.length,
      items: validatedItems,
    };
    mockDispensingTransactions.push(transaction);
    mockAuditLogs.unshift({
      id: `AUD-${String(mockAuditLogs.length + 1).padStart(3, "0")}`,
      timestamp: transaction.date,
      userId: pharmacistId,
      userName: pharmacistName,
      role: "pharmacist",
      action: "DISPENSING_COMPLETED",
      entity: "DispensingTransaction",
      entityId: transaction.id,
      description: `${transaction.id}: ${transaction.totalItems} medicines for ${transaction.customerName} (${transaction.customerPhone})`,
    });
    return transaction;
  },

  // FEFO: get valid (non-expired) batches for a medicine, sorted by earliest expiry
  async getFefoBatches(medicineId) {
    await delay(MOCK_DELAY);
    const batches = mockBatches.filter((b) => b.medicineId === medicineId);
    return batches
      .map((b) => {
        const days = daysUntilExpiry(b.expiryDate);
        return { ...b, daysRemaining: days, expiryStatus: getExpiryStatus(days) };
      })
      // Do not present stock within the 30-day expiry window for dispensing.
      .filter((b) => b.expiryStatus !== "Expired" && b.quantity > 0 && b.daysRemaining > 30)
      .sort((a, b) => a.daysRemaining - b.daysRemaining);
  },

  async dispense({ medicineId, medicineName, batchId, batchNumber, quantity, pharmacistId, pharmacistName }) {
    await delay(MOCK_DELAY);
    const batch = mockBatches.find((b) => b.id === batchId);
    if (!batch) throw new Error("Batch not found");
    if (batch.quantity <= 0) throw new Error("Cannot dispense from an empty batch");
    if (quantity <= 0) throw new Error("Quantity must be greater than zero");
    if (quantity > batch.quantity) {
      throw new Error(`Insufficient stock. Only ${batch.quantity} units are available.`);
    }
    const days = daysUntilExpiry(batch.expiryDate);
    if (days <= 0) {
      throw new Error("Cannot dispense this batch because it has expired.");
    }

    batch.quantity -= quantity;
    const transaction = {
      id: generateTransactionId(),
      medicineId,
      medicineName,
      batchId,
      batchNumber,
      quantity,
      pharmacistId,
      pharmacistName,
      date: new Date().toISOString(),
      status: "completed",
    };
    mockDispensing.push(transaction);
    return transaction;
  },
};
