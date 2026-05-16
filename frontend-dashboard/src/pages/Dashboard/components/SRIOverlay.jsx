import { CheckCircle2, FileText, Smartphone } from "lucide-react";

export default function SRIOverlay({ status, autoPrint }) {
  if (status === "AUTORIZADO_TURBO") {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-emerald-500/20 backdrop-blur-sm">
        <div className="flex flex-col items-center rounded-3xl bg-white p-6 shadow-2xl dark:bg-neutral-900">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30"><CheckCircle2 className="text-emerald-500 dark:text-emerald-400" size={40} /></div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Cobrado!</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{autoPrint ? "Imprimiendo ticket..." : "Transaccion exitosa"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/95 backdrop-blur-sm dark:bg-neutral-900/95">
      <div className="flex flex-col items-center text-center">
        <div className="relative mb-6 h-28 w-28">
          {status === "FIRMA" ? (
            <>
              <div className="absolute inset-0 flex items-center justify-center"><div className="h-24 w-24 animate-spin rounded-full border-4 border-blue-100 border-t-blue-500 dark:border-blue-900/30 dark:border-t-blue-500" /></div>
              <FileText className="absolute inset-0 m-auto text-blue-500" size={32} />
            </>
          ) : status === "ENVIANDO" ? (
            <>
              <div className="absolute inset-0 flex items-center justify-center"><div className="h-24 w-24 animate-spin rounded-full border-4 border-amber-100 border-t-amber-500 dark:border-amber-900/30 dark:border-t-amber-500" /></div>
              <Smartphone className="absolute inset-0 m-auto text-amber-500" size={32} />
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-emerald-100 shadow-lg shadow-emerald-100 dark:bg-emerald-900/30 dark:shadow-emerald-900/30"><CheckCircle2 className="text-emerald-500 dark:text-emerald-400" size={48} /></div>
            </div>
          )}
        </div>
        <h2 className="mb-2 text-3xl font-bold text-gray-800 dark:text-white">
          {status === "FIRMA" ? "Firmando Factura..." : status === "ENVIANDO" ? "Enviando al SRI..." : "Factura Autorizada!"}
        </h2>
        <p className="text-base text-gray-500 dark:text-gray-400">
          {status === "FIRMA" ? "Aplicando firma electronica P12" : status === "ENVIANDO" ? "Conectando con el servidor del SRI" : "El comprobante ha sido enviado al correo"}
        </p>
      </div>
    </div>
  );
}
