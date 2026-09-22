import { useNavigate } from "react-router-dom";
import { Home, Compass } from "lucide-react";
import Button from "../../components/ui/Button";

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-6">
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 rounded-full bg-brand-50 flex items-center justify-center mx-auto mb-4">
          <Compass className="w-8 h-8 text-brand-600" />
        </div>
        <h1 className="text-5xl font-bold text-slate-800">404</h1>
        <p className="mt-2 text-base text-slate-600">Page not found</p>
        <p className="mt-1 text-sm text-slate-500">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Button className="mt-6" onClick={() => navigate("/")}>
          <Home className="w-4 h-4" /> Go Home
        </Button>
      </div>
    </div>
  );
}
