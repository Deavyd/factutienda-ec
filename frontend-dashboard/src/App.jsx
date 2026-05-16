import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";
import { AppRoutes } from "./routes";

export default function App() {
  const [isOffline, setIsOffline] = useState(() => !navigator.onLine);
  const [forceOffline, setForceOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    if (!import.meta.env.DEV) return undefined;
    const onKeyDown = (event) => {
      if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === "o") {
        event.preventDefault();
        setForceOffline((prev) => !prev);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const offlineActive = isOffline || forceOffline;

  return (
    <div
      className={`min-h-screen bg-zinc-950 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
        offlineActive ? "p-2 md:p-4" : "p-0"
      }`}
    >
      <div
        className={`fixed top-0 left-0 z-50 flex w-full justify-center transition-transform duration-300 ease-out ${
          offlineActive ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        <div className="rounded-b-2xl border border-red-400/50 bg-red-500/90 px-6 py-1.5 text-sm font-bold text-white shadow-[0_4px_20px_-4px_rgba(239,68,68,0.5)] backdrop-blur-md">
          <span className="flex items-center gap-2">
            <WifiOff size={16} className="animate-pulse" />
            Sin conexion a Internet - Modo Offline Activado
          </span>
        </div>
      </div>

      <div
        className={`min-h-screen w-full bg-white transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          offlineActive
            ? "scale-[0.99] overflow-hidden rounded-[2rem] shadow-[0_0_0_1px_rgba(239,68,68,0.3),0_20px_40px_-10px_rgba(0,0,0,0.5)]"
            : "scale-100 rounded-none shadow-none"
        }`}
      >
        <AppRoutes />
      </div>

      {import.meta.env.DEV ? (
        <button
          type="button"
          onClick={() => setForceOffline((prev) => !prev)}
          className="fixed bottom-4 right-4 z-50 rounded-full border border-zinc-700 bg-zinc-900/90 px-4 py-2 text-xs font-semibold text-white shadow-lg backdrop-blur-md hover:bg-zinc-800"
        >
          QA Offline: {forceOffline ? "ON" : "OFF"}
        </button>
      ) : null}
    </div>
  );
}
