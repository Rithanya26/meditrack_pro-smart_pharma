import api from "./api";

function normalizeMedicine(medicine) {
  if (!medicine) return medicine;
  const brandName = medicine.brandName || medicine.name || "";
  const genericMedicine = medicine.genericMedicine || medicine.genericName || "";
  return {
    ...medicine,
    brandName,
    genericMedicine,
    name: brandName,
    genericName: genericMedicine,
    status: medicine.status ? medicine.status.toLowerCase() : "active",
  };
}

export const medicineService = {
  async getAll() {
    const { data } = await api.get("/medicines");
    return data.map(normalizeMedicine);
  },

  async getById(id) {
    const { data } = await api.get(`/medicines/${id}`);
    return normalizeMedicine(data);
  },

  async create(data) {
    const brandName = (data.brandName || data.name || "").trim();
    const genericMedicine = (data.genericMedicine || data.genericName || "").trim();
    const payload = {
      ...data,
      name: brandName,
      brandName,
      genericName: genericMedicine,
      genericMedicine,
      category: data.category || "General",
      status: data.status ? data.status.toUpperCase() : "ACTIVE",
    };
    const { data: medicine } = await api.post("/medicines", payload);
    return normalizeMedicine(medicine);
  },

  async update(id, data) {
    const brandName = (data.brandName || data.name || "").trim();
    const genericMedicine = (data.genericMedicine || data.genericName || "").trim();
    const payload = {
      ...data,
      name: brandName,
      brandName,
      genericName: genericMedicine,
      genericMedicine,
      category: data.category || "General",
      status: data.status ? data.status.toUpperCase() : "ACTIVE",
    };
    const { data: medicine } = await api.put(`/medicines/${id}`, payload);
    return normalizeMedicine(medicine);
  },

  async toggleStatus(id) {
    const { data: medicine } = await api.patch(`/medicines/${id}/toggle-status`);
    return normalizeMedicine(medicine);
  },

  // Get batches for a specific medicine
  async getBatches(medicineId) {
    const { data } = await api.get(`/medicines/${medicineId}/batches`);
    return data.map((batch) => ({ ...batch, medicineId: batch.medicine?.id }));
  },

  // Get dispensing history for a specific medicine
  async getDispensingHistory(medicineId) {
    const { data } = await api.get("/dispensing");
    return data.flatMap((transaction) =>
      (transaction.items || [])
        .filter((item) => item.medicine?.id === Number(medicineId))
        .map((item) => ({
          ...item,
          id: transaction.id,
          date: transaction.transactionDate,
          pharmacistName: transaction.pharmacist?.name,
          customerName: transaction.customerName,
          customerPhone: transaction.customerPhone,
        }))
    );
  },
};

