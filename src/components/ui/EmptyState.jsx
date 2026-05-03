// src/components/ui/EmptyState.jsx
export default function EmptyState({ title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center px-4">
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
        style={{
          backgroundColor: '#fce7f3',
          boxShadow: '0 4px 14px rgba(236,72,153,0.12)',
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-6 h-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="#ec4899"
          strokeWidth={1.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
      </div>
      <p className="text-base font-bold text-gray-800 mb-1">{title}</p>
      {description && (
        <p className="text-sm max-w-sm" style={{ color: '#f9a8d4' }}>{description}</p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 text-sm font-semibold transition-colors duration-150"
          style={{ color: '#ec4899' }}
          onMouseEnter={e => e.currentTarget.style.color = '#be185d'}
          onMouseLeave={e => e.currentTarget.style.color = '#ec4899'}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}