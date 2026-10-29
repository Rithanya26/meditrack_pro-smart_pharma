import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Pill,
  Package,
  Boxes,
  Stethoscope,
  CalendarClock,
  Users,
  ScrollText,
  FileBarChart,
  Lightbulb,
  ShoppingCart,
  Truck,
  Settings,
  LogOut,
  HeartPulse,
  X,
  Sparkles,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { classNames } from "../../utils/helpers";

const adminNav = [
  { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/assistant", label: "AI Assistant", icon: Sparkles, badge: "AI" },
  { to: "/admin/medicines", label: "Medicine Catalog", icon: Pill },
  { to: "/admin/batches", label: "Medicine Batches", icon: Package },
  { to: "/admin/inventory", label: "Stock & Inventory", icon: Boxes },
  { to: "/admin/dispensing", label: "Dispensing Records", icon: Stethoscope },
  { to: "/admin/expiry", label: "Expiry Tracking", icon: CalendarClock },
  { to: "/admin/pharmacists", label: "Pharmacist Accounts", icon: Users },
  { to: "/admin/audit-logs", label: "Audit Log", icon: ScrollText },
  { to: "/admin/reports", label: "Reports", icon: FileBarChart },
  { to: "/admin/insights", label: "Demand Forecasting", icon: Lightbulb },
  { to: "/admin/reorder", label: "Reorder Stock", icon: ShoppingCart },
  { to: "/admin/order-received", label: "Receive Supplier Orders", icon: Truck },
  { to: "/admin/settings", label: "Settings", icon: Settings },
];

const pharmacistNav = [
  { to: "/pharmacist/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/pharmacist/assistant", label: "AI Assistant", icon: Sparkles, badge: "AI" },
  { to: "/pharmacist/medicines", label: "Medicine Catalog", icon: Pill },
  { to: "/pharmacist/dispense", label: "Dispense Medicine", icon: Stethoscope },
  { to: "/pharmacist/expiry-alerts", label: "Expiry Alerts", icon: CalendarClock },
  { to: "/pharmacist/history", label: "My Dispensing History", icon: ScrollText },
];

export default function Sidebar({ open, onClose }) {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const navItems = isAdmin ? adminNav : pharmacistNav;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={classNames(
          "fixed lg:sticky top-0 left-0 z-40 h-screen w-64 bg-slate-50 border-r border-slate-200 shadow-sm flex flex-col transition-transform lg:translate-x-0 print:hidden",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-4 border-b-2 border-slate-300">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-emerald-700 flex items-center justify-center">
              <HeartPulse className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 leading-tight">MediTrack</h1>
              <p className="text-xs text-slate-500 font-medium leading-tight">Pharmacy Management</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close navigation menu"
            className="lg:hidden text-slate-500 hover:text-slate-900"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <p className="px-3 mb-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
            {isAdmin ? "Pharmacy Administration" : "Pharmacy Workspace"}
          </p>
          <ul className="space-y-0.5">
            {navItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  onClick={onClose}
                  className={({ isActive }) =>
                    classNames(
                      "flex items-center justify-between px-3 py-2.5 rounded-lg border-l-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900",
                      isActive
                        ? "bg-emerald-50 text-emerald-900 border-emerald-700 ring-1 ring-emerald-100"
                        : "text-slate-700 border-transparent hover:bg-slate-100 hover:text-slate-950"
                    )
                  }
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="w-5 h-5 flex-shrink-0 text-current" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-900">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* User profile & logout */}
        <div className="border-t-2 border-slate-300 p-3">
          <div className="flex items-center gap-3 px-2 py-2 mb-2">
            <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-900 flex items-center justify-center text-sm font-bold">
              {user?.avatar || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">{user?.name}</p>
              <p className="text-xs font-medium text-slate-600 capitalize">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
