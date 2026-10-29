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
    green: "bg-emerald-100 text-emerald-700",
    yellow: "bg-amber-100 text-amber-700",
    orange: "bg-orange-100 text-orange-700",
    red: "bg-red-100 text-red-700",
    blue: "bg-brand-100 text-brand-700",
    slate: "bg-slate-100 text-slate-700",
  };

  const colorKey = colorMap[type]?.[status] || "slate";
  const dotColors = {
    green: "bg-emerald-500",
    yellow: "bg-amber-500",
    orange: "bg-orange-500",
    red: "bg-red-500",
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
