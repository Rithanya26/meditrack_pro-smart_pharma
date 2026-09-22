// Inventory service — currently uses mock data, structured for Flask API replacement
// GET /api/inventory, POST /api/inventory/adjust
import { mockBatches, mockMedicines } from "../data/mockData";
import { daysUntilExpiry, getExpiryStatus, getStockStatus } from "../utils/helpers";

const MOCK_DELAY = 400;
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const inventoryService = {
  async getAll() {
    await delay(MOCK_DELAY);
    return mockBatches.map((b) => {
      const medicine = mockMedicines.find((m) => m.id === b.medicineId);
      const days = daysUntilExpiry(b.expiryDate);
      const expiryStatus = getExpiryStatus(days);
      const stockStatus = getStockStatus(b.quantity, b.minimumStock);
      return {
        ...b,
        medicine,
        daysRemaining: days,
        expiryStatus,
        stockStatus,
      };
    });
  },

  async adjust(batchId, adjustment, reason, type) {
    await delay(MOCK_DELAY);
    const batch = mockBatches.find((b) => b.id === batchId);
    if (!batch) throw new Error("Batch not found");
    const prevQty = batch.quantity;
    let newQty;
    if (type === "add") {
      newQty = prevQty + adjustment;
    } else {
      newQty = prevQty - adjustment;
      if (newQty < 0) throw new Error("Cannot remove more than available stock");
    }
    batch.quantity = newQty;
    return { ...batch, previousQuantity: prevQty, newQuantity: newQty };
  },
};
