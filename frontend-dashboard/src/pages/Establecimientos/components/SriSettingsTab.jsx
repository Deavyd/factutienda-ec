import { Check, CheckCircle, Loader, Mail, RefreshCw, ShieldCheck, UploadCloud } from "lucide-react";

export default function SriSettingsTab({
  sriStatus,
  onCheckSri,
  config,
  onChangeConfig,
  onSave,
  isSaving,
  sigStatus,
  onValidateSignature,
  onUploadSignature,
}) {
  return (
    <div className="space-y-8">
      <div className="flex flex-col items-start justify-between gap-4 border-b border-gray-100 pb-4 dark:border-neutral-800 sm:flex-row sm:items-center">
        <div>
          <h3 className="mb-1 text-lg font-bold text-gray-900 dark:text-white">Integracion SRI Offline</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Requerimientos gubernamentales (Modulo 11, XAdES-BES).</p>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-800">
          {sriStatus === "checking" ? <Loader size={16} className="animate-spin text-blue-500" /> : sriStatus === "online" ? <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-green-500" /> : <div className="h-2.5 w-2.5 rounded-full bg-red-500" />}
          <span className="mr-2 text-sm font-medium text-gray-700 dark:text-gray-300">{sriStatus === "checking" ? "Conectando..." : sriStatus === "online" ? "SRI En Linea" : "SRI Caido"}</span>
          <button onClick={onCheckSri} disabled={sriStatus === "checking"} className="text-gray-400 transition-colors hover:text-blue-500" title="Comprobar conexion" type="button">
            <RefreshCw size={14} className={sriStatus === "checking" ? "opacity-50" : ""} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <div>
            <label className="ml-1 text-xs font-medium text-gray-500 dark:text-gray-400">Ambiente de Trabajo</label>
            <div className="mt-1 flex rounded-xl border border-gray-200 bg-gray-50 p-1 dark:border-neutral-700 dark:bg-neutral-800">
              <button onClick={() => onChangeConfig("ambiente", "PRUEBAS")} className={`flex-1 rounded-lg py-2 text-sm ${config.ambiente === "PRUEBAS" ? "bg-white font-semibold shadow-sm dark:bg-neutral-700 dark:text-white" : "font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"}`} type="button">Pruebas</button>
              <button onClick={() => onChangeConfig("ambiente", "PRODUCCION")} className={`flex-1 rounded-lg py-2 text-sm ${config.ambiente === "PRODUCCION" ? "bg-white font-semibold shadow-sm dark:bg-neutral-700 dark:text-white" : "font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"}`} type="button">Produccion</button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="ml-1 text-xs font-medium text-gray-500 dark:text-gray-400">Establecimiento</label>
              <input type="text" value={config.establecimiento} maxLength="3" onChange={(e) => onChangeConfig("establecimiento", e.target.value)} className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white" />
            </div>
            <div>
              <label className="ml-1 text-xs font-medium text-gray-500 dark:text-gray-400">Punto Emision</label>
              <input type="text" value={config.puntoEmision} maxLength="3" onChange={(e) => onChangeConfig("puntoEmision", e.target.value)} className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white" />
            </div>
          </div>

          <div>
            <label className="ml-1 text-xs font-medium text-gray-500 dark:text-gray-400">RUC Emisor</label>
            <input type="text" value={config.ruc} maxLength="13" onChange={(e) => onChangeConfig("ruc", e.target.value)} className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 p-3 font-mono text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white" />
          </div>
        </div>

        <div className="space-y-4">
          <div className="group rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/50 p-6 text-center transition-colors hover:bg-gray-50 dark:border-neutral-700 dark:bg-neutral-800/50 dark:hover:bg-neutral-800">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600 transition-transform group-hover:scale-110 dark:bg-blue-900/30"><UploadCloud size={24} /></div>
            <h4 className="text-sm font-bold text-gray-900 dark:text-white">Firma Electronica (.p12)</h4>
            <label className="mt-1 inline-block cursor-pointer text-xs text-gray-500 dark:text-gray-400">
              Arrastra el archivo o <span className="font-medium text-blue-600">explora</span>
              <input type="file" accept=".p12,.pfx" className="hidden" onChange={(e) => onUploadSignature(e.target.files?.[0])} />
            </label>
            {config.firmaNombre ? <div className="mx-auto mt-3 flex w-fit items-center gap-1 rounded-lg bg-green-50 px-3 py-1.5 text-xs font-medium text-green-600 dark:bg-green-900/20 dark:text-green-400"><Check size={14} /> {config.firmaNombre} (Subido)</div> : null}
          </div>

          <div>
            <input type="password" placeholder="Contrasena de la firma" value={config.signaturePassword || ""} onChange={(e) => onChangeConfig("signaturePassword", e.target.value)} className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white" />
            <div className="mt-3 flex justify-end">
              <button onClick={onValidateSignature} disabled={sigStatus === "validating"} className="flex items-center gap-2 rounded-xl bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 disabled:opacity-50 dark:bg-neutral-800 dark:text-gray-300 dark:hover:bg-neutral-700" type="button">
                {sigStatus === "validating" ? <Loader size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
                {sigStatus === "valid" ? "Firma Valida" : "Validar Firma"}
              </button>
            </div>
            {sigStatus === "valid" ? <p className="mt-2 flex items-center justify-end gap-1 text-xs text-green-600 dark:text-green-400"><CheckCircle size={12} /> Contrasena correcta y firma vigente.</p> : null}
          </div>
        </div>
      </div>

      <div className="border-t border-gray-100 pt-4 dark:border-neutral-800">
        <h3 className="mb-4 flex items-center gap-2 text-base font-bold text-gray-900 dark:text-white"><Mail size={18} /> Envio Automatico de Facturas por Correo</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="ml-1 text-xs font-medium text-gray-500 dark:text-gray-400">Servidor SMTP</label>
            <input type="text" value={config.smtpHost || ""} onChange={(e) => onChangeConfig("smtpHost", e.target.value)} className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="ml-1 text-xs font-medium text-gray-500 dark:text-gray-400">Puerto</label>
              <input type="text" value={config.smtpPort || ""} onChange={(e) => onChangeConfig("smtpPort", e.target.value)} className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-center text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white" />
            </div>
            <div className="flex items-center pt-5">
              <label className="flex cursor-pointer items-center gap-2">
                <input type="checkbox" checked={Boolean(config.smtpSecure)} onChange={(e) => onChangeConfig("smtpSecure", e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                <span className="text-sm text-gray-700 dark:text-gray-300">SSL/TLS</span>
              </label>
            </div>
          </div>
          <div>
            <label className="ml-1 text-xs font-medium text-gray-500 dark:text-gray-400">Correo Remitente</label>
            <input type="email" value={config.smtpFrom || ""} onChange={(e) => onChangeConfig("smtpFrom", e.target.value)} className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white" />
          </div>
          <div>
            <label className="ml-1 text-xs font-medium text-gray-500 dark:text-gray-400">Contrasena de Aplicacion</label>
            <input type="password" value={config.smtpPassword || ""} onChange={(e) => onChangeConfig("smtpPassword", e.target.value)} className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white" />
          </div>
        </div>
      </div>

      <div className="flex justify-end border-t border-gray-100 pt-4 dark:border-neutral-800">
        <button onClick={onSave} disabled={isSaving} className="rounded-xl bg-blue-600 px-6 py-2.5 font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:opacity-60" type="button">
          {isSaving ? "Guardando..." : "Guardar Configuracion SRI"}
        </button>
      </div>
    </div>
  );
}
