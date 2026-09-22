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
  Settings,
  LogOut,
  HeartPulse,
  X,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { classNames } from "../../utils/helpers";

const adminNav = [
  { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/medicines", label: "Medicines", icon: Pill },
  { to: "/admin/batches", label: "Batches", icon: Package },
  { to: "/admin/inventory", label: "Inventory", icon: Boxes },
  { to: "/admin/dispensing", label: "Dispensing", icon: Stethoscope },
  { to: "/admin/expiry", label: "Expiry Tracking", icon: CalendarClock },
  { to: "/admin/pharmacists", label: "Pharmacists", icon: Users },
  { to: "/admin/audit-logs", label: "Audit Logs", icon: ScrollText },
  { to: "/admin/reports", label: "Reports", icon: FileBarChart },
  { to: "/admin/insights", label: "Smart Insights", icon: Lightbulb },
  { to: "/admin/settings", label: "Settings", icon: Settings },
];

const pharmacistNav = [
  { to: "/pharmacist/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/pharmacist/medicines", label: "Medicines", icon: Pill },
  { to: "/pharmacist/dispense", label: "Dispense Medicine", icon: Stethoscope },
  { to: "/pharmacist/expiry-alerts", label: "Expiry Alerts", icon: CalendarClock },
  { to: "/pharmacist/history", label: "Dispensing History", icon: ScrollText },
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
          className="fixed inset-0 bg-slate-900/50 z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={classNames(
          "fixed lg:sticky top-0 left-0 z-40 h-screen w-64 bg-white border-r border-slate-200 flex flex-col transition-transform lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-brand-600 flex items-center justify-center">
              <HeartPulse className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-800 leading-tight">MediTrack</h1>
              <p className="text-xs text-brand-600 font-medium leading-tight">Pro</p>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <p className="px-3 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            {isAdmin ? "Administration" : "Pharmacy"}
          </p>
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  onClick={onClose}
                  className={({ isActive }) =>
                    classNames(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                      isActive
                        ? "bg-brand-50 text-brand-700"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    )
                  }
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* User profile & logout */}
        <div className="border-t border-slate-200 p-3">
          <div className="flex items-center gap-3 px-2 py-2 mb-2">
            <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-sm font-semibold">
              {user?.avatar || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-800 truncate">{user?.name}</p>
              <p className="text-xs text-slate-500 capitalize">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-danger-600 hover:bg-danger-50 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
