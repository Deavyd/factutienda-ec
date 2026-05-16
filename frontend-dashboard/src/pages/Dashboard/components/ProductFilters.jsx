import { useRef, useState } from "react";
import {
  AlertTriangle,
  Clock,
  LayoutGrid,
  List,
  Printer,
  ScanBarcode,
  Search,
  Settings,
  Volume2,
  Unlock,
  X,
  Zap,
} from "lucide-react";

export default function ProductFilters({
  searchTerm,
  onSearchChange,
  categories,
  activeCategory,
  onCategoryChange,
  onBarcodeSubmit,
  prefs = {
    viewMode: "grid",
    checkoutSpeed: "sri",
    showBarcode: true,
    autoPrint: true,
    sounds: true,
    openDrawer: true,
    scannerDelay: 1000,
    confirmDelete: false,
  },
  onPrefsChange = () => {},
}) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isScannerFocused, setIsScannerFocused] = useState(false);
  const barcodeInputRef = useRef(null);

  const [barcodeTerm, setBarcodeTerm] = useState("");

  const handleBarcodeSubmit = (e) => {
    e.preventDefault();
    if (onBarcodeSubmit) onBarcodeSubmit(barcodeTerm);
    setBarcodeTerm("");
  };

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex flex-1 items-center rounded-xl border border-gray-200 bg-white p-3 shadow-sm transition-all focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 dark:border-neutral-800 dark:bg-neutral-900 dark:text-white">
          <Search className="mr-3 text-gray-400" size={20} />
          <input type="text" placeholder="Buscar por nombre..." value={searchTerm} onChange={(e) => onSearchChange(e.target.value)} className="w-full bg-transparent text-sm text-gray-700 outline-none dark:text-gray-200" />
        </div>

        {prefs.showBarcode ? (
          <div className={`flex flex-1 items-center rounded-xl border p-3 shadow-sm transition-all cursor-text ${isScannerFocused ? "border-blue-400 bg-blue-50 ring-2 ring-blue-100 dark:border-blue-500 dark:bg-blue-900/20" : "border-gray-200 bg-white hover:border-blue-300 dark:border-neutral-800 dark:bg-neutral-900"}`}>
            <div className="relative mr-3">
              <ScanBarcode className={isScannerFocused ? "text-blue-600 dark:text-blue-400" : "text-gray-400"} size={20} />
              {isScannerFocused ? (
                <span className="absolute -right-1 -top-1 flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-blue-500" />
                </span>
              ) : null}
            </div>
            <form onSubmit={handleBarcodeSubmit} className="w-full flex-1">
              <input ref={barcodeInputRef} type="text" placeholder="Escáner listo... (Ej. 7861)" value={barcodeTerm} onChange={(e) => setBarcodeTerm(e.target.value)} onFocus={() => setIsScannerFocused(true)} onBlur={() => setIsScannerFocused(false)} className={`w-full bg-transparent text-sm font-medium outline-none transition-colors ${isScannerFocused ? "text-blue-900 placeholder:text-blue-400" : "text-gray-600 placeholder:text-gray-400 dark:text-gray-300"}`} />
              <button type="submit" className="hidden">Escanear</button>
            </form>
          </div>
        ) : null}

        <button onClick={() => setIsSettingsOpen(!isSettingsOpen)} className={`flex-shrink-0 rounded-xl border p-3 shadow-sm transition-all ${isSettingsOpen ? "border-slate-900 bg-slate-900 text-white" : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-gray-300"}`}>
          <Settings size={20} />
        </button>
      </div>

      {isSettingsOpen ? (
        <div className="relative z-50">
          <div className="absolute right-0 top-0 w-80 rounded-2xl border border-gray-100 bg-white shadow-2xl dark:border-neutral-700 dark:bg-neutral-900">
            <div className="flex items-center justify-between border-b border-gray-100 bg-slate-50 p-4 dark:border-neutral-700 dark:bg-neutral-800">
              <h3 className="text-sm font-bold text-gray-800 dark:text-white">Configuracion de Caja</h3>
              <button onClick={() => setIsSettingsOpen(false)} className="text-gray-400 hover:text-gray-800 dark:hover:text-white"><X size={16} /></button>
            </div>
            <div className="max-h-[60vh] space-y-5 overflow-y-auto p-4">
              <div>
                <p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-gray-400">Interfaz de Ventas</p>
                <div className="mb-4 flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"><LayoutGrid size={16} className="text-blue-500" /> Vista de Items</span>
                  <div className="flex rounded-lg bg-gray-100 p-1 dark:bg-neutral-800">
                    <button onClick={() => onPrefsChange("viewMode", "grid")} className={`rounded-md p-1.5 ${prefs.viewMode === "grid" ? "bg-white shadow-sm dark:bg-neutral-700" : "text-gray-400"}`}><LayoutGrid size={14} /></button>
                    <button onClick={() => onPrefsChange("viewMode", "list")} className={`rounded-md p-1.5 ${prefs.viewMode === "list" ? "bg-white shadow-sm dark:bg-neutral-700" : "text-gray-400"}`}><List size={14} /></button>
                  </div>
                </div>
                <div className="mb-4 flex flex-col gap-2">
                  <span className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"><Zap size={16} className="text-blue-500" /> Velocidad de Cobro</span>
                  <div className="flex w-full rounded-lg bg-gray-100 p-1 dark:bg-neutral-800">
                    {[{ label: "SRI (Largo)", val: "sri" }, { label: "Turbo", val: "turbo" }, { label: "Ninguna", val: "instant" }].map((opt) => (
                      <button key={opt.val} onClick={() => onPrefsChange("checkoutSpeed", opt.val)} className={`flex-1 rounded-md py-1.5 text-xs font-medium transition-all ${prefs.checkoutSpeed === opt.val ? "bg-white text-blue-600 shadow-sm dark:bg-neutral-700 dark:text-blue-400" : "text-gray-500 hover:bg-gray-200 dark:hover:bg-neutral-700"}`}>{opt.label}</button>
                    ))}
                  </div>
                </div>
                <Switch label="Confirmar al eliminar" icon={AlertTriangle} iconColor="text-amber-500" checked={prefs.confirmDelete} onChange={(v) => onPrefsChange("confirmDelete", v)} />
              </div>
              <div className="border-t border-gray-100 pt-4 dark:border-neutral-700">
                <p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-gray-400">Hardware Externo</p>
                <Switch label="Abrir Caja (Efectivo)" icon={Unlock} iconColor="text-emerald-500" checked={prefs.openDrawer} onChange={(v) => onPrefsChange("openDrawer", v)} />
                <div className="mt-4"><Switch label="Auto-Impresion Ticket" icon={Printer} checked={prefs.autoPrint} onChange={(v) => onPrefsChange("autoPrint", v)} /></div>
                <div className="mt-4"><Switch label="Sonidos (Bip de caja)" icon={Volume2} checked={prefs.sounds} onChange={(v) => onPrefsChange("sounds", v)} /></div>
              </div>
              <div className="border-t border-gray-100 pt-4 dark:border-neutral-700">
                <p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-gray-400">Lector de Codigos</p>
                <Switch label="Activar Lector UI" icon={ScanBarcode} iconColor="text-indigo-500" checked={prefs.showBarcode} onChange={(v) => onPrefsChange("showBarcode", v)} />
                <div className="mt-4 flex flex-col gap-2">
                  <span className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"><Clock size={16} className="text-indigo-500" /> Retraso Anti-Eco</span>
                  <div className="flex w-full rounded-lg bg-gray-100 p-1 dark:bg-neutral-800">
                    {[{ label: "0.5s", val: 500 }, { label: "1s", val: 1000 }, { label: "2s", val: 2000 }].map((opt) => (
                      <button key={opt.val} onClick={() => onPrefsChange("scannerDelay", opt.val)} className={`flex-1 rounded-md py-1.5 text-xs font-medium transition-all ${prefs.scannerDelay === opt.val ? "bg-white text-indigo-600 shadow-sm dark:bg-neutral-700 dark:text-indigo-400" : "text-gray-500 hover:bg-gray-200 dark:hover:bg-neutral-700"}`}>{opt.label}</button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div className="flex gap-2 overflow-x-auto pb-1">
        {categories.map((cat) => (
          <button key={cat} onClick={() => onCategoryChange(cat)} className={`whitespace-nowrap rounded-xl px-5 py-2 text-sm transition-all ${activeCategory === cat ? "bg-slate-900 font-medium text-white shadow-sm dark:bg-white dark:text-slate-900" : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-gray-300"}`} type="button">
            {cat}
          </button>
        ))}
      </div>
    </>
  );
}

function Switch({ label, icon: Icon, iconColor = "text-gray-500", checked, onChange }) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">{Icon ? <Icon size={16} className={iconColor} /> : null}{label}</span>
      <label className="relative inline-flex cursor-pointer items-center">
        <input type="checkbox" className="peer sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <div className="h-5 w-9 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none dark:bg-neutral-700" />
      </label>
    </div>
  );
}
