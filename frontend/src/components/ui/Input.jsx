import { classNames } from "../../utils/helpers";

export function Input({ label, error, className = "", ...props }) {
  return (
    <div>
      {label && <label className="label">{label}</label>}
      <input
        className={classNames("input", error && "border-danger-500 focus:ring-danger-500/30 focus:border-danger-500", className)}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-danger-600">{error}</p>}
    </div>
  );
}

export function Select({ label, error, children, className = "", ...props }) {
  return (
    <div>
      {label && <label className="label">{label}</label>}
      <select
        className={classNames("input", error && "border-danger-500", className)}
        {...props}
      >
        {children}
      </select>
      {error && <p className="mt-1 text-xs text-danger-600">{error}</p>}
    </div>
  );
}

export function TextArea({ label, error, className = "", ...props }) {
  return (
    <div>
      {label && <label className="label">{label}</label>}
      <textarea
        className={classNames("input", error && "border-danger-500", className)}
        rows={3}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-danger-600">{error}</p>}
    </div>
  );
}
