import { useNavigate } from "react-router-dom";
import { Home, ShieldAlert } from "lucide-react";
import Button from "../../components/ui/Button";

export default function Unauthorized() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-6">
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 rounded-full bg-danger-50 flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-8 h-8 text-danger-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-800">Access Denied</h1>
        <p className="mt-2 text-sm text-slate-500">
          You don&apos;t have permission to access this page. Please contact your administrator if you believe this is an error.
        </p>
        <Button className="mt-6" onClick={() => navigate("/")}>
          <Home className="w-4 h-4" /> Go Home
        </Button>
      </div>
    </div>
  );
}
