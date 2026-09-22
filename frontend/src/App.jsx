import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import { AdminRoute, PharmacistRoute } from "./routes/ProtectedRoute";
import DashboardLayout from "./layouts/DashboardLayout";

import Login from "./pages/auth/Login";
import Unauthorized from "./pages/shared/Unauthorized";
import NotFound from "./pages/shared/NotFound";

import AdminDashboard from "./pages/admin/AdminDashboard";
import MedicineManagement from "./pages/admin/MedicineManagement";
import MedicineDetails from "./pages/admin/MedicineDetails";
import BatchManagement from "./pages/admin/BatchManagement";
import InventoryManagement from "./pages/admin/InventoryManagement";
import DispensingRecords from "./pages/admin/DispensingRecords";
import ExpiryTracking from "./pages/admin/ExpiryTracking";
import PharmacistManagement from "./pages/admin/PharmacistManagement";
import AuditLogs from "./pages/admin/AuditLogs";
import Reports from "./pages/admin/Reports";
import SmartInsights from "./pages/admin/SmartInsights";
import Settings from "./pages/admin/Settings";

import PharmacistDashboard from "./pages/pharmacist/PharmacistDashboard";
import PharmacistMedicines from "./pages/pharmacist/PharmacistMedicines";
import DispenseMedicine from "./pages/pharmacist/DispenseMedicine";
import ExpiryAlerts from "./pages/pharmacist/ExpiryAlerts";
import DispensingHistory from "./pages/pharmacist/DispensingHistory";

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/unauthorized" element={<Unauthorized />} />

            {/* Admin routes */}
            <Route element={<AdminRoute><DashboardLayout /></AdminRoute>}>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/medicines" element={<MedicineManagement />} />
              <Route path="/admin/medicines/:id" element={<MedicineDetails />} />
              <Route path="/admin/batches" element={<BatchManagement />} />
              <Route path="/admin/inventory" element={<InventoryManagement />} />
              <Route path="/admin/dispensing" element={<DispensingRecords />} />
              <Route path="/admin/expiry" element={<ExpiryTracking />} />
              <Route path="/admin/pharmacists" element={<PharmacistManagement />} />
              <Route path="/admin/audit-logs" element={<AuditLogs />} />
              <Route path="/admin/reports" element={<Reports />} />
              <Route path="/admin/insights" element={<SmartInsights />} />
              <Route path="/admin/settings" element={<Settings />} />
            </Route>

            {/* Pharmacist routes */}
            <Route element={<PharmacistRoute><DashboardLayout /></PharmacistRoute>}>
              <Route path="/pharmacist/dashboard" element={<PharmacistDashboard />} />
              <Route path="/pharmacist/medicines" element={<PharmacistMedicines />} />
              <Route path="/pharmacist/dispense" element={<DispenseMedicine />} />
              <Route path="/pharmacist/expiry-alerts" element={<ExpiryAlerts />} />
              <Route path="/pharmacist/history" element={<DispensingHistory />} />
            </Route>

            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
