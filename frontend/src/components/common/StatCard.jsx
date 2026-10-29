import { TrendingUp, TrendingDown } from "lucide-react";
import { classNames } from "../../utils/helpers";

export default function StatCard({ icon: Icon, label, value, trend, trendLabel, color = "blue" }) {
  const colorClasses = {
    blue: "bg-brand-100 text-brand-600",
    green: "bg-emerald-100 text-emerald-600",
    yellow: "bg-amber-100 text-amber-600",
    orange: "bg-orange-100 text-orange-600",
    red: "bg-red-100 text-red-600",
    purple: "bg-purple-100 text-purple-600",
  };

  const trendUp = trend && trend > 0;

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-bold text-slate-800">{value}</p>
          {trendLabel && (
            <div className="mt-2 flex items-center gap-1 text-xs">
              {trend !== undefined && (
                <span className={classNames("flex items-center gap-0.5 font-medium", trendUp ? "text-emerald-600" : "text-red-600")}>
                  {trendUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {Math.abs(trend)}
                </span>
              )}
              <span className="text-slate-500">{trendLabel}</span>
            </div>
          )}
        </div>
        <div className={classNames("w-12 h-12 rounded-xl flex items-center justify-center", colorClasses[color])}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}
