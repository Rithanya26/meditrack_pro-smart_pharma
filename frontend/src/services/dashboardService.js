// Dashboard service — currently uses mock data, structured for Flask API replacement
// GET /api/dashboard
import {
  monthlyDispensingData,
  inventoryByCategoryData,
  stockStatusData,
  expiryDistributionData,
} from "../data/mockData";
import { mockMedicines, mockBatches, mockDispensing } from "../data/mockData";
import { daysUntilExpiry, getExpiryStatus, getStockStatus } from "../utils/helpers";

const MOCK_DELAY = 400;
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const dashboardService = {
  async getSummary() {
    await delay(MOCK_DELAY);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const totalMedicines = mockMedicines.filter((m) => m.status === "active").length;
    const totalStock = mockBatches.reduce((sum, b) => sum + b.quantity, 0);
    const lowStock = mockBatches.filter((b) => getStockStatus(b.quantity, b.minimumStock) === "Low Stock").length;
    const nearExpiry = mockBatches.filter((b) => {
      const days = daysUntilExpiry(b.expiryDate);
      const status = getExpiryStatus(days);
      return status === "Near Expiry" || status === "Critical";
    }).length;
    const expiredBatches = mockBatches.filter((b) => {
      const days = daysUntilExpiry(b.expiryDate);
      return getExpiryStatus(days) === "Expired";
    }).length;
    const todayDispensing = mockDispensing.filter((d) => {
      const dDate = new Date(d.date);
      dDate.setHours(0, 0, 0, 0);
      return dDate.getTime() === today.getTime();
    }).reduce((sum, d) => sum + d.quantity, 0);

    return {
      totalMedicines,
      totalStock,
      lowStock,
      nearExpiry,
      expiredBatches,
      todayDispensing,
    };
  },

  async getChartData() {
    await delay(MOCK_DELAY);
    return {
      monthlyDispensing: monthlyDispensingData,
      inventoryByCategory: inventoryByCategoryData,
      stockStatus: stockStatusData,
      expiryDistribution: expiryDistributionData,
    };
  },

  async getAlerts() {
    await delay(MOCK_DELAY);
    const lowStockAlerts = mockBatches
      .filter((b) => getStockStatus(b.quantity, b.minimumStock) === "Low Stock")
      .map((b) => {
        const med = mockMedicines.find((m) => m.id === b.medicineId);
        return { ...b, medicine: med };
      })
      .slice(0, 3);

    const nearExpiryAlerts = mockBatches
      .filter((b) => {
        const days = daysUntilExpiry(b.expiryDate);
        const status = getExpiryStatus(days);
        return status === "Near Expiry" || status === "Critical";
      })
      .map((b) => {
        const med = mockMedicines.find((m) => m.id === b.medicineId);
        return { ...b, medicine: med, daysRemaining: daysUntilExpiry(b.expiryDate) };
      })
      .slice(0, 3);

    const expiredAlerts = mockBatches
      .filter((b) => {
        const days = daysUntilExpiry(b.expiryDate);
        return getExpiryStatus(days) === "Expired";
      })
      .map((b) => {
        const med = mockMedicines.find((m) => m.id === b.medicineId);
        return { ...b, medicine: med, daysRemaining: daysUntilExpiry(b.expiryDate) };
      })
      .slice(0, 3);

    return { lowStockAlerts, nearExpiryAlerts, expiredAlerts };
  },
};
