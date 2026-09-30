import api from "./api";
import { daysUntilExpiry, getExpiryStatus, getStockStatus } from "../utils/helpers";

export const inventoryService = {
  async getAll() {
    const { data } = await api.get("/batches");
    return data.map((b) => {
      const medicine = b.medicine;
      const days = daysUntilExpiry(b.expiryDate);
      const expiryStatus = getExpiryStatus(days);
      const stockStatus = getStockStatus(b.quantity, b.minimumStock);
      return {
        ...b,
        medicineId: medicine?.id,
        medicine,
        daysRemaining: days,
        expiryStatus,
        stockStatus,
      };
    });
  },

  async adjust(batchId, adjustment, reason, type) {
    const { data } = await api.patch(`/inventory/${batchId}/adjust`, { adjustment, reason, type });
    return data;
  },
};
