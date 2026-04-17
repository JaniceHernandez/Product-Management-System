// src/components/products/AddProductModal.jsx — placeholder
export default function AddProductModal({ onClose }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm text-center">
        <p className="text-sm text-gray-500 mb-4">Add Product — placeholder (S2-T05)</p>
        <button onClick={onClose} className="text-sm text-blue-600 hover:underline">Close</button>
      </div>
    </div>
  );
}