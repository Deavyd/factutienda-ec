import { useState } from "react";
import { CheckCircle2, RefreshCw, Search } from "lucide-react";
import { useLiquidaciones } from "../../hooks/useLiquidaciones";
import { PageInfoNote, useToast } from "../../components/ui";

export default function LiquidacionesPage() {
  const { pushToast } = useToast();
  const { data: liquidaciones = [], isLoading } = useLiquidaciones();
  const [searchTerm, setSearchTerm] = useState("");

  const filtered = liquidaciones.filter((l) =>
    l.numero?.includes(searchTerm) || l.proveedor_nombre?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) return <div className="flex h-64 items-center justify-center text-slate-500">Cargando liquidaciones...</div>;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Liquidaciones de Compra</h2>
      <PageInfoNote module="liquidaciones" />
      <div className="relative max-w-md">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Buscar liquidacion..." className="w-full rounded-lg border px-10 py-2 dark:bg-neutral-900 dark:border-neutral-700" />
      </div>
      <div className="overflow-hidden rounded-xl border bg-white dark:border-neutral-700 dark:bg-neutral-900">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-neutral-800">
            <tr><th className="px-4 py-3 text-left">Numero</th><th className="px-4 py-3 text-left">Proveedor</th><th className="px-4 py-3 text-left">Cedula</th><th className="px-4 py-3 text-left">Fecha</th><th className="px-4 py-3 text-left">Base 0%</th><th className="px-4 py-3 text-left">Base 15%</th><th className="px-4 py-3 text-left">IVA</th><th className="px-4 py-3 text-left">Total</th><th className="px-4 py-3 text-left">Estado SRI</th></tr>
          </thead>
          <tbody>
            {filtered.map((l) => (
              <tr key={l.id} className="border-t dark:border-neutral-800">
                <td className="px-4 py-3 font-mono text-xs">{l.numero}</td>
                <td className="px-4 py-3">{l.proveedor_nombre}</td>
                <td className="px-4 py-3 font-mono text-xs">{l.proveedor_cedula}</td>
                <td className="px-4 py-3">{l.fecha_emision}</td>
                <td className="px-4 py-3">${Number(l.subtotal_0 || 0).toFixed(2)}</td>
                <td className="px-4 py-3">${Number(l.subtotal_15 || 0).toFixed(2)}</td>
                <td className="px-4 py-3">${Number(l.iva || 0).toFixed(2)}</td>
                <td className="px-4 py-3 font-semibold">${Number(l.total || 0).toFixed(2)}</td>
                <td className="px-4 py-3">
                  {l.estado_sri === "AUTORIZADA" ? <CheckCircle2 size={14} className="text-emerald-500 inline mr-1" /> : <RefreshCw size={14} className="text-amber-500 inline mr-1" />}
                  {l.estado_sri}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
