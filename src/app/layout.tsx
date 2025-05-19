'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTasks, FaUser, FaSignOutAlt } from 'react-icons/fa';
import './globals.css';

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

  // Animation variants for sidebar and nav items
  const sidebarVariants = {
    open: { x: 0, transition: { duration: 0.3, ease: 'easeInOut' } },
    closed: { x: '-100%', transition: { duration: 0.3, ease: 'easeInOut' } },
  };

  const navItemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.1, duration: 0.3 },
    }),
  };

  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-gray-100">
        {isPublicRoute ? (
          <main className="flex-1">{children}</main>
        ) : (
          <>
            {/* Header */}
            <motion.header
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-lg fixed top-0 left-0 right-0 z-50"
            >
              <div className="container mx-auto max-w-7xl px-6 py-4 flex justify-between items-center">
                <div className="flex items-center space-x-6">
                  <button
                    className="md:hidden text-white focus:outline-none p-2 rounded-lg hover:bg-blue-700 transition-all duration-200"
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
                  <h1 className="text-2xl font-bold tracking-tight">Task Manager</h1>
                </div>
                <div className="flex items-center space-x-6">
                  <span className="text-sm font-medium hidden sm:block bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                    {userEmail || 'Loading...'}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-all duration-200 hover:scale-105"
                  >
                    <FaSignOutAlt />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            </motion.header>

            {/* Main Layout */}
            <div className="flex flex-1 mt-20 md:mt-16">
              {/* Sidebar */}
              <AnimatePresence>
                {(isSidebarOpen || window.innerWidth >= 768) && (
                  <motion.aside
                    initial="closed"
                    animate="open"
                    exit="closed"
                    variants={sidebarVariants}
                    className="fixed md:static inset-y-0 left-0 z-40 w-64 bg-white rounded-lg shadow-lg md:shadow-md transform md:translate-x-0 flex flex-col mt-20 md:mt-0"
                  >
                    <div className="flex items-center justify-between p-6 border-b border-gray-200">
                      <h2 className="text-xl font-semibold text-gray-800">Menu</h2>
                      <button
                        className="md:hidden text-gray-600 focus:outline-none p-2 rounded-lg hover:bg-gray-100"
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
                      {[
                        { href: '/', label: 'Tasks', icon: <FaTasks className="w-5 h-5" /> },
                        { href: '/profile', label: 'Profile', icon: <FaUser className="w-5 h-5" /> },
                      ].map((item, index) => (
                        <motion.div
                          key={item.href}
                          custom={index}
                          initial="hidden"
                          animate="visible"
                          variants={navItemVariants}
                        >
                          <Link
                            href={item.href}
                            className={`flex items-center space-x-3 px-4 py-3 text-gray-700 rounded-lg transition-all duration-200 ${
                              pathname === item.href
                                ? 'bg-emerald-100 text-emerald-600 font-semibold border-l-4 border-emerald-500'
                                : 'hover:bg-emerald-50 hover:text-emerald-600'
                            }`}
                            onClick={() => setIsSidebarOpen(false)}
                          >
                            {item.icon}
                            <span>{item.label}</span>
                          </Link>
                        </motion.div>
                      ))}
                    </nav>
                  </motion.aside>
                )}
              </AnimatePresence>

              {/* Mobile Sidebar Backdrop */}
              {isSidebarOpen && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.5 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black z-30 md:hidden"
                  onClick={toggleSidebar}
                />
              )}

              {/* Main Content */}
              <main className="flex-1 p-6 md:pl-8">{children}</main>
            </div>

            {/* Footer */}
            <motion.footer
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-gray-800 text-white py-6"
            >
              <div className="container mx-auto max-w-7xl px-6 text-center">
                <p className="text-sm font-medium">
                  © {new Date().getFullYear()} Task Manager. All rights reserved.
                </p>
                <p className="text-sm mt-2">
                  Contact:{' '}
                  <a
                    href="mailto:support@taskmanager.com"
                    className="underline hover:text-emerald-300 transition-colors duration-200"
                  >
                    support@taskmanager.com
                  </a>
                </p>
              </div>
            </motion.footer>
          </>
        )}
      </body>
    </html>
  );
}