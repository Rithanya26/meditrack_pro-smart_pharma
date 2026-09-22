// Expiry status thresholds (days) — reusable so backend config can override later
export const EXPIRY_THRESHOLDS = {
  SAFE: 90,
  NEAR_EXPIRY: 30,
  CRITICAL: 0,
};

export const EXPIRY_STATUS = {
  SAFE: "Safe",
  NEAR_EXPIRY: "Near Expiry",
  CRITICAL: "Critical",
  EXPIRED: "Expired",
};

/**
 * Calculate days remaining until expiry from a date string.
 * @param {string} expiryDate - ISO date string
 * @returns {number}
 */
export function daysUntilExpiry(expiryDate) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);
  const diff = expiry - now;
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

/**
 * Determine expiry status based on days remaining.
 * @param {number} days
 * @returns {string}
 */
export function getExpiryStatus(days) {
  if (days <= EXPIRY_THRESHOLDS.CRITICAL) return EXPIRY_STATUS.EXPIRED;
  if (days <= EXPIRY_THRESHOLDS.NEAR_EXPIRY) return EXPIRY_STATUS.CRITICAL;
  if (days <= EXPIRY_THRESHOLDS.SAFE) return EXPIRY_STATUS.NEAR_EXPIRY;
  return EXPIRY_STATUS.SAFE;
}

export function calculateExpiryRisk({ dailyDosage, treatmentDays, daysRemaining, availableQuantity }) {
  const dosage = Number(dailyDosage);
  const duration = Number(treatmentDays);
  const days = Number(daysRemaining);
  const stock = Number(availableQuantity);

  if (![dosage, duration, days, stock].every(Number.isFinite) || dosage <= 0 || duration <= 0) {
    return null;
  }

  const requiredQuantity = Math.ceil(dosage * duration);
  const estimatedConsumption = Math.min(stock, Math.floor(dosage * Math.max(days, 0)));
  const quantityAffected = Math.max(0, requiredQuantity - estimatedConsumption);
  const conflict = days < duration;
  const riskLevel = days <= 7 && conflict
    ? "CRITICAL"
    : conflict
      ? "HIGH"
      : days <= 90
        ? "MEDIUM"
        : "LOW";

  return {
    dailyDosage: dosage,
    treatmentDays: duration,
    daysRemaining: days,
    requiredQuantity,
    estimatedConsumption,
    quantityAffected,
    conflict,
    riskLevel,
  };
}

export function expiryStatusColor(status) {
  const map = {
    [EXPIRY_STATUS.SAFE]: "bg-success-100 text-success-700",
    [EXPIRY_STATUS.NEAR_EXPIRY]: "bg-yellow-100 text-yellow-700",
    [EXPIRY_STATUS.CRITICAL]: "bg-orange-100 text-orange-700",
    [EXPIRY_STATUS.EXPIRED]: "bg-danger-100 text-danger-700",
  };
  return map[status] || "bg-slate-100 text-slate-700";
}

export const STOCK_STATUS = {
  HEALTHY: "Healthy",
  LOW: "Low Stock",
  OUT: "Out of Stock",
};

export function getStockStatus(available, minimum) {
  if (available <= 0) return STOCK_STATUS.OUT;
  if (available <= minimum) return STOCK_STATUS.LOW;
  return STOCK_STATUS.HEALTHY;
}

export function stockStatusColor(status) {
  const map = {
    [STOCK_STATUS.HEALTHY]: "bg-success-100 text-success-700",
    [STOCK_STATUS.LOW]: "bg-yellow-100 text-yellow-700",
    [STOCK_STATUS.OUT]: "bg-danger-100 text-danger-700",
  };
  return map[status] || "bg-slate-100 text-slate-700";
}

export function formatDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }) + ", " + d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export function formatTime(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export function formatNumber(num) {
  return new Intl.NumberFormat("en-US").format(num);
}

export function generateTransactionId() {
  const now = new Date();
  const date = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  const random = String(Math.floor(Math.random() * 10000)).padStart(4, "0");
  return `TRX-${date}-${random}`;
}

export function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}
