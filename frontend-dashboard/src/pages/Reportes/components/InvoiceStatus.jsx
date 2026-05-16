import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Badge } from "../../../components/ui";

export default function InvoiceStatus({ invoice }) {
  if (invoice.sriStatus === "AUTORIZADO") {
    return (
      <Badge tone="success" className="inline-flex items-center gap-1">
        <CheckCircle2 size={14} /> Autorizado
      </Badge>
    );
  }

  if (invoice.sriStatus === "DEVUELTA") {
    return (
      <>
        <Badge tone="danger" className="inline-flex items-center gap-1" title={invoice.error}>
          <AlertCircle size={14} /> Devuelta
        </Badge>
        <div className="mt-1 max-w-[200px] truncate text-[10px] text-red-500" title={invoice.error}>
          {invoice.error}
        </div>
      </>
    );
  }

  return (
    <Badge tone="warning" className="inline-flex items-center gap-1">
      <Loader2 size={14} className="animate-spin" /> Procesando
    </Badge>
  );
}
