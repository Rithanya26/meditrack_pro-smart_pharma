export default function LoadingSpinner({ size = "md", label = "" }) {
  const sizes = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <svg className={`animate-spin ${sizes[size]} text-brand-500`} viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
      </svg>
      {label && <p className="mt-3 text-sm text-slate-500">{label}</p>}
    </div>
  );
}
