import api from "./api";
import { daysUntilExpiry, getExpiryStatus } from "../utils/helpers";
import { mockDispensingTransactions } from "../data/mockData";

function normalizeTransaction(transaction) {
  return {
    ...transaction,
    date: transaction.transactionDate || transaction.date,
    pharmacistId: transaction.pharmacist?.id != null ? Number(transaction.pharmacist?.id) : (transaction.pharmacistId != null ? Number(transaction.pharmacistId) : undefined),
    pharmacistName: transaction.pharmacist?.name || transaction.pharmacistName,
    status: transaction.status?.toLowerCase() || "completed",
    items: transaction.items?.map((item) => ({
      ...item,
      medicineId: item.medicine?.id || item.medicineId,
      brandName: item.medicine?.brandName || item.medicine?.name || item.brandName || item.medicineName,
      medicineName: item.medicine?.brandName || item.medicine?.name || item.brandName || item.medicineName,
      genericMedicine: item.medicine?.genericMedicine || item.medicine?.genericName || item.genericMedicine || item.genericName,
      strength: item.medicine?.strength || item.strength,
      dosageForm: item.medicine?.dosageForm || item.dosageForm,
      batchId: item.batch?.id || item.batchId,
      batchNumber: item.batch?.batchNumber || item.batchNumber,
      expiryDate: item.expiryDateAtDispense || item.expiryDate,
    })) || [],
  };
}

export const dispensingService = {
  async getTransactions({ pharmacistId, search = "" } = {}) {
    let transactions = [];
    try {
      const { data } = await api.get("/dispensing");
      if (Array.isArray(data) && data.length >= 50) {
        transactions = data.map(normalizeTransaction);
      } else if (Array.isArray(data) && data.length > 0) {
        const apiTxns = data.map(normalizeTransaction);
        const apiIds = new Set(apiTxns.map((t) => String(t.id)));
        const historicalComplements = (mockDispensingTransactions || [])
          .filter((t) => !apiIds.has(String(t.id)))
          .map(normalizeTransaction);
        transactions = [...apiTxns, ...historicalComplements];
      } else if (mockDispensingTransactions && mockDispensingTransactions.length > 0) {
        transactions = mockDispensingTransactions.map(normalizeTransaction);
      }
    } catch (err) {
      console.warn("Failed to load dispensing transactions from API, using fallback data:", err);
      if (mockDispensingTransactions && mockDispensingTransactions.length > 0) {
        transactions = mockDispensingTransactions.map(normalizeTransaction);
      }
    }

    const query = search.toLowerCase();
    return transactions
      .filter((transaction) => !pharmacistId || transaction.pharmacistId === Number(pharmacistId))
      .filter((transaction) => !query || [
        transaction.id,
        transaction.customerName,
        transaction.customerPhone,
        transaction.pharmacistName,
        ...(transaction.items || []).flatMap((i) => [i.brandName, i.genericMedicine, i.batchNumber])
      ].some((value) => String(value || "").toLowerCase().includes(query)))
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  },

  async getAll() {
    const transactions = await this.getTransactions();
    return transactions.flatMap((transaction) => transaction.items.map((item) => ({
      ...item,
      id: transaction.id,
      transactionId: transaction.id,
      customerName: transaction.customerName,
      customerPhone: transaction.customerPhone,
      pharmacistId: transaction.pharmacistId,
      pharmacistName: transaction.pharmacistName,
      date: transaction.date,
      status: transaction.status,
    })));
  },

  async getByPharmacist(pharmacistId) {
    return (await this.getAll()).filter((record) => record.pharmacistId === Number(pharmacistId));
  },

  async finalizeTransaction({ customerName, customerPhone, patientId, referenceNumber, pharmacistId, items }) {
    if (!customerName?.trim()) throw new Error("Customer name is required.");
    if (!customerPhone?.trim()) throw new Error("Customer phone number is required.");
    if (!items?.length) throw new Error("Add at least one medicine before finalizing.");
    const { data } = await api.post("/dispensing", {
      customerName: customerName.trim(), customerPhone: customerPhone.trim(), patientId, referenceNumber,
      pharmacist: { id: Number(pharmacistId) },
      items: items.map((item) => ({ medicine: { id: Number(item.medicineId) }, batch: { id: Number(item.batchId) }, quantity: Number(item.quantity) })),
    });
    return normalizeTransaction(data);
  },

  // FEFO: get valid (non-expired) batches for a medicine, sorted by earliest expiry
  async getFefoBatches(medicineId) {
    const { data } = await api.get(`/medicines/${medicineId}/batches`);
    const batches = data.map((batch) => ({ ...batch, medicineId: batch.medicine?.id }));
    return batches
      .map((b) => {
        const days = daysUntilExpiry(b.expiryDate);
        return { ...b, daysRemaining: days, expiryStatus: getExpiryStatus(days) };
      })
      // Do not present stock within the 30-day expiry window for dispensing.
      .filter((b) => b.expiryStatus !== "Expired" && b.quantity > 0 && b.daysRemaining > 30)
      .sort((a, b) => a.daysRemaining - b.daysRemaining);
  },

  async dispense({ medicineId, medicineName, batchId, batchNumber, quantity, pharmacistId }) {
    const transaction = await this.finalizeTransaction({
      customerName: "Walk-in customer", customerPhone: "N/A", pharmacistId,
      items: [{ medicineId, medicineName, batchId, batchNumber, quantity }],
    });
    return transaction.items[0];
  },
};
