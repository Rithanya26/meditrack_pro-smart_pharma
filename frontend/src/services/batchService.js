import api from "./api";

function normalizeBatch(batch) {
  return { ...batch, medicineId: batch.medicine?.id, medicine: batch.medicine };
}

export const batchService = {
  async getAll() {
    const { data } = await api.get("/batches");
    return data.map(normalizeBatch);
  },

  async getById(id) {
    const { data } = await api.get(`/batches/${id}`);
    return normalizeBatch(data);
  },

  async getByMedicine(medicineId) {
    const { data } = await api.get(`/medicines/${medicineId}/batches`);
    return data.map(normalizeBatch);
  },

  async create(data) {
    const { data: batch } = await api.post("/batches", { ...data, medicine: { id: Number(data.medicineId) } });
    return normalizeBatch(batch);
  },

  async update(id, data) {
    const { data: batch } = await api.put(`/batches/${id}`, { ...data, medicine: { id: Number(data.medicineId) } });
    return normalizeBatch(batch);
  },
};
