export default function LoadingSpinner({ size = 'md', className = '' }) {
  const sizes = { sm: 'w-6 h-6', md: 'w-8 h-8', lg: 'w-12 h-12' };
  return (
    <div className={`flex items-center justify-center py-16 ${className}`}>
      <div
        className={`${sizes[size]} border-4 border-blue-500 border-t-transparent rounded-full animate-spin`}
      />
    </div>
  );
}