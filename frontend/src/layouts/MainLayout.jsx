/**
 * Main app layout — used after authentication.
 * Provides the sidebar + main content split.
 */
export default function MainLayout({ children }) {
  return (
    <div className="h-screen flex bg-surface-900 overflow-hidden">
      {children}
    </div>
  );
}
