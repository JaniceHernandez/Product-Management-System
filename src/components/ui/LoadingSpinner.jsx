// src/components/ui/LoadingSpinner.jsx
export default function LoadingSpinner({ size = 'md', className = '' }) {
  const sizes = { sm: 'w-5 h-5', md: 'w-7 h-7', lg: 'w-10 h-10' };
  const borders = { sm: 'border-[2.5px]', md: 'border-[3px]', lg: 'border-4' };
  return (
    <div className={`flex items-center justify-center py-16 ${className}`}>
      <div className={`${sizes[size]} ${borders[size]} border-pink-400 border-t-transparent rounded-full animate-spin`} />
    </div>
  );
}