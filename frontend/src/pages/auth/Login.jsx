import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { HeartPulse, Eye, EyeOff, Mail, Lock, ArrowRight, ShieldCheck, Clock, BarChart3 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import Button from "../../components/ui/Button";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const toast = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!email.trim()) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Please enter a valid email";
    if (!password) e.password = "Password is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!validate()) return;

    setLoading(true);
    try {
      const user = await login(email, password);
      toast.success(`Welcome back, ${user.name.split(" ")[0]}!`);
      const from = location.state?.from?.pathname;
      if (from) {
        navigate(from, { replace: true });
      } else {
        navigate(user.role === "admin" ? "/admin/dashboard" : "/pharmacist/dashboard", { replace: true });
      }
    } catch (err) {
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (demoEmail) => {
    setEmail(demoEmail);
    setPassword("");
    setError("");
    setErrors({});
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side — branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-brand-700 via-brand-800 to-brand-950 relative overflow-hidden">
        {/* Decorative shapes */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500/10 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-brand-400/10 rounded-full translate-y-1/3 -translate-x-1/4" />
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
          backgroundSize: "32px 32px"
        }} />

        <div className="relative z-10 flex flex-col justify-between p-12 text-white w-full">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center border border-white/20">
              <HeartPulse className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">MediTrack Pro</h1>
              <p className="text-sm text-brand-200">Smart Pharma Audit & Expiry Tracking</p>
            </div>
          </div>

          {/* Middle content */}
          <div className="max-w-md">
            <h2 className="text-3xl font-bold leading-tight">
              Pharmacy inventory, expiry tracking, and audit logging — all in one place.
            </h2>
            <p className="mt-4 text-brand-100 text-lg leading-relaxed">
              Manage medicines, monitor batch expiry with FEFO logic, track dispensing, and maintain complete audit trails for your pharmacy.
            </p>

            <div className="mt-8 space-y-3">
              {[
                { icon: ShieldCheck, text: "Role-based access for admins and pharmacists" },
                { icon: Clock, text: "Real-time expiry alerts and batch tracking" },
                { icon: BarChart3, text: "Comprehensive audit logs and reports" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-white/10 backdrop-blur flex items-center justify-center border border-white/10">
                    <item.icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-sm text-brand-50">{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <p className="text-sm text-brand-200">
            © 2026 MediTrack Pro. Built for BTech Final Year Project.
          </p>
        </div>
      </div>

      {/* Right side — login form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-white">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-11 h-11 rounded-xl bg-brand-600 flex items-center justify-center">
              <HeartPulse className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">MediTrack Pro</h1>
              <p className="text-sm text-brand-600">Smart Pharma Audit & Expiry Tracking</p>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-slate-800">Welcome back</h2>
          <p className="mt-1 text-sm text-slate-500">Sign in to your account to continue.</p>

          {error && (
            <div className="mt-4 px-4 py-3 rounded-lg bg-danger-50 border border-danger-200 text-sm text-danger-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="label">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@meditrack.com"
                  className={`input pl-10 ${errors.email ? "border-danger-500" : ""}`}
                  autoComplete="email"
                />
              </div>
              {errors.email && <p className="mt-1 text-xs text-danger-600">{errors.email}</p>}
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className={`input pl-10 pr-10 ${errors.password ? "border-danger-500" : ""}`}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-danger-600">{errors.password}</p>}
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                />
                Remember me
              </label>
              <button type="button" className="text-sm text-brand-600 hover:text-brand-700 font-medium">
                Forgot password?
              </button>
            </div>

            <Button type="submit" size="lg" loading={loading} className="w-full">
              Sign In <ArrowRight className="w-4 h-4" />
            </Button>
          </form>

          {/* Demo accounts */}
          <div className="mt-8 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Demo Accounts</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => fillDemo("admin@meditrack.com")}
                className="text-left px-3 py-2 rounded-lg bg-white border border-slate-200 hover:border-brand-300 hover:bg-brand-50/50 transition group"
              >
                <p className="text-sm font-medium text-slate-700 group-hover:text-brand-700">Admin</p>
                <p className="text-xs text-slate-400">admin@meditrack.com</p>
              </button>
              <button
                onClick={() => fillDemo("pharmacist@meditrack.com")}
                className="text-left px-3 py-2 rounded-lg bg-white border border-slate-200 hover:border-brand-300 hover:bg-brand-50/50 transition group"
              >
                <p className="text-sm font-medium text-slate-700 group-hover:text-brand-700">Pharmacist</p>
                <p className="text-xs text-slate-400">pharmacist@meditrack.com</p>
              </button>
            </div>
            <p className="mt-2 text-xs text-slate-400">Click to autofill email, then enter password.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
