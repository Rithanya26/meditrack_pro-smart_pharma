// Batch service — currently uses mock data, structured for Flask API replacement
// GET /api/batches, POST /api/batches, PUT /api/batches/:id
import { mockBatches, mockMedicines } from "../data/mockData";

const MOCK_DELAY = 400;
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const batchService = {
  async getAll() {
    await delay(MOCK_DELAY);
    return mockBatches.map((b) => ({
      ...b,
      medicine: mockMedicines.find((m) => m.id === b.medicineId),
    }));
  },

  async getById(id) {
    await delay(MOCK_DELAY);
    const batch = mockBatches.find((b) => b.id === id);
    if (!batch) return null;
    return { ...batch, medicine: mockMedicines.find((m) => m.id === batch.medicineId) };
  },

  async getByMedicine(medicineId) {
    await delay(MOCK_DELAY);
    return mockBatches
      .filter((b) => b.medicineId === medicineId)
      .map((b) => ({ ...b, medicine: mockMedicines.find((m) => m.id === b.medicineId) }));
  },

  async create(data) {
    await delay(MOCK_DELAY);
    const newBatch = {
      ...data,
      id: `BAT-${String(mockBatches.length + 1).padStart(3, "0")}`,
    };
    mockBatches.push(newBatch);
    return newBatch;
  },

  async update(id, data) {
    await delay(MOCK_DELAY);
    const idx = mockBatches.findIndex((b) => b.id === id);
    if (idx === -1) throw new Error("Batch not found");
    mockBatches[idx] = { ...mockBatches[idx], ...data };
    return mockBatches[idx];
  },
};
