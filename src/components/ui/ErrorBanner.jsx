export default function ErrorBanner({ message, onRetry }) {
  return (
    <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex items-start gap-3 mb-4">
      <span className="text-red-500 shrink-0 mt-0.5">⚠</span>
      <div className="flex-1">
        <span>{message}</span>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="shrink-0 text-red-600 underline hover:no-underline font-medium"
        >
          Retry
        </button>
      )}
    </div>
  );
}