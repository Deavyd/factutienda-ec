import { useState } from "react";
import { FileText, Search, XCircle } from "lucide-react";
import { useRetenciones, useAnularRetencion } from "../../hooks/useRetenciones";
import { PageInfoNote, useToast } from "../../components/ui";

export default function RetencionesPage() {
  const { pushToast } = useToast();
  const { data: retenciones = [], isLoading } = useRetenciones();
  const anularRetencion = useAnularRetencion();
  const [searchTerm, setSearchTerm] = useState("");

  const filtered = retenciones.filter((r) =>
    r.numero_retencion?.includes(searchTerm) || r.razon_social_agente?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAnular = async (id) => {
    try {
      await anularRetencion.mutateAsync(id);
      pushToast({ tone: "success", title: "Retencion anulada" });
    } catch { pushToast({ tone: "error", title: "Error al anular" }); }
  };

  if (isLoading) return <div className="flex h-64 items-center justify-center text-slate-500">Cargando retenciones...</div>;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Retenciones</h2>
      <PageInfoNote module="retenciones" />
      <div className="relative max-w-md">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Buscar retencion..." className="w-full rounded-lg border px-10 py-2 dark:bg-neutral-900 dark:border-neutral-700" />
      </div>
      <div className="overflow-hidden rounded-xl border bg-white dark:border-neutral-700 dark:bg-neutral-900">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-neutral-800">
            <tr><th className="px-4 py-3 text-left">Numero</th><th className="px-4 py-3 text-left">Agente</th><th className="px-4 py-3 text-left">RUC Agente</th><th className="px-4 py-3 text-left">Fecha</th><th className="px-4 py-3 text-left">Total retenido</th><th className="px-4 py-3 text-left">Estado</th><th className="px-4 py-3 text-right">Acciones</th></tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} className="border-t dark:border-neutral-800">
                <td className="px-4 py-3 font-mono text-xs">{r.numero_retencion}</td>
                <td className="px-4 py-3">{r.razon_social_agente}</td>
                <td className="px-4 py-3 font-mono text-xs">{r.identificacion_agente}</td>
                <td className="px-4 py-3">{r.fecha_emision}</td>
                <td className="px-4 py-3 font-semibold">${Number(r.total_retenido || 0).toFixed(2)}</td>
                <td className="px-4 py-3">
                  <span className={`rounded px-2 py-1 text-xs font-semibold ${r.estado === "ANULADA" ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}>{r.estado}</span>
                </td>
                <td className="px-4 py-3 text-right">
                  {r.estado === "REGISTRADA" && (
                    <button onClick={() => handleAnular(r.id)} className="text-red-500 hover:text-red-700"><XCircle size={16} /></button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
