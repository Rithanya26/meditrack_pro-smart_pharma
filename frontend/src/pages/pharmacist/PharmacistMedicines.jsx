import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Pill, Stethoscope } from "lucide-react";
import PageHeader from "../../components/common/PageHeader";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import SearchInput from "../../components/ui/SearchInput";
import { Select } from "../../components/ui/Input";
import EmptyState from "../../components/ui/EmptyState";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import ErrorState from "../../components/ui/ErrorState";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { medicineService } from "../../services/medicineService";
import { batchService } from "../../services/batchService";
import { daysUntilExpiry, formatDate, formatNumber } from "../../utils/helpers";
import { CATEGORIES } from "../../data/mockData";

export default function PharmacistMedicines() {
  const navigate = useNavigate();
  const [medicines, setMedicines] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [meds, bats] = await Promise.all([medicineService.getAll(), batchService.getAll()]);
        setMedicines(meds.filter((m) => m.status === "active"));
        setBatches(bats);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = useMemo(() => {
    return medicines.filter((m) => {
      const q = search.toLowerCase();
      const matchSearch = !q || m.name.toLowerCase().includes(q) || m.genericName.toLowerCase().includes(q);
      const matchCat = !categoryFilter || m.category === categoryFilter;
      return matchSearch && matchCat;
    });
  }, [medicines, search, categoryFilter]);

  function getMedStats(medId) {
    const medBatches = batches.filter((b) => b.medicineId === medId);
    const totalStock = medBatches.reduce((s, b) => s + b.quantity, 0);
    const batchCount = medBatches.filter((b) => b.quantity > 0).length;
    const validBatches = medBatches.filter((b) => daysUntilExpiry(b.expiryDate) > 0);
    const earliestExpiry = validBatches.length > 0 ? validBatches.reduce((min, b) => new Date(b.expiryDate) < new Date(min) ? b.expiryDate : min, validBatches[0].expiryDate) : null;
    const isAvailable = totalStock > 0 && validBatches.length > 0;
    return { totalStock, batchCount, earliestExpiry, isAvailable };
  }

  if (loading) return <LoadingSpinner size="lg" />;
  if (error) return <ErrorState onRetry={() => window.location.reload()} />;

  return (
    <div>
      <PageHeader title="Medicines" subtitle="Search and check medicine availability" />

      <Card className="mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by name or generic name..." />
          <Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="">All Categories</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
        </div>
      </Card>

      {filtered.length === 0 ? (
        <Card><EmptyState icon={Pill} title="No medicines found" message="Try a different search." /></Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((med) => {
            const stats = getMedStats(med.id);
            return (
              <Card key={med.id} className="hover:shadow-card-lg transition-shadow">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-11 h-11 rounded-lg bg-brand-50 flex items-center justify-center flex-shrink-0">
                    <Pill className="w-6 h-6 text-brand-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-800 truncate">{med.name}</h3>
                    <p className="text-xs text-slate-500">{med.genericName} · {med.strength}</p>
                  </div>
                </div>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Available Stock</span>
                    <span className={`font-semibold ${stats.totalStock > 0 ? "text-slate-800" : "text-danger-600"}`}>{formatNumber(stats.totalStock)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Batches</span>
                    <span className="font-semibold text-slate-800">{stats.batchCount}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Earliest Expiry</span>
                    <span className="font-medium text-slate-700">{stats.earliestExpiry ? formatDate(stats.earliestExpiry) : "—"}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Status</span>
                    <StatusBadge status={stats.isAvailable ? "Available" : "Unavailable"} type={stats.isAvailable ? "completed" : "active"} />
                  </div>
                </div>
                <Button
                  size="sm"
                  className="w-full"
                  disabled={!stats.isAvailable}
                  onClick={() => navigate("/pharmacist/dispense")}
                >
                  <Stethoscope className="w-4 h-4" /> Dispense
                </Button>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
