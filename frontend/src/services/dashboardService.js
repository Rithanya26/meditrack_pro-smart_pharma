import { medicineService } from "./medicineService";
import { batchService } from "./batchService";
import { dispensingService } from "./dispensingService";
import { daysUntilExpiry, getExpiryStatus, getStockStatus } from "../utils/helpers";

const chartColors = ["#2487eb", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4"];
const stockColors = { "Healthy": "#10b981", "Low Stock": "#f59e0b", "Out of Stock": "#ef4444" };
const expiryColors = { Safe: "#10b981", "Near Expiry": "#f59e0b", Critical: "#f97316", Expired: "#ef4444" };

export const dashboardService = {
  async getSummary() {
    const [medicines, batches, transactions] = await Promise.all([
      medicineService.getAll(), batchService.getAll(), dispensingService.getTransactions(),
    ]);
    const today = new Date().toDateString();
    const activeMedicines = medicines.filter((medicine) => medicine.status === "active");
    const nearExpiry = batches.filter((b) => {
      const days = daysUntilExpiry(b.expiryDate);
      const status = getExpiryStatus(days);
      return status === "Near Expiry" || status === "Critical";
    }).length;
    const expiredBatches = batches.filter((b) => getExpiryStatus(daysUntilExpiry(b.expiryDate)) === "Expired").length;
    const todayDispensing = transactions.filter((transaction) => new Date(transaction.date).toDateString() === today)
      .reduce((sum, transaction) => sum + transaction.totalQuantity, 0);

    return {
      totalMedicines: activeMedicines.length,
      totalStock: batches.reduce((sum, batch) => sum + batch.quantity, 0),
      lowStock: batches.filter((b) => getStockStatus(b.quantity, b.minimumStock) === "Low Stock").length,
      nearExpiry,
      expiredBatches,
      todayDispensing,
    };
  },

  async getChartData() {
    const [batches, transactions] = await Promise.all([batchService.getAll(), dispensingService.getTransactions()]);
    const now = new Date();
    const monthlyDispensing = Array.from({ length: 12 }, (_, index) => {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - 11 + index, 1);
      return {
        key: `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, "0")}`,
        month: monthDate.toLocaleDateString(undefined, { month: "short", year: "2-digit" }),
        quantity: 0,
      };
    });
    const monthlyTotals = new Map(monthlyDispensing.map((month) => [month.key, month]));
    transactions.forEach((transaction) => {
      const dateValue = String(transaction.date || "");
      const dateMatch = dateValue.match(/^(\d{4})-(\d{2})/);
      const transactionDate = dateMatch ? null : new Date(dateValue);
      const year = dateMatch ? Number(dateMatch[1]) : transactionDate?.getFullYear();
      const month = dateMatch ? Number(dateMatch[2]) : transactionDate?.getMonth() + 1;
      if (!year || !month || month < 1 || month > 12) return;

      const monthData = monthlyTotals.get(`${year}-${String(month).padStart(2, "0")}`);
      if (!monthData) return;

      const totalQuantity = Number(transaction.totalQuantity);
      const hasTotalQuantity = transaction.totalQuantity !== null
        && transaction.totalQuantity !== undefined
        && transaction.totalQuantity !== "";
      const quantity = hasTotalQuantity && Number.isFinite(totalQuantity)
        ? totalQuantity
        : (transaction.items || []).reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
      monthData.quantity += quantity;
    });
    const groupedCategories = batches.reduce((groups, batch) => {
      const category = batch.medicine?.category || "Other";
      groups[category] = (groups[category] || 0) + batch.quantity;
      return groups;
    }, {});
    const categoryTotals = Object.entries(groupedCategories).map(([name, value], index) => ({ name, value, color: chartColors[index % chartColors.length] }));
    const statusGroups = batches.reduce((groups, batch) => { const status = getStockStatus(batch.quantity, batch.minimumStock); groups[status] = (groups[status] || 0) + 1; return groups; }, {});
    return {
      monthlyDispensing,
      inventoryByCategory: categoryTotals,
      stockStatus: Object.entries(statusGroups).map(([name, value]) => ({ name, value, color: stockColors[name] })),
      expiryDistribution: ["Safe", "Near Expiry", "Critical", "Expired"].map((name) => ({ name, color: expiryColors[name], value: batches.filter((b) => getExpiryStatus(daysUntilExpiry(b.expiryDate)) === name).length })),
    };
  },

  async getAlerts() {
    const batches = await batchService.getAll();
    const lowStockAlerts = batches
      .filter((b) => getStockStatus(b.quantity, b.minimumStock) === "Low Stock")
      .map((b) => {
        return b;
      })
      .slice(0, 3);

    const nearExpiryAlerts = batches
      .filter((b) => {
        const days = daysUntilExpiry(b.expiryDate);
        const status = getExpiryStatus(days);
        return status === "Near Expiry" || status === "Critical";
      })
      .map((b) => {
        return { ...b, daysRemaining: daysUntilExpiry(b.expiryDate) };
      })
      .slice(0, 3);

    const expiredAlerts = batches
      .filter((b) => {
        const days = daysUntilExpiry(b.expiryDate);
        return getExpiryStatus(days) === "Expired";
      })
      .map((b) => {
        return { ...b, daysRemaining: daysUntilExpiry(b.expiryDate) };
      })
      .slice(0, 3);

    return { lowStockAlerts, nearExpiryAlerts, expiredAlerts };
  },
};
