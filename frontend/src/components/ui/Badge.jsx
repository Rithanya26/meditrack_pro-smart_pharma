import { classNames } from "../../utils/helpers";

export default function Badge({ children, color = "slate", className = "" }) {
  const colors = {
    slate: "bg-slate-100 text-slate-700",
    green: "bg-success-100 text-success-700",
    yellow: "bg-yellow-100 text-yellow-700",
    orange: "bg-orange-100 text-orange-700",
    red: "bg-danger-100 text-danger-700",
    blue: "bg-brand-100 text-brand-700",
    purple: "bg-purple-100 text-purple-700",
  };
  return (
    <span className={classNames("badge", colors[color], className)}>
      {children}
    </span>
  );
}
