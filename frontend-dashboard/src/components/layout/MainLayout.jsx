import { Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import { ToastProvider } from "../ui";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window === "undefined") return false;
    const saved = localStorage.getItem("theme");
    if (saved) return saved === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDarkMode]);

  return (
    <ToastProvider>
      <div className="flex h-screen overflow-hidden bg-white transition-colors duration-300 dark:bg-neutral-900">
        <Sidebar isOpen={sidebarOpen} closeSidebar={() => setSidebarOpen(false)} />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Topbar
            toggleSidebar={() => setSidebarOpen((prev) => !prev)}
            isDarkMode={isDarkMode}
            toggleTheme={() => setIsDarkMode((prev) => !prev)}
          />
          <main className="flex-1 overflow-y-auto bg-gray-50/60 p-6 dark:bg-neutral-950">
            <div className="mx-auto max-w-7xl">
              <Outlet context={{ isDarkMode, toggleTheme: () => setIsDarkMode((prev) => !prev) }} />
            </div>
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}
