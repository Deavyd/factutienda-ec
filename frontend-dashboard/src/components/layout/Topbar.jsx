import { Bell, Menu, Moon, Sun } from "lucide-react";
import useAuth from "../../hooks/useAuth";

export default function Topbar({ toggleSidebar, isDarkMode, toggleTheme }) {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200 bg-white/85 px-6 backdrop-blur-md transition-colors duration-300 dark:border-neutral-800 dark:bg-neutral-900/85">
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="lg:hidden rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-neutral-800"
          type="button"
        >
          <Menu size={20} />
        </button>
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Panel Administrativo</h2>
      </div>

      <div className="flex items-center gap-2">
        <button
          className="rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-neutral-800"
          type="button"
        >
          <Bell size={20} />
        </button>
        <button
          onClick={toggleTheme}
          className="rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-neutral-800"
          type="button"
        >
          {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        <div className="ml-2 hidden sm:block text-sm text-gray-700 dark:text-gray-300">
          {user ? `${user.nombres} ${user.apellidos}` : "Usuario"}
        </div>
        <button
          type="button"
          onClick={logout}
          className="ml-2 rounded-lg bg-slate-900 px-3 py-1.5 text-sm text-white dark:bg-slate-100 dark:text-slate-900"
        >
          Salir
        </button>
      </div>
    </header>
  );
}
