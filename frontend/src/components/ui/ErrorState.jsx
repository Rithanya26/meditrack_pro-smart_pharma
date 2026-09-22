import { AlertCircle, RefreshCw } from "lucide-react";
import Button from "./Button";

export default function ErrorState({ message = "Something went wrong. Please try again.", onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-danger-50 flex items-center justify-center mb-4">
        <AlertCircle className="w-8 h-8 text-danger-500" />
      </div>
      <h3 className="text-base font-semibold text-slate-700">Error</h3>
      <p className="mt-1 text-sm text-slate-500 max-w-sm">{message}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" className="mt-4" onClick={onRetry}>
          <RefreshCw className="w-4 h-4" /> Try Again
        </Button>
      )}
    </div>
  );
}
