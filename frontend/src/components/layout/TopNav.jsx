import { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Bell,
  Search,
  Menu,
  ChevronDown,
  AlertTriangle,
  CalendarClock,
  PackageX,
  Stethoscope,
  User,
  LogOut,
  Settings,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { mockNotifications } from "../../data/mockData";
import { formatDateTime, classNames } from "../../utils/helpers";

const pageTitles = {
  "/admin/dashboard": "Dashboard",
  "/admin/medicines": "Medicine Management",
  "/admin/batches": "Batch Management",
  "/admin/inventory": "Inventory Management",
  "/admin/dispensing": "Dispensing Records",
  "/admin/expiry": "Expiry Tracking",
  "/admin/pharmacists": "Pharmacist Management",
  "/admin/audit-logs": "Audit Logs",
  "/admin/reports": "Reports",
  "/admin/insights": "Smart Insights",
  "/admin/settings": "Settings",
  "/pharmacist/dashboard": "Pharmacist Dashboard",
  "/pharmacist/medicines": "Medicines",
  "/pharmacist/dispense": "Dispense Medicine",
  "/pharmacist/expiry-alerts": "Expiry Alerts",
  "/pharmacist/history": "Dispensing History",
};

const notifIcons = {
  low_stock: { icon: AlertTriangle, color: "text-warning-600 bg-warning-50" },
  near_expiry: { icon: CalendarClock, color: "text-yellow-600 bg-yellow-50" },
  expired: { icon: PackageX, color: "text-danger-600 bg-danger-50" },
  dispensing: { icon: Stethoscope, color: "text-brand-600 bg-brand-50" },
  inventory: { icon: PackageX, color: "text-purple-600 bg-purple-50" },
};

export default function TopNav({ onMenuClick }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const notifRef = useRef(null);
  const profileRef = useRef(null);

  const currentPath = location.pathname;
  const pageTitle = pageTitles[currentPath] || "MediTrack Pro";
  const unreadCount = mockNotifications.filter((n) => !n.read).length;

  useEffect(() => {
    function handleClickOutside(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-20 bg-white border-b border-slate-200 px-4 lg:px-6 py-3">
      <div className="flex items-center justify-between gap-4">
        {/* Left: menu + title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100"
          >
            <Menu className="w-5 h-5" />
          </button>
          <h2 className="text-lg font-semibold text-slate-800">{pageTitle}</h2>
        </div>

        {/* Right: search, notifications, profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Search — hidden on small screens */}
          <div className="hidden md:block relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search..."
              className="w-48 lg:w-64 pl-10 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:bg-white transition"
            />
          </div>

          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setNotifOpen(!notifOpen)}
              className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-danger-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-card-lg border border-slate-200 z-50 animate-fade-in max-h-96 overflow-y-auto">
                <div className="px-4 py-3 border-b border-slate-200">
                  <h3 className="text-sm font-semibold text-slate-800">Notifications</h3>
                  <p className="text-xs text-slate-500">{unreadCount} unread</p>
                </div>
                {mockNotifications.map((n) => {
                  const config = notifIcons[n.type] || notifIcons.low_stock;
                  const Icon = config.icon;
                  return (
                    <div
                      key={n.id}
                      className={classNames(
                        "flex items-start gap-3 px-4 py-3 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors cursor-pointer",
                        !n.read && "bg-brand-50/30"
                      )}
                    >
                      <div className={classNames("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0", config.color)}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800">{n.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{n.description}</p>
                        <p className="text-xs text-slate-400 mt-1">{formatDateTime(n.time)}</p>
                      </div>
                      {!n.read && <div className="w-2 h-2 rounded-full bg-brand-500 flex-shrink-0 mt-1.5" />}
                    </div>
                  );
                })}
                <div className="px-4 py-2 border-t border-slate-200">
                  <button className="w-full text-center text-sm text-brand-600 hover:text-brand-700 font-medium py-1">
                    View all notifications
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Profile */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2 p-1 sm:p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-sm font-semibold">
                {user?.avatar || "U"}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-semibold text-slate-800 leading-tight">{user?.name}</p>
                <p className="text-xs text-slate-500 capitalize leading-tight">{user?.role}</p>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>

            {profileOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-card-lg border border-slate-200 z-50 animate-fade-in">
                <div className="px-4 py-3 border-b border-slate-200">
                  <p className="text-sm font-semibold text-slate-800">{user?.name}</p>
                  <p className="text-xs text-slate-500">{user?.email}</p>
                  <span className="mt-1 inline-block text-xs font-medium text-brand-600 capitalize bg-brand-50 px-2 py-0.5 rounded-full">
                    {user?.role}
                  </span>
                </div>
                <div className="py-1">
                  <button className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors">
                    <User className="w-4 h-4" /> My Profile
                  </button>
                  <button
                    onClick={() => navigate(user?.role === "admin" ? "/admin/settings" : "/pharmacist/dashboard")}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    <Settings className="w-4 h-4" /> Settings
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-danger-600 hover:bg-danger-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" /> Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
