import { Eye, Pencil, ToggleLeft, ToggleRight, Trash2 } from "lucide-react";

export function ActionButton({ icon: Icon, onClick, color = "slate", title }) {
  const colors = {
    slate: "text-slate-500 hover:bg-slate-100 hover:text-slate-700",
    blue: "text-brand-600 hover:bg-brand-50",
    green: "text-success-600 hover:bg-success-50",
    yellow: "text-warning-600 hover:bg-warning-50",
    red: "text-danger-600 hover:bg-danger-50",
  };
  return (
    <button
      onClick={onClick}
      title={title}
      className={`p-1.5 rounded-lg transition-colors ${colors[color]}`}
    >
      <Icon className="w-4 h-4" />
    </button>
  );
}

export function TableActions({ onView, onEdit, onToggle, isActive, onDelete }) {
  return (
    <div className="flex items-center gap-1">
      {onView && <ActionButton icon={Eye} onClick={onView} color="blue" title="View" />}
      {onEdit && <ActionButton icon={Pencil} onClick={onEdit} color="slate" title="Edit" />}
      {onToggle && (
        <ActionButton
          icon={isActive ? ToggleRight : ToggleLeft}
          onClick={onToggle}
          color={isActive ? "green" : "yellow"}
          title={isActive ? "Deactivate" : "Activate"}
        />
      )}
      {onDelete && <ActionButton icon={Trash2} onClick={onDelete} color="red" title="Delete" />}
    </div>
  );
}
