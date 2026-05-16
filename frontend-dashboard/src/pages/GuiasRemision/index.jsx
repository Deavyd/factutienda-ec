import { useState } from "react";
import { CheckCircle2, RefreshCw, Search, Truck } from "lucide-react";
import { useGuias } from "../../hooks/useGuias";
import { PageInfoNote, useToast } from "../../components/ui";

export default function GuiasRemisionPage() {
  const { pushToast } = useToast();
  const { data: guias = [], isLoading } = useGuias();
  const [searchTerm, setSearchTerm] = useState("");

  const filtered = guias.filter((g) =>
    g.numero?.includes(searchTerm) || g.transportista_nombre?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) return <div className="flex h-64 items-center justify-center text-slate-500">Cargando guias...</div>;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Guias de Remision</h2>
      <PageInfoNote module="guias" />
      <div className="relative max-w-md">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Buscar guia..." className="w-full rounded-lg border px-10 py-2 dark:bg-neutral-900 dark:border-neutral-700" />
      </div>
      <div className="overflow-hidden rounded-xl border bg-white dark:border-neutral-700 dark:bg-neutral-900">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-neutral-800">
            <tr><th className="px-4 py-3 text-left">Numero</th><th className="px-4 py-3 text-left">Transportista</th><th className="px-4 py-3 text-left">RUC Transp.</th><th className="px-4 py-3 text-left">Fecha</th><th className="px-4 py-3 text-left">Origen</th><th className="px-4 py-3 text-left">Destino</th><th className="px-4 py-3 text-left">Estado SRI</th></tr>
          </thead>
          <tbody>
            {filtered.map((g) => (
              <tr key={g.id} className="border-t dark:border-neutral-800">
                <td className="px-4 py-3 font-mono text-xs">{g.numero}</td>
                <td className="px-4 py-3">{g.transportista_nombre}</td>
                <td className="px-4 py-3 font-mono text-xs">{g.transportista_ruc}</td>
                <td className="px-4 py-3">{g.fecha_emision}</td>
                <td className="px-4 py-3">{g.punto_partida}</td>
                <td className="px-4 py-3">{g.punto_llegada}</td>
                <td className="px-4 py-3">
                  {g.estado_sri === "AUTORIZADA" ? <CheckCircle2 size={14} className="text-emerald-500 inline mr-1" /> : <RefreshCw size={14} className="text-amber-500 inline mr-1" />}
                  {g.estado_sri}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
