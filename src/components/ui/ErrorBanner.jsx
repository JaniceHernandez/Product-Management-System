// src/components/ui/ErrorBanner.jsx
export default function ErrorBanner({ message, onRetry }) {
  return (
    <div
      className="rounded-2xl px-4 py-3 text-sm flex items-start gap-3 mb-4"
      style={{
        backgroundColor: '#fff1f2',
        border: '1px solid #fecdd3',
        color: '#be123c',
      }}
    >
      <span className="shrink-0 mt-0.5" style={{ color: '#f43f5e' }}>⚠</span>
      <div className="flex-1">
        <span>{message}</span>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="shrink-0 font-semibold underline hover:no-underline transition-colors duration-150"
          style={{ color: '#e11d48' }}
          onMouseEnter={e => e.currentTarget.style.color = '#be123c'}
          onMouseLeave={e => e.currentTarget.style.color = '#e11d48'}
        >
          Retry
        </button>
      )}
    </div>
  );
}