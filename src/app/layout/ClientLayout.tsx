"use client";

import { useState, useEffect } from "react";
import { redirect, usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaTasks,
  FaUser,
  FaSignOutAlt,
  FaBell,
  FaEnvelope,
} from "react-icons/fa";
import { useAppDispatch, useAppSelector } from "../redux/redux-hooks";
import NotificationListener from "../components/NotificationListener";
import { clearSSEMessages } from "../redux/slices/sseMessagesSlice";
import Swal from "sweetalert2";

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isMessagesOpen, setIsMessagesOpen] = useState<boolean>(false);
  const [role, setRole] = useState<string | null>(null);
  const [isTokenLoading, setIsTokenLoading] = useState<boolean>(true); // New loading state
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const sseMessages = useAppSelector((state) => state.sseMessages.messages);

  // Log notifications and messages changes
  useEffect(() => {
    // No changes needed here
  }, [sseMessages]);

  // Define public routes that don't need header/sidebar/footer
  const publicRoutes = ["/login", "/register"];
  const isPublicRoute = publicRoutes.includes(pathname);

  useEffect(() => {
    if (isPublicRoute) {
      setIsTokenLoading(false); // No token check for public routes
      return;
    }

    // Check for token
    setIsTokenLoading(true); // Start loading
    const token = localStorage.getItem("token");
    if (!token) {
      redirect("/login");
      setIsTokenLoading(false);
      return;
    }

    // Decode token to get user email and id
    try {
      const decoded = JSON.parse(atob(token.split(".")[1]));
      if (decoded && decoded.email) {
        setUserEmail(decoded.email);
        setRole(decoded.role);
      } else {
        throw new Error("Invalid token");
      }
    } catch (error) {
      console.error("Token decode error:", error);
      localStorage.removeItem("token");
      redirect("/login");
    } finally {
      setIsTokenLoading(false); // End loading
    }
  }, [router, pathname, isPublicRoute]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUserEmail(null);
    setRole(null);
    router.push("/login");
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const toggleMessages = () => {
    setIsMessagesOpen(!isMessagesOpen);
  };

  const handleClearMessages = async () => {
    try {
      const token = localStorage.getItem("token");
      let userId: string | null = null;
      if (token) {
        const decoded = JSON.parse(atob(token.split(".")[1]));
        userId = decoded.email || null;
      }

      const response = await fetch("/api/notifications/clear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      if (response.ok) {
        dispatch(clearSSEMessages());
        setIsMessagesOpen(!isMessagesOpen);
        await Swal.fire({
          toast: true,
          position: "top-end",
          icon: "success",
          text: "Cleared Messages!",
          timer: 2000,
          timerProgressBar: true,
          showConfirmButton: false,
          padding: "0.75rem",
          width: "auto",
          background: "#10b981",
          color: "#ffffff",
        });
      } else {
        console.error("Failed to clear messages:", await response.json());
      }
    } catch (error) {
      console.error("Error clearing messages:", error);
    }
  };

  // Animation variants for sidebar and nav items
  const sidebarVariants = {
    open: { x: 0, transition: { duration: 0.3, ease: "easeInOut" } },
    closed: { x: "-100%", transition: { duration: 0.3, ease: "easeInOut" } },
  };

  const navItemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.1, duration: 0.3 },
    }),
  };

  const notificationVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.2 } },
  };

  const navItems = [
    { href: "/", label: "Tasks", icon: <FaTasks className="w-5 h-5" /> },
    {
      href: "/profile",
      label: "Profile",
      icon: <FaUser className="w-5 h-5" />,
    },
    ...(role === "admin"
      ? [
          {
            href: "/notifications",
            label: "Send Notification",
            icon: <FaBell className="w-5 h-5" />,
          },
        ]
      : []),
  ];

  // Skeleton Loader Component
  const SkeletonLoader = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen animate-pulse"
    >
      {/* Header Skeleton */}
      <div className="bg-gray-300 fixed top-0 left-0 right-0 h-16 z-50">
        <div className="container mx-auto max-w-7xl px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-6">
            <div className="h-8 w-8 bg-gray-400 rounded-lg"></div>
            <div className="h-6 w-32 bg-gray-400 rounded"></div>
          </div>
          <div className="flex items-center space-x-6">
            <div className="h-6 w-6 bg-gray-400 rounded-full"></div>
            <div className="h-6 w-24 bg-gray-400 rounded-full hidden sm:block"></div>
            <div className="h-10 w-28 bg-gray-400 rounded-lg"></div>
          </div>
        </div>
      </div>

      {/* Sidebar Skeleton */}
      <div className="fixed md:static inset-y-0 left-0 z-40 w-64 bg-gray-200 mt-16 md:mt-0">
        <div className="p-6 border-b border-gray-300">
          <div className="h-6 w-20 bg-gray-400 rounded"></div>
        </div>
        <div className="p-4 space-y-4">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="flex items-center space-x-3">
              <div className="h-5 w-5 bg-gray-400 rounded"></div>
              <div className="h-5 w-24 bg-gray-400 rounded"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content Skeleton */}
      <div className="flex flex-1 mt-16 md:pl-64 p-6">
        <div className="flex-1 space-y-6">
          <div className="h-8 w-48 bg-gray-400 rounded"></div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="bg-gray-200 p-6 rounded-lg">
                <div className="h-6 w-3/4 bg-gray-400 rounded mb-2"></div>
                <div className="h-4 w-full bg-gray-400 rounded mb-4"></div>
                <div className="flex space-x-3">
                  <div className="h-10 w-20 bg-gray-400 rounded"></div>
                  <div className="h-10 w-20 bg-gray-400 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Skeleton */}
      <div className="bg-gray-300 py-6">
        <div className="container mx-auto max-w-7xl px-6 text-center">
          <div className="h-4 w-48 bg-gray-400 rounded mx-auto"></div>
          <div className="h-4 w-64 bg-gray-400 rounded mx-auto mt-2"></div>
        </div>
      </div>
    </motion.div>
  );

  return (
    <>
      {isPublicRoute ? (
        <main className="flex-1">{children}</main>
      ) : isTokenLoading ? (
        <SkeletonLoader />
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
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                </button>
                <h1 className="text-2xl font-bold tracking-tight">
                  Task Manager
                </h1>
              </div>
              <div className="flex items-center space-x-6">
                <div className="relative">
                  <button
                    onClick={toggleMessages}
                    className="relative text-white focus:outline-none p-2 rounded-lg hover:bg-blue-700 transition-all duration-200"
                    aria-label="Messages"
                  >
                    <FaEnvelope className="w-5 h-5" />
                    {sseMessages.length > 0 && (
                      <span className="absolute top-0 right-0 bg-green-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {sseMessages.length}
                      </span>
                    )}
                  </button>
                  <AnimatePresence>
                    {isMessagesOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl z-50 border border-gray-200"
                      >
                        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                          <h3 className="text-lg font-semibold text-gray-800">
                            Messages
                          </h3>
                          {sseMessages.length > 0 && (
                            <button
                              onClick={handleClearMessages}
                              className="text-sm text-blue-600 hover:underline"
                            >
                              Clear All
                            </button>
                          )}
                        </div>
                        <div className="max-h-96 overflow-y-auto">
                          {sseMessages.length === 0 ? (
                            <p className="p-4 text-gray-500 text-center">
                              No messages
                            </p>
                          ) : (
                            sseMessages.map((message) => (
                              <motion.div
                                key={message.id}
                                variants={notificationVariants}
                                initial="hidden"
                                animate="visible"
                                className="p-4 border-b border-gray-100 hover:bg-gray-50"
                              >
                                <p className="text-sm font-medium text-gray-800">
                                  {message.title}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {message.body}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                  {message.timestamp}
                                </p>
                              </motion.div>
                            ))
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <span className="text-sm font-medium hidden sm:block bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                  {userEmail || "Loading..."}
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
          <NotificationListener />
          <div className="flex flex-1 mt-20 md:mt-16">
            <AnimatePresence>
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
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
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
                  {navItems.map((item, index) => (
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
                            ? "bg-emerald-100 text-emerald-600 font-semibold border-l-4 border-emerald-500"
                            : "hover:bg-emerald-50 hover:text-emerald-600"
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
            </AnimatePresence>
            {isSidebarOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black z-30 md:hidden"
                onClick={toggleSidebar}
              />
            )}
            <main className="flex-1 p-6 md:pl-8">{children}</main>
          </div>
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
                Contact:{" "}
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
    </>
  );
}
