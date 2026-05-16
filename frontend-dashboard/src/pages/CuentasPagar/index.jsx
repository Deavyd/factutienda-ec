import { useState } from "react";
import { AlertCircle, Calendar, CheckCircle2, DollarSign, FileText, Search } from "lucide-react";
import { useCuentasPagar, usePagarCuenta } from "../../hooks/useCuentasPagar";
import { PageInfoNote, useToast } from "../../components/ui";

export default function CuentasPagarPage() {
  const { pushToast } = useToast();
  const { data: cuentas = [], isLoading } = useCuentasPagar();
  const pagarCuenta = usePagarCuenta();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [abono, setAbono] = useState({ monto: "", forma_pago: "EFECTIVO" });

  const totalPagar = cuentas.reduce((s, c) => s + Number(c.monto_pendiente || 0), 0);
  const vencidas = cuentas.filter((c) => c.fecha_vencimiento < new Date().toISOString().slice(0, 10) && Number(c.monto_pendiente) > 0).length;

  const filtered = cuentas.filter((c) => String(c.id).includes(searchTerm));

  const handlePagar = async (e) => {
    e.preventDefault();
    try {
      await pagarCuenta.mutateAsync({ id: selectedId, data: { monto: Number(abono.monto), forma_pago: abono.forma_pago } });
      pushToast({ tone: "success", title: "Abono registrado" });
      setSelectedId(null);
      setAbono({ monto: "", forma_pago: "EFECTIVO" });
    } catch { pushToast({ tone: "error", title: "Error al registrar abono" }); }
  };

  if (isLoading) return <div className="flex h-64 items-center justify-center text-slate-500">Cargando cuentas...</div>;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Cuentas por Pagar</h2>
      <PageInfoNote module="cuentasPagar" />
      <div className="grid grid-cols-3 gap-4">
        <Stat title="Total por pagar" value={`$${totalPagar.toFixed(2)}`} tone="amber" />
        <Stat title="Vencidas" value={vencidas} tone="red" />
        <Stat title="Documentos" value={cuentas.length} tone="slate" />
      </div>
      <div className="relative max-w-md">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Buscar cuenta..." className="w-full rounded-lg border px-10 py-2 dark:bg-neutral-900 dark:border-neutral-700" />
      </div>
      <div className="overflow-hidden rounded-xl border bg-white dark:border-neutral-700 dark:bg-neutral-900">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-neutral-800">
            <tr><th className="px-4 py-3 text-left">Cuenta #</th><th className="px-4 py-3 text-left">Proveedor</th><th className="px-4 py-3 text-left">Total</th><th className="px-4 py-3 text-left">Pagado</th><th className="px-4 py-3 text-left">Pendiente</th><th className="px-4 py-3 text-left">Vence</th><th className="px-4 py-3 text-left">Estado</th><th className="px-4 py-3 text-right">Acciones</th></tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id} className="border-t dark:border-neutral-800">
                <td className="px-4 py-3 font-mono text-xs">#{c.id}</td>
                <td className="px-4 py-3">#{c.proveedor_id}</td>
                <td className="px-4 py-3">${Number(c.monto_total || 0).toFixed(2)}</td>
                <td className="px-4 py-3 text-emerald-600">${Number(c.monto_pagado || 0).toFixed(2)}</td>
                <td className="px-4 py-3 font-semibold text-amber-600">${Number(c.monto_pendiente || 0).toFixed(2)}</td>
                <td className="px-4 py-3">{c.fecha_vencimiento}</td>
                <td className="px-4 py-3">
                  {c.estado === "PAGADA" ? <CheckCircle2 size={14} className="text-emerald-500 inline mr-1" /> : <AlertCircle size={14} className="text-amber-500 inline mr-1" />}
                  {c.estado}
                </td>
                <td className="px-4 py-3 text-right">
                  {Number(c.monto_pendiente) > 0 && (
                    <button onClick={() => { setSelectedId(c.id); setAbono({ monto: "", forma_pago: "EFECTIVO" }); }} className="rounded-lg bg-brand-700 px-3 py-1.5 text-xs text-white">Abonar</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {selectedId && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <form onSubmit={handlePagar} className="w-full max-w-sm rounded-xl bg-white p-6 dark:bg-neutral-900">
            <h3 className="mb-4 text-lg font-semibold">Registrar Abono - Cuenta #{selectedId}</h3>
            <input type="number" step="0.01" placeholder="Monto" value={abono.monto} onChange={(e) => setAbono((f) => ({ ...f, monto: e.target.value }))} className="mb-2 w-full rounded-lg border px-3 py-2 dark:bg-neutral-800 dark:border-neutral-700" required />
            <select value={abono.forma_pago} onChange={(e) => setAbono((f) => ({ ...f, forma_pago: e.target.value }))} className="mb-4 w-full rounded-lg border px-3 py-2 dark:bg-neutral-800 dark:border-neutral-700">
              <option value="EFECTIVO">Efectivo</option>
              <option value="TRANSFERENCIA">Transferencia</option>
            </select>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setSelectedId(null)} className="rounded-lg border px-4 py-2 dark:border-neutral-700">Cancelar</button>
              <button type="submit" className="rounded-lg bg-brand-700 px-4 py-2 text-white">Guardar</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function Stat({ title, value, tone }) {
  const colors = { amber: "text-amber-600", red: "text-red-600", slate: "text-slate-600" };
  return (
    <div className="rounded-xl border bg-white p-4 dark:border-neutral-700 dark:bg-neutral-900">
      <p className="text-sm text-slate-500">{title}</p>
      <p className={`text-2xl font-bold ${colors[tone] || ""}`}>{value}</p>
    </div>
  );
}
