// Medicine service — currently uses mock data, structured for Flask API replacement
// GET /api/medicines, POST /api/medicines, PUT /api/medicines/:id
import { mockMedicines, mockBatches, mockDispensing, mockDispensingTransactions } from "../data/mockData";

const MOCK_DELAY = 400;
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const medicineService = {
  async getAll() {
    await delay(MOCK_DELAY);
    return [...mockMedicines];
  },

  async getById(id) {
    await delay(MOCK_DELAY);
    return mockMedicines.find((m) => m.id === id) || null;
  },

  async create(data) {
    await delay(MOCK_DELAY);
    const newMed = {
      ...data,
      id: `MED-${String(mockMedicines.length + 1).padStart(3, "0")}`,
      createdAt: new Date().toISOString(),
    };
    mockMedicines.push(newMed);
    return newMed;
  },

  async update(id, data) {
    await delay(MOCK_DELAY);
    const idx = mockMedicines.findIndex((m) => m.id === id);
    if (idx === -1) throw new Error("Medicine not found");
    mockMedicines[idx] = { ...mockMedicines[idx], ...data };
    return mockMedicines[idx];
  },

  async toggleStatus(id) {
    await delay(MOCK_DELAY);
    const idx = mockMedicines.findIndex((m) => m.id === id);
    if (idx === -1) throw new Error("Medicine not found");
    mockMedicines[idx].status = mockMedicines[idx].status === "active" ? "inactive" : "active";
    return mockMedicines[idx];
  },

  // Get batches for a specific medicine
  async getBatches(medicineId) {
    await delay(MOCK_DELAY);
    return mockBatches.filter((b) => b.medicineId === medicineId);
  },

  // Get dispensing history for a specific medicine
  async getDispensingHistory(medicineId) {
    await delay(MOCK_DELAY);
    const legacy = mockDispensing.filter((d) => d.medicineId === medicineId);
    const grouped = mockDispensingTransactions.flatMap((transaction) => transaction.items
      .filter((item) => item.medicineId === medicineId)
      .map((item) => ({
        ...item,
        id: transaction.id,
        date: transaction.date,
        pharmacistName: transaction.pharmacistName,
        customerName: transaction.customerName,
        customerPhone: transaction.customerPhone,
      })));
    return [...legacy, ...grouped];
  },
};
