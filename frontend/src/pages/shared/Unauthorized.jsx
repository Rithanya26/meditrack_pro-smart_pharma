import { useNavigate } from "react-router-dom";
import { Home, ShieldAlert, LogOut } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import Button from "../../components/ui/Button";

export default function Unauthorized() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const role = user?.role?.toLowerCase();

  const handleGoDashboard = () => {
    if (!isAuthenticated || !user) {
      navigate("/login", { replace: true });
    } else if (role === "admin") {
      navigate("/admin/dashboard", { replace: true });
    } else {
      navigate("/pharmacist/dashboard", { replace: true });
    }
  };

  const handleSwitchAccount = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-6">
      <div className="max-w-md w-full text-center bg-white p-8 rounded-2xl shadow-card border border-slate-200">
        <div className="w-16 h-16 rounded-full bg-danger-50 flex items-center justify-center mx-auto mb-4 border border-danger-100">
          <ShieldAlert className="w-8 h-8 text-danger-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-800">Access Denied</h1>
        <p className="mt-2 text-sm text-slate-500 leading-relaxed">
          You don&apos;t have permission to access this page. Please contact your administrator if you believe this is an error.
        </p>

        {user && (
          <div className="mt-4 px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 inline-block">
            Logged in as: <span className="font-semibold text-slate-800">{user.name}</span>{" "}
            (<span className="capitalize font-medium text-brand-700">{user.role}</span>)
          </div>
        )}

        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button onClick={handleGoDashboard} className="w-full sm:w-auto">
            <Home className="w-4 h-4" /> Go to Dashboard
          </Button>
          <Button variant="outline" onClick={handleSwitchAccount} className="w-full sm:w-auto">
            <LogOut className="w-4 h-4" /> Switch Account
          </Button>
        </div>
      </div>
    </div>
  );
}
