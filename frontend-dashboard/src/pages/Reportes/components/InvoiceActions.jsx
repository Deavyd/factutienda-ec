import { FileCode, FileText, RefreshCw } from "lucide-react";

export default function InvoiceActions({ invoice }) {
  return (
    <div className="flex justify-end gap-2">
      {invoice.sriStatus === "DEVUELTA" ? (
        <button className="rounded p-2 text-gray-400 hover:bg-orange-100 hover:text-orange-600 dark:hover:bg-neutral-800" title="Reintentar envio WS SRI" type="button">
          <RefreshCw size={18} />
        </button>
      ) : null}
      {invoice.sriStatus === "AUTORIZADO" ? (
        <>
          <button className="rounded p-2 text-gray-400 hover:bg-gray-100 hover:text-blue-600 dark:hover:bg-neutral-800" title="Descargar RIDE (PDF)" type="button">
            <FileText size={18} />
          </button>
          <button className="rounded p-2 text-gray-400 hover:bg-gray-100 hover:text-blue-600 dark:hover:bg-neutral-800" title="Descargar XML firmado" type="button">
            <FileCode size={18} />
          </button>
        </>
      ) : null}
    </div>
  );
}
