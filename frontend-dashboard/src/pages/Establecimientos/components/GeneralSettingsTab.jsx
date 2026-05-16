import { CheckCircle, Image, MonitorSmartphone, Percent } from "lucide-react";

export default function GeneralSettingsTab({
  isDarkMode,
  setDarkMode,
  config,
  onChange,
  onUploadLogo,
  onSave,
  isSaving,
}) {
  return (
    <div className="space-y-8">
      <div>
        <h3 className="mb-1 text-lg font-bold text-gray-900 dark:text-white">Apariencia del Sistema</h3>
        <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">Personaliza los colores y el modo visual.</p>

        <div className="flex flex-col gap-4 sm:flex-row">
          <button onClick={() => setDarkMode(false)} type="button" className={`flex flex-1 items-center justify-center gap-2 rounded-2xl border-2 p-4 transition-all ${!isDarkMode ? "border-blue-600 bg-blue-50/50 dark:bg-blue-900/10" : "border-gray-200 hover:border-blue-300 dark:border-neutral-700"}`}>
            <MonitorSmartphone size={20} className={!isDarkMode ? "text-blue-600" : "text-gray-400"} />
            <span className={`font-medium ${!isDarkMode ? "text-blue-700" : "text-gray-600 dark:text-gray-400"}`}>Modo Claro</span>
            {!isDarkMode ? <CheckCircle size={16} className="ml-auto text-blue-600" /> : null}
          </button>

          <button onClick={() => setDarkMode(true)} type="button" className={`flex flex-1 items-center justify-center gap-2 rounded-2xl border-2 p-4 transition-all ${isDarkMode ? "border-blue-600 bg-blue-50/50 dark:bg-blue-900/20" : "border-gray-200 hover:border-blue-300 dark:border-neutral-700"}`}>
            <MonitorSmartphone size={20} className={isDarkMode ? "text-blue-400" : "text-gray-400"} />
            <span className={`font-medium ${isDarkMode ? "text-blue-400" : "text-gray-600 dark:text-gray-400"}`}>Modo Oscuro</span>
            {isDarkMode ? <CheckCircle size={16} className="ml-auto text-blue-400" /> : null}
          </button>
        </div>
      </div>

      <div className="border-t border-gray-100 pt-4 dark:border-neutral-800">
        <h3 className="mb-1 text-lg font-bold text-gray-900 dark:text-white">Datos Basicos del Negocio</h3>
        <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">Informacion que aparecera en los reportes internos.</p>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="ml-1 text-xs font-medium text-gray-500 dark:text-gray-400">Nombre Comercial</label>
            <input type="text" value={config.businessName} onChange={(e) => onChange("businessName", e.target.value)} className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm outline-none transition-all focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white" />
          </div>
          <div>
            <label className="ml-1 text-xs font-medium text-gray-500 dark:text-gray-400">Telefono</label>
            <input type="text" value={config.phone} onChange={(e) => onChange("phone", e.target.value)} className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm outline-none transition-all focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white" />
          </div>
          <div className="md:col-span-2">
            <label className="ml-1 text-xs font-medium text-gray-500 dark:text-gray-400">Direccion Matriz</label>
            <input type="text" value={config.address} onChange={(e) => onChange("address", e.target.value)} className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm outline-none transition-all focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <div>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white"><Image size={16} /> Logo del Negocio (Tickets)</h3>
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 text-gray-400 dark:border-neutral-700 dark:bg-neutral-800">
              {config.logoUrl ? <img src={config.logoUrl} alt="Logo" className="h-full w-full object-cover" /> : <Image size={24} />}
            </div>
            <label className="cursor-pointer rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-gray-50 dark:border-neutral-700 dark:bg-neutral-800 dark:hover:bg-neutral-700">
              Subir Imagen
              <input type="file" accept="image/*" className="hidden" onChange={(e) => onUploadLogo(e.target.files?.[0])} />
            </label>
          </div>
        </div>

        <div>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white"><Percent size={16} /> Configuracion de Impuestos</h3>
          <div>
            <label className="ml-1 text-xs font-medium text-gray-500 dark:text-gray-400">IVA por Defecto (%)</label>
            <select value={config.defaultVat} onChange={(e) => onChange("defaultVat", e.target.value)} className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white">
              <option value="15">15% (Actual 2026)</option>
              <option value="12">12%</option>
              <option value="8">8%</option>
              <option value="0">0%</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex justify-end border-t border-gray-100 pt-4 dark:border-neutral-800">
        <button onClick={onSave} disabled={isSaving} className="rounded-xl bg-blue-600 px-6 py-2.5 font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:opacity-60" type="button">
          {isSaving ? "Guardando..." : "Guardar Cambios"}
        </button>
      </div>
    </div>
  );
}
