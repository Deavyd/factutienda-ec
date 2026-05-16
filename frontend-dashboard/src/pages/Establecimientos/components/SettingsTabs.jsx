import { Globe, Palette, Printer } from "lucide-react";

const SETTINGS_TABS = [
  { id: "general", name: "General y Apariencia", icon: Palette },
  { id: "sri", name: "Facturacion Electronica SRI", icon: Globe },
  { id: "printers", name: "Impresoras y Hardware", icon: Printer },
];

export default function SettingsTabs({ activeTab, onChange }) {
  return (
    <div className="h-fit w-full shrink-0 rounded-3xl border border-gray-100 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 lg:w-72">
      <h2 className="mb-6 px-2 text-xl font-bold text-gray-800 dark:text-white">Configuracion</h2>
      <div className="flex flex-col gap-1">
        {SETTINGS_TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              type="button"
              className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                  : "text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-neutral-800"
              }`}
            >
              <Icon size={18} /> {tab.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
