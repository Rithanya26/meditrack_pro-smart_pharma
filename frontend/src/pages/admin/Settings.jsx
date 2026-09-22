import { useState } from "react";
import { User, Shield, Bell, CalendarClock, Save } from "lucide-react";
import PageHeader from "../../components/common/PageHeader";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { useToast } from "../../context/ToastContext";
import { useAuth } from "../../context/AuthContext";
import { EXPIRY_THRESHOLDS } from "../../utils/helpers";

export default function Settings() {
  const toast = useToast();
  const { user } = useAuth();

  const [profile, setProfile] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
  });

  const [security, setSecurity] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [thresholds, setThresholds] = useState({
    nearExpiry: EXPIRY_THRESHOLDS.SAFE,
    criticalExpiry: EXPIRY_THRESHOLDS.NEAR_EXPIRY,
    minStockDefault: 30,
  });

  const [notifications, setNotifications] = useState({
    lowStock: true,
    nearExpiry: true,
    expired: true,
    dispensing: false,
    inventory: true,
  });

  const [saving, setSaving] = useState(null);

  function saveSection(section) {
    setSaving(section);
    setTimeout(() => {
      setSaving(null);
      toast.success("Settings updated successfully.");
    }, 500);
  }

  const sections = [
    { id: "profile", icon: User, label: "Profile", color: "blue" },
    { id: "security", icon: Shield, label: "Security", color: "slate" },
    { id: "thresholds", icon: CalendarClock, label: "Expiry Thresholds", color: "yellow" },
    { id: "notifications", icon: Bell, label: "Notifications", color: "green" },
  ];

  return (
    <div>
      <PageHeader title="Settings" subtitle="Manage your account and system preferences" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sidebar tabs */}
        <Card className="lg:col-span-1 h-fit">
          <nav className="space-y-1">
            {sections.map((s) => (
              <a key={s.id} href={`#${s.id}`} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                <s.icon className="w-4 h-4" />
                {s.label}
              </a>
            ))}
          </nav>
        </Card>

        {/* Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile */}
          <Card id="profile">
            <div className="flex items-center gap-2 mb-4">
              <User className="w-5 h-5 text-brand-600" />
              <h3 className="text-base font-semibold text-slate-800">Profile Information</h3>
            </div>
            <div className="space-y-4">
              <Input label="Full Name" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
              <Input label="Email" type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} />
              <Input label="Phone" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
              <Button loading={saving === "profile"} onClick={() => saveSection("profile")}>
                <Save className="w-4 h-4" /> Save Profile
              </Button>
            </div>
          </Card>

          {/* Security */}
          <Card id="security">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5 text-slate-600" />
              <h3 className="text-base font-semibold text-slate-800">Security</h3>
            </div>
            <div className="space-y-4">
              <Input label="Current Password" type="password" value={security.currentPassword} onChange={(e) => setSecurity({ ...security, currentPassword: e.target.value })} placeholder="Enter current password" />
              <Input label="New Password" type="password" value={security.newPassword} onChange={(e) => setSecurity({ ...security, newPassword: e.target.value })} placeholder="Enter new password" />
              <Input label="Confirm New Password" type="password" value={security.confirmPassword} onChange={(e) => setSecurity({ ...security, confirmPassword: e.target.value })} placeholder="Re-enter new password" />
              <Button loading={saving === "security"} onClick={() => saveSection("security")}>
                <Save className="w-4 h-4" /> Update Password
              </Button>
            </div>
          </Card>

          {/* Expiry thresholds */}
          <Card id="thresholds">
            <div className="flex items-center gap-2 mb-4">
              <CalendarClock className="w-5 h-5 text-yellow-600" />
              <h3 className="text-base font-semibold text-slate-800">Expiry Thresholds</h3>
            </div>
            <p className="text-sm text-slate-500 mb-4">Configure when batches are flagged as near expiry or critical. These values are used across the system.</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input type="number" label="Near Expiry (days)" value={thresholds.nearExpiry} onChange={(e) => setThresholds({ ...thresholds, nearExpiry: Number(e.target.value) })} />
              <Input type="number" label="Critical Expiry (days)" value={thresholds.criticalExpiry} onChange={(e) => setThresholds({ ...thresholds, criticalExpiry: Number(e.target.value) })} />
              <Input type="number" label="Default Min Stock" value={thresholds.minStockDefault} onChange={(e) => setThresholds({ ...thresholds, minStockDefault: Number(e.target.value) })} />
            </div>
            <div className="mt-4">
              <Button loading={saving === "thresholds"} onClick={() => saveSection("thresholds")}>
                <Save className="w-4 h-4" /> Save Thresholds
              </Button>
            </div>
          </Card>

          {/* Notifications */}
          <Card id="notifications">
            <div className="flex items-center gap-2 mb-4">
              <Bell className="w-5 h-5 text-success-600" />
              <h3 className="text-base font-semibold text-slate-800">Notification Preferences</h3>
            </div>
            <div className="space-y-3">
              {Object.entries(notifications).map(([key, value]) => (
                <label key={key} className="flex items-center justify-between py-2 cursor-pointer">
                  <span className="text-sm text-slate-700 capitalize">{key.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase())}</span>
                  <button
                    type="button"
                    onClick={() => setNotifications({ ...notifications, [key]: !value })}
                    className={`relative w-11 h-6 rounded-full transition-colors ${value ? "bg-brand-600" : "bg-slate-300"}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${value ? "translate-x-5" : ""}`} />
                  </button>
                </label>
              ))}
            </div>
            <div className="mt-4">
              <Button loading={saving === "notifications"} onClick={() => saveSection("notifications")}>
                <Save className="w-4 h-4" /> Save Preferences
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
