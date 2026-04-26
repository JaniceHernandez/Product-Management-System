export default function EmptyState({ title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center px-4">
      <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        <span className="text-2xl">📭</span>
      </div>
      <p className="text-base font-semibold text-gray-600 mb-1">{title}</p>
      {description && (
        <p className="text-sm text-gray-400 max-w-sm">{description}</p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 text-sm font-medium text-blue-600 hover:text-blue-800 underline"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}