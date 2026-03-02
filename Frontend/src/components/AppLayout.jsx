import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Toaster } from 'sonner';  // ← this is required for toasts to show

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-gray-100">
      <Sidebar />

      {/* Main content area - pushed right on desktop */}
      <div className="lg:ml-64 flex flex-col min-h-screen">
        {/* Optional top bar (visible only on mobile) */}
        <header className="bg-white shadow h-16 flex items-center px-6 lg:hidden">
          <div className="font-semibold text-lg">Invoice</div>
        </header>

        <main className="flex-1 p-5 md:p-8">
          <Outlet />
        </main>
      </div>

      {/* Sonner Toaster - placed at the root level so toasts appear over everything */}
      <Toaster
        position="top-center"           // or "top-center", "bottom-right", etc.
        richColors                     // nicer colors matching success/error/info
        closeButton                    // shows X button
        duration={1000}                // how long toasts stay visible (ms)
        toastOptions={{
          // Optional: custom styling for all toasts
          className: 'border border-gray-200 shadow-xl rounded-xl',
          style: {
            fontFamily: 'system-ui, sans-serif',
          },
        }}
      />
    </div>
  );
}