import api from "./api";
import { daysUntilExpiry, getExpiryStatus } from "../utils/helpers";

function normalizeTransaction(transaction) {
  return {
    ...transaction,
    date: transaction.transactionDate,
    pharmacistId: transaction.pharmacist?.id,
    pharmacistName: transaction.pharmacist?.name,
    status: transaction.status?.toLowerCase(),
    items: transaction.items?.map((item) => ({
      ...item,
      medicineId: item.medicine?.id,
      medicineName: item.medicine?.name,
      batchId: item.batch?.id,
      batchNumber: item.batch?.batchNumber,
      expiryDate: item.expiryDateAtDispense,
    })) || [],
  };
}

export const dispensingService = {
  async getTransactions({ pharmacistId, search = "" } = {}) {
    const { data } = await api.get("/dispensing");
    const query = search.toLowerCase();
    return data.map(normalizeTransaction)
      .filter((transaction) => !pharmacistId || transaction.pharmacistId === Number(pharmacistId))
      .filter((transaction) => !query || [transaction.id, transaction.customerName, transaction.customerPhone, transaction.pharmacistName]
        .some((value) => String(value || "").toLowerCase().includes(query)))
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
