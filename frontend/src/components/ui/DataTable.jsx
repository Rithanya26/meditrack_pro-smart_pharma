import { classNames } from "../../utils/helpers";

export default function DataTable({ columns, data, rowKey = "id", onRowClick, emptyMessage = "No data found." }) {
  if (!data || data.length === 0) {
    return (
      <div className="px-5 py-12 text-center text-sm text-slate-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50/50">
            {columns.map((col) => (
              <th
                key={col.key}
                className={classNames(
                  "px-5 py-3 text-left font-semibold text-slate-600 whitespace-nowrap",
                  col.align === "right" && "text-right",
                  col.align === "center" && "text-center",
                  col.width && `w-${col.width}`
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr
              key={row[rowKey]}
              onClick={() => onRowClick?.(row)}
              className={classNames(
                "border-b border-slate-100 last:border-0 transition-colors",
                onRowClick && "cursor-pointer hover:bg-slate-50"
              )}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={classNames(
                    "px-5 py-3 text-slate-700 whitespace-nowrap",
                    col.align === "right" && "text-right",
                    col.align === "center" && "text-center",
                    col.className
                  )}
                >
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
