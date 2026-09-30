import api from "./api";

export const medicineService = {
  async getAll() {
    const { data } = await api.get("/medicines");
    return data.map((medicine) => ({ ...medicine, status: medicine.status.toLowerCase() }));
  },

  async getById(id) {
    const { data } = await api.get(`/medicines/${id}`);
    return { ...data, status: data.status.toLowerCase() };
  },

  async create(data) {
    const { data: medicine } = await api.post("/medicines", { ...data, status: data.status?.toUpperCase() || "ACTIVE" });
    return { ...medicine, status: medicine.status.toLowerCase() };
  },

  async update(id, data) {
    const { data: medicine } = await api.put(`/medicines/${id}`, { ...data, status: data.status?.toUpperCase() || "ACTIVE" });
    return { ...medicine, status: medicine.status.toLowerCase() };
  },

  async toggleStatus(id) {
    const { data: medicine } = await api.patch(`/medicines/${id}/toggle-status`);
    return { ...medicine, status: medicine.status.toLowerCase() };
  },

  // Get batches for a specific medicine
  async getBatches(medicineId) {
    const { data } = await api.get(`/medicines/${medicineId}/batches`);
    return data.map((batch) => ({ ...batch, medicineId: batch.medicine?.id }));
  },

  // Get dispensing history for a specific medicine
  async getDispensingHistory(medicineId) {
    const { data } = await api.get("/dispensing");
    return data.flatMap((transaction) => transaction.items
      .filter((item) => item.medicine?.id === Number(medicineId))
      .map((item) => ({ ...item, id: transaction.id, date: transaction.transactionDate, pharmacistName: transaction.pharmacist?.name, customerName: transaction.customerName, customerPhone: transaction.customerPhone })));
  },
};
