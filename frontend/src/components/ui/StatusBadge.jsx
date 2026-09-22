import { classNames } from "../../utils/helpers";

export function StatusBadge({ status, type = "stock" }) {
  const colorMap = {
    stock: {
      "Healthy": "green",
      "Low Stock": "yellow",
      "Out of Stock": "red",
    },
    expiry: {
      "Safe": "green",
      "Near Expiry": "yellow",
      "Critical": "orange",
      "Expired": "red",
    },
    active: {
      "active": "green",
      "inactive": "red",
    },
    completed: {
      "completed": "green",
      "pending": "yellow",
      "failed": "red",
    },
  };

  const colors = {
    green: "bg-success-100 text-success-700",
    yellow: "bg-yellow-100 text-yellow-700",
    orange: "bg-orange-100 text-orange-700",
    red: "bg-danger-100 text-danger-700",
    blue: "bg-brand-100 text-brand-700",
    slate: "bg-slate-100 text-slate-700",
  };

  const colorKey = colorMap[type]?.[status] || "slate";
  const dotColors = {
    green: "bg-success-500",
    yellow: "bg-yellow-500",
    orange: "bg-orange-500",
    red: "bg-danger-500",
    blue: "bg-brand-500",
    slate: "bg-slate-400",
  };

  return (
    <span className={classNames("badge", colors[colorKey])}>
      <span className={classNames("w-1.5 h-1.5 rounded-full", dotColors[colorKey])} />
      {status}
    </span>
  );
}
