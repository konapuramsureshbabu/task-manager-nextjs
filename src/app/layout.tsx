'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  // Define public routes that don't need header/sidebar/footer
  const publicRoutes = ['/login', '/register'];
  const isPublicRoute = publicRoutes.includes(pathname);

  useEffect(() => {
    if (isPublicRoute) return;

    // Check for token
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    // Decode token to get user email (client-side, for display only)
    try {
      const decoded = JSON.parse(atob(token.split('.')[1]));
      if (decoded && decoded.email) {
        setUserEmail(decoded.email);
      } else {
        throw new Error('Invalid token');
      }
    } catch (error) {
      console.error('Token decode error:', error);
      localStorage.removeItem('token');
      router.push('/login');
    }
  }, [router, pathname, isPublicRoute]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUserEmail(null);
    router.push('/login');
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-gray-100">
        {isPublicRoute ? (
          // Render only children for login/register
          <main className="flex-1">{children}</main>
        ) : (
          // Render layout with header, sidebar, and footer for protected routes
          <>
            {/* Header */}
            <header className="bg-blue-600 text-white shadow-md fixed top-0 left-0 right-0 z-50">
              <div className="container mx-auto px-4 py-3 flex justify-between items-center">
                <div className="flex items-center space-x-4">
                  <button
                    className="md:hidden text-white focus:outline-none"
                    onClick={toggleSidebar}
                    aria-label="Toggle sidebar"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 6h16M4 12h16M4 18h16"
                      />
                    </svg>
                  </button>
                  <h1 className="text-xl font-bold">Task Manager</h1>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-sm hidden sm:block">{userEmail || 'Loading...'}</span>
                  <button
                    onClick={handleLogout}
                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </header>

            {/* Main Layout */}
            <div className="flex flex-1 mt-16">
              {/* Sidebar */}
              <aside
                className={`fixed md:static inset-y-0 left-0 z-40 w-64 bg-white shadow-md transform ${
                  isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
                } md:translate-x-0 transition-transform duration-300 ease-in-out flex flex-col`}
              >
                <div className="flex items-center justify-between p-4 border-b">
                  <h2 className="text-lg font-semibold text-gray-800">Menu</h2>
                  <button
                    className="md:hidden text-gray-600 focus:outline-none"
                    onClick={toggleSidebar}
                    aria-label="Close sidebar"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
                <nav className="flex-1 p-4 space-y-2">
                  <Link
                    href="/"
                    className={`block px-4 py-2 text-gray-700 rounded ${
                      pathname === '/' ? 'bg-blue-100 text-blue-600' : 'hover:bg-blue-100 hover:text-blue-600'
                    }`}
                    onClick={() => setIsSidebarOpen(false)}
                  >
                    Tasks
                  </Link>
                  <Link
                    href="/profile"
                    className={`block px-4 py-2 text-gray-700 rounded ${
                      pathname === '/profile' ? 'bg-blue-100 text-blue-600' : 'hover:bg-blue-100 hover:text-blue-600'
                    }`}
                    onClick={() => setIsSidebarOpen(false)}
                  >
                    Profile
                  </Link>
                </nav>
              </aside>

              {/* Main Content */}
              <main className="flex-1 p-4">{children}</main>
            </div>

            {/* Footer */}
            <footer className="bg-gray-800 text-white py-4">
              <div className="container mx-auto px-4 text-center">
                <p>© {new Date().getFullYear()} Task Manager. All rights reserved.</p>
                <p className="text-sm mt-1">
                  Contact:{' '}
                  <a href="mailto:support@taskmanager.com" className="underline hover:text-blue-300">
                    support@taskmanager.com
                  </a>
                </p>
              </div>
            </footer>
          </>
        )}
      </body>
    </html>
  );
}