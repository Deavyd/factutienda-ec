import { Printer } from "lucide-react";

export default function PrintersTab({ config, onChange, onSave, isSaving }) {
  return (
    <div className="space-y-8">
      <div>
        <h3 className="mb-1 text-lg font-bold text-gray-900 dark:text-white">Impresoras y Hardware</h3>
        <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">Configura los dispositivos conectados a esta caja.</p>

        <div className="space-y-6">
          <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-5 dark:border-neutral-800 dark:bg-neutral-800/30">
            <h4 className="mb-4 flex items-center gap-2 font-semibold text-gray-800 dark:text-gray-200">
              <Printer size={18} /> Impresora de Tickets (Termica)
            </h4>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="ml-1 text-xs font-medium text-gray-500 dark:text-gray-400">Seleccionar Impresora</label>
                <select value={config.printerName} onChange={(e) => onChange("printerName", e.target.value)} className="mt-1 w-full rounded-xl border border-gray-200 bg-white p-3 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white">
                  <option>POS-80C (USB)</option>
                  <option>Epson TM-T20III</option>
                  <option>Microsoft Print to PDF</option>
                </select>
              </div>
              <div>
                <label className="ml-1 text-xs font-medium text-gray-500 dark:text-gray-400">Tamano del Papel</label>
                <select value={config.paperSize} onChange={(e) => onChange("paperSize", e.target.value)} className="mt-1 w-full rounded-xl border border-gray-200 bg-white p-3 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white">
                  <option value="80mm">80mm (Recomendado)</option>
                  <option value="58mm">58mm</option>
                </select>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-5 dark:border-neutral-800 dark:bg-neutral-800/30">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-gray-800 dark:text-gray-200">Gaveta de Dinero</h4>
                <p className="mt-1 text-xs text-gray-500">Apertura automatica al registrar pagos en efectivo.</p>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input type="checkbox" checked={Boolean(config.cashDrawerEnabled)} onChange={(e) => onChange("cashDrawerEnabled", e.target.checked)} className="peer sr-only" />
                <div className="h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none dark:bg-neutral-700 dark:border-gray-600" />
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end border-t border-gray-100 pt-4 dark:border-neutral-800">
        <button onClick={onSave} disabled={isSaving} className="rounded-xl bg-blue-600 px-6 py-2.5 font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:opacity-60" type="button">
          {isSaving ? "Guardando..." : "Guardar Configuracion de Hardware"}
        </button>
      </div>
    </div>
  );
}
