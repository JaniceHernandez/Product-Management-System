// src/components/layout/AppLayout.jsx
import Navbar from './Navbar';
import Sidebar from './Sidebar';

export default function AppLayout({ children }) {
  return (
    <div className="flex flex-col h-screen bg-gray-50">

      {/* Top Navbar — fixed height, always visible */}
      <Navbar />

      {/* Body: Sidebar + Main content */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left Sidebar */}
        <Sidebar />

        {/* Main content area — scrollable */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>

      </div>
    </div>
  );
}