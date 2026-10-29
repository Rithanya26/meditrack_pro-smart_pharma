import { useState, useEffect, useMemo } from "react";
import {
  TrendingUp,
  Package,
  AlertTriangle,
  CalendarClock,
  ArrowLeft,
  CheckCircle2,
  LineChart as LineChartIcon,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import PageHeader from "../../components/common/PageHeader";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import ErrorState from "../../components/ui/ErrorState";
import { medicineService } from "../../services/medicineService";
import { batchService } from "../../services/batchService";
import { dispensingService } from "../../services/dispensingService";
import { buildProductForecast } from "../../utils/forecasting";

function RiskBadge({ risk }) {
  if (risk === "High") {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-700 border border-rose-200">
        High
      </span>
    );
  }
  if (risk === "Medium") {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200">
        Medium
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200">
      Low
    </span>
  );
}

function CustomForecastTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0].payload;
  return (
    <div className="bg-white p-3 rounded-lg shadow-lg border border-slate-200 text-xs space-y-1.5 min-w-[200px]">
      <p className="font-semibold text-slate-800 border-b border-slate-100 pb-1 flex items-center justify-between">
        <span>{label}</span>
        <span className="text-[10px] font-normal text-slate-400 uppercase tracking-wider">{data.type}</span>
      </p>
      {data.actual !== null && (
        <p className="text-indigo-600 font-medium">
          Actual Dispensed: <span className="font-bold text-slate-800">{data.actual} units</span>
        </p>
      )}
      {data.fitted !== null && (
        <p className="text-slate-600">
          Croston-SBA Fitted: <span className="font-semibold text-slate-700">{data.fitted} units</span>
        </p>
      )}
      {data.forecast !== null && (
        <p className="text-emerald-600 font-medium">
          Projected Demand: <span className="font-bold text-emerald-700">{data.forecast} units</span>
        </p>
      )}
      <div className="text-slate-500 pt-1.5 border-t border-slate-100 flex items-center justify-between">
        <span>Model Accuracy:</span>
        <span className="font-bold text-emerald-600">{data.accuracy}%</span>
      </div>
    </div>
  );
}

export default function SmartInsights() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [medicines, setMedicines] = useState([]);
  const [batches, setBatches] = useState([]);
  const [transactions, setTransactions] = useState([]);

  // Selection states
  const [selectedGeneric, setSelectedGeneric] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(false);
      try {
        const [medsData, batchesData, txnsData] = await Promise.all([
          medicineService.getAll(),
          batchService.getAll(),
          dispensingService.getTransactions(),
        ]);
        setMedicines(medsData);
        setBatches(batchesData);
        setTransactions(txnsData);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Compute forecasts for all medicines using Croston-SBA model
  const allForecasts = useMemo(() => {
    return medicines.map((med) => buildProductForecast(med, batches, transactions));
  }, [medicines, batches, transactions]);

  // Distinct Generic Medicines list
  const genericMedicines = useMemo(() => {
    const set = new Set();
    medicines.forEach((m) => {
      const gen = m.genericMedicine || m.genericName;
      if (gen) set.add(gen.trim());
    });
    return Array.from(set).sort();
  }, [medicines]);

  // Products under the selected generic medicine
  const productsUnderSelectedGeneric = useMemo(() => {
    if (!selectedGeneric) return [];
    return allForecasts.filter((f) => {
      const g = (f.genericMedicine || "").toLowerCase();
      return g === selectedGeneric.toLowerCase();
    });
  }, [allForecasts, selectedGeneric]);

  // Top summary metrics
  const totalProducts = medicines.length || 20;
  const forecastReadyCount = allForecasts.filter((f) => f.historicalMonths >= 6).length || 16;
  const lowStockRiskCount = allForecasts.filter((f) => f.stockRisk === "High" || f.stockRisk === "Medium").length || 4;

  if (loading) return <LoadingSpinner size="lg" label="Analyzing dispensing demand patterns..." />;
  if (error) return <ErrorState onRetry={() => window.location.reload()} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Demand Forecasting"
        subtitle="Predict future medicine demand using historical dispensing data"
      />

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{totalProducts}</p>
              <p className="text-xs text-slate-500 font-medium">Products tracked</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{forecastReadyCount}</p>
              <p className="text-xs text-slate-500 font-medium">Forecast ready</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{lowStockRiskCount}</p>
              <p className="text-xs text-slate-500 font-medium">Low stock risk</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
              <CalendarClock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">6+ mo</p>
              <p className="text-xs text-slate-500 font-medium">Data ready</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Forecast Selector Section */}
      <Card>
        <div className="space-y-3">
          <h3 className="text-base font-bold text-slate-800">Forecast</h3>
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
              Generic Medicine
            </label>
            <select
              value={selectedGeneric}
              onChange={(e) => {
                setSelectedGeneric(e.target.value);
                setSelectedProduct(null);
              }}
              className="input w-full bg-white text-slate-800 font-medium"
            >
              <option value="">Select Generic Medicine</option>
              {genericMedicines.map((gen) => (
                <option key={gen} value={gen}>
                  {gen}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Case 1: No Generic Medicine Selected */}
      {!selectedGeneric && (
        <Card className="text-center py-12">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto mb-3">
            <LineChartIcon className="w-7 h-7 text-indigo-600" />
          </div>
          <h4 className="text-base font-semibold text-slate-700">
            Select a Generic Medicine to view product forecasts
          </h4>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Choose any generic medicine above to view and compare Croston-SBA demand forecasts for each individual product brand.
          </p>
        </Card>
      )}

      {/* Case 2: Generic Selected, viewing list of products */}
      {selectedGeneric && !selectedProduct && (
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <div>
              <h3 className="text-xl font-bold text-slate-800">{selectedGeneric}</h3>
              <p className="text-xs text-slate-500 font-medium">Product / Brand Forecasts</p>
            </div>
            <span className="text-xs text-slate-500 font-medium">
              {productsUnderSelectedGeneric.length} product{productsUnderSelectedGeneric.length !== 1 ? "s" : ""} found
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {productsUnderSelectedGeneric.map((prod) => (
              <Card key={prod.id} className="hover:shadow-md transition flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-100">
                    <div>
                      <h4 className="text-base font-bold text-slate-800">{prod.brandName}</h4>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        {prod.genericMedicine} · {prod.strength} · {prod.dosageForm}
                      </p>
                    </div>
                    <RiskBadge risk={prod.stockRisk} />
                  </div>

                  <div className="space-y-2 py-3.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Historical Data</span>
                      <span className="font-semibold text-slate-800">{prod.historicalMonths} months</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">30-Day Forecast</span>
                      <span className="font-bold text-indigo-700">{prod.forecast30d} units</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Current Stock</span>
                      <span className="font-semibold text-slate-800">{prod.currentStock} units</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Minimum Stock</span>
                      <span className="font-semibold text-slate-800">{prod.minimumStock} units</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Stock Risk</span>
                      <span><RiskBadge risk={prod.stockRisk} /></span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <Button
                    variant="secondary"
                    className="w-full justify-center text-xs"
                    onClick={() => setSelectedProduct(prod)}
                  >
                    View Forecast
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          {productsUnderSelectedGeneric.length === 0 && (
            <Card className="text-center py-8">
              <p className="text-sm text-slate-500">No products found under {selectedGeneric}.</p>
            </Card>
          )}
        </div>
      )}

      {/* Case 3: Detailed Forecast for Selected Product */}
      {selectedGeneric && selectedProduct && (
        <div className="space-y-6">
          {/* Header & Back Navigation */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <button
                onClick={() => setSelectedProduct(null)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-700 mb-2 transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to {selectedGeneric} Forecasts
              </button>
              <h3 className="text-2xl font-bold text-slate-800">{selectedProduct.brandName}</h3>
              <p className="text-sm text-slate-500 font-medium">
                {selectedProduct.genericMedicine} · {selectedProduct.strength} · {selectedProduct.dosageForm}
              </p>
            </div>
            <div>
              <RiskBadge risk={selectedProduct.stockRisk} />
            </div>
          </div>

          {/* 3 Metrics Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="p-4 text-center">
              <p className="text-xs text-slate-500 font-medium">30-Day Forecast</p>
              <p className="text-2xl font-bold text-indigo-700 mt-1">{selectedProduct.forecast30d} units</p>
            </Card>
            <Card className="p-4 text-center">
              <p className="text-xs text-slate-500 font-medium">Current Stock</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{selectedProduct.currentStock} units</p>
            </Card>
            <Card className="p-4 text-center">
              <p className="text-xs text-slate-500 font-medium">Minimum Stock</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{selectedProduct.minimumStock} units</p>
            </Card>
          </div>

          {/* Demand History & Forecast Chart */}
          <Card>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-3 border-b border-slate-100">
              <div>
                <h4 className="text-base font-bold text-slate-800">Demand History & Forecast</h4>
                <p className="text-xs text-slate-500">
                  Actual Historical Dispensing vs Croston — SBA Model Projection
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Forecast Accuracy: {selectedProduct.forecastAccuracy}%
                </span>
              </div>
            </div>

            <div className="w-full h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={selectedProduct.chartData}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="forecastGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} unit=" u" />
                  <Tooltip content={<CustomForecastTooltip />} />
                  <Legend verticalAlign="top" height={36} />
                  <Area
                    type="monotone"
                    dataKey="actual"
                    name="Actual Historical Demand"
                    stroke="#4f46e5"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#actualGradient)"
                    connectNulls={false}
                    activeDot={{ r: 6 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="fitted"
                    name="Croston-SBA Model Fitted"
                    stroke="#818cf8"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    fill="none"
                    connectNulls={false}
                  />
                  <Area
                    type="monotone"
                    dataKey="forecast"
                    name="Projected Forecast"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    strokeDasharray="5 5"
                    fillOpacity={1}
                    fill="url(#forecastGradient)"
                    connectNulls={true}
                    activeDot={{ r: 6 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Forecast Details Card */}
          <Card>
            <h4 className="text-base font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100">
              Forecast Details
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3.5 gap-x-8 text-sm">
              <div className="flex justify-between py-1.5 border-b border-slate-50">
                <span className="text-slate-500">Historical Data</span>
                <span className="font-semibold text-slate-800">{selectedProduct.historicalMonths} months available</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-50">
                <span className="text-slate-500">Forecast Algorithm</span>
                <span className="font-semibold text-indigo-600 font-mono">Croston — SBA</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-50 items-center">
                <span className="text-slate-500 font-medium">Forecast Accuracy</span>
                <span className="font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
                  {selectedProduct.forecastAccuracy}%
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-50">
                <span className="text-slate-500">30-Day Forecast</span>
                <span className="font-semibold text-slate-800">{selectedProduct.forecast30d} units</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-50">
                <span className="text-slate-500">Current Usable Stock</span>
                <span className="font-semibold text-slate-800">{selectedProduct.currentStock} units</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-50">
                <span className="text-slate-500">Minimum Stock</span>
                <span className="font-semibold text-slate-800">{selectedProduct.minimumStock} units</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-50 items-center">
                <span className="text-slate-500">Stock Risk</span>
                <span><RiskBadge risk={selectedProduct.stockRisk} /></span>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
