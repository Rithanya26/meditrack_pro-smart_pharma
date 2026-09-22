import { useState, useEffect, useMemo } from "react";
import { ScrollText, Lock } from "lucide-react";
import PageHeader from "../../components/common/PageHeader";
import Card from "../../components/ui/Card";
import SearchInput from "../../components/ui/SearchInput";
import { Select } from "../../components/ui/Input";
import DataTable from "../../components/ui/DataTable";
import EmptyState from "../../components/ui/EmptyState";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import ErrorState from "../../components/ui/ErrorState";
import { auditService } from "../../services/auditService";
import { AUDIT_ACTIONS } from "../../data/mockData";
import { formatDateTime, classNames } from "../../utils/helpers";

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState("");
  const [userFilter, setUserFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [entityFilter, setEntityFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    setError(false);
    try {
      const data = await auditService.getAll();
      setLogs(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    return logs.filter((l) => {
      const q = search.toLowerCase();
      const matchSearch = !q || l.description.toLowerCase().includes(q) || l.userName.toLowerCase().includes(q) || l.entityId.toLowerCase().includes(q);
      const matchUser = !userFilter || l.userName === userFilter;
      const matchRole = !roleFilter || l.role === roleFilter;
      const matchAction = !actionFilter || l.action === actionFilter;
      const matchEntity = !entityFilter || l.entity === entityFilter;
      const logDate = new Date(l.timestamp).toISOString().split("T")[0];
      const matchFrom = !dateFrom || logDate >= dateFrom;
      const matchTo = !dateTo || logDate <= dateTo;
      return matchSearch && matchUser && matchRole && matchAction && matchEntity && matchFrom && matchTo;
    });
  }, [logs, search, userFilter, roleFilter, actionFilter, entityFilter, dateFrom, dateTo]);

  const users = [...new Set(logs.map((l) => l.userName))];
  const entities = [...new Set(logs.map((l) => l.entity))];

  const actionColors = {
    LOGIN: "bg-slate-100 text-slate-600",
    MEDICINE_CREATED: "bg-success-100 text-success-700",
    MEDICINE_UPDATED: "bg-brand-100 text-brand-700",
    BATCH_CREATED: "bg-success-100 text-success-700",
    INVENTORY_UPDATED: "bg-yellow-100 text-yellow-700",
    MEDICINE_DISPENSED: "bg-purple-100 text-purple-700",
    USER_CREATED: "bg-success-100 text-success-700",
    USER_UPDATED: "bg-yellow-100 text-yellow-700",
  };

  const columns = [
    { key: "timestamp", header: "Timestamp", render: (l) => <span className="text-slate-600 whitespace-nowrap">{formatDateTime(l.timestamp)}</span> },
    { key: "userName", header: "User", render: (l) => <span className="font-medium text-slate-800">{l.userName}</span> },
    { key: "role", header: "Role", render: (l) => (
      <span className={classNames("badge capitalize", l.role === "admin" ? "bg-brand-100 text-brand-700" : "bg-purple-100 text-purple-700")}>{l.role}</span>
    )},
    { key: "action", header: "Action", render: (l) => (
      <span className={classNames("badge font-mono text-xs", actionColors[l.action] || "bg-slate-100 text-slate-600")}>{l.action}</span>
    )},
    { key: "entity", header: "Entity", render: (l) => <span className="text-slate-600">{l.entity}</span> },
    { key: "entityId", header: "Entity ID", render: (l) => <span className="font-mono text-xs text-slate-500">{l.entityId}</span> },
    { key: "description", header: "Description", render: (l) => <span className="text-slate-600 max-w-xs truncate block">{l.description}</span> },
  ];

  return (
    <div>
      <PageHeader title="Audit Logs" subtitle="Complete system activity trail — read only" />

      <div className="mb-4 flex items-center gap-2 p-3 rounded-lg bg-slate-50 border border-slate-200">
        <Lock className="w-4 h-4 text-slate-400" />
        <p className="text-sm text-slate-500">Audit logs are immutable and cannot be edited or deleted.</p>
      </div>

      <Card className="mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <SearchInput value={search} onChange={setSearch} placeholder="Search description, user, ID..." />
          <Select value={userFilter} onChange={(e) => setUserFilter(e.target.value)}>
            <option value="">All Users</option>
            {users.map((u) => <option key={u} value={u}>{u}</option>)}
          </Select>
          <Select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="pharmacist">Pharmacist</option>
          </Select>
          <Select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)}>
            <option value="">All Actions</option>
            {AUDIT_ACTIONS.map((a) => <option key={a} value={a}>{a}</option>)}
          </Select>
          <Select value={entityFilter} onChange={(e) => setEntityFilter(e.target.value)}>
            <option value="">All Entities</option>
            {entities.map((e) => <option key={e} value={e}>{e}</option>)}
          </Select>
          <div className="flex items-center gap-2">
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="input" />
            <span className="text-slate-400 text-xs">to</span>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="input" />
          </div>
        </div>
      </Card>

      <Card padding={false}>
        {loading ? <LoadingSpinner /> :
         error ? <ErrorState onRetry={load} /> :
         filtered.length === 0 ? <EmptyState icon={ScrollText} title="No audit logs found" message="No records match your filters." /> :
         <DataTable columns={columns} data={filtered} />}
      </Card>
    </div>
  );
}
