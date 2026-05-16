import { CheckCircle2, FileSignature, Loader2, RefreshCw } from "lucide-react";

export default function CheckoutStatusModal({ step }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="flex w-full max-w-sm flex-col items-center rounded-2xl bg-white p-8 text-center shadow-2xl dark:bg-neutral-900">
        {step === "processing" && (
          <>
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
              <Loader2 className="animate-spin" size={32} />
            </div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">Guardando Venta...</h2>
          </>
        )}

        {step === "signing" && (
          <>
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400">
              <FileSignature className="animate-pulse" size={32} />
            </div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">Firmando con .P12...</h2>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Aplicando firma XAdES-BES al XML</p>
          </>
        )}

        {step === "sending" && (
          <>
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400">
              <RefreshCw className="animate-spin" size={32} />
            </div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">Conectando al SRI...</h2>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Consultando Recepcion y Autorizacion</p>
          </>
        )}

        {step === "success" && (
          <>
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
              <CheckCircle2 size={32} />
            </div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">Factura Autorizada</h2>
            <p className="mt-2 break-all text-sm font-mono text-gray-500 dark:text-gray-400">CA: 14052026011790...</p>
          </>
        )}
      </div>
    </div>
  );
}
