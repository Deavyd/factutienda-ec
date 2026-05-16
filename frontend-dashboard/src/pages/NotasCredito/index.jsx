import { useMemo, useState } from "react";
import { AlertCircle, Calendar, CheckCircle2, FileCheck, FileMinus, FileText, Plus, RefreshCw, Search, XCircle } from "lucide-react";
import { useNotasCredito, useCreateNotaCredito } from "../../hooks/useNotasCredito";
import { useClientes } from "../../hooks/useClientes";
import { useFacturas } from "../../hooks/useFacturas";
import { PageInfoNote, useToast } from "../../components/ui";

const initialForm = { factura_id: "", motivo: "", declarada_ats: false };

export default function NotasCreditoPage() {
  const { pushToast } = useToast();
  const { data: notas = [], isLoading } = useNotasCredito();
  const { data: clientes = [] } = useClientes();
  const { data: facturas = [] } = useFacturas();
  const createNota = useCreateNotaCredito();
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState(initialForm);

  const clientesMap = useMemo(() => Object.fromEntries(clientes.map((c) => [c.id, c.razon_social])), [clientes]);
  const facturasMap = useMemo(() => Object.fromEntries(facturas.map((f) => [f.id, f])), [facturas]);
  const facturasAutorizadas = facturas.filter((f) => String(f.sri_estado || "").toUpperCase() === "AUTORIZADA");
  const selectedFactura = facturasMap[Number(formData.factura_id)];
  const selectedDetalles = selectedFactura?.detalles || [];

  const notasMapeadas = notas.map((n) => {
    const factura = facturasMap[n.factura_id];
    return {
      id: n.id,
      numero: n.numero_comprobante || `NC-001-001-${String(n.id).padStart(9, "0")}`,
      fecha: n.fecha_emision || "",
      cliente: clientesMap[factura?.cliente_id] || `Cliente ref #${n.factura_id}`,
      facturaOrigen: factura?.numero_comprobante || `001-001-${String(n.factura_id || 0).padStart(9, "0")}`,
      motivo: n.motivo || "Devolucion de mercaderia",
      total: parseFloat(n.total || 0),
      estado: (n.sri_estado || n.estado || "EMITIDA").toUpperCase(),
    };
  });

  const filtered = notasMapeadas.filter(
    (n) =>
      n.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.facturaOrigen.includes(searchTerm)
  );

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData(initialForm);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFactura) return;

    const detalle = selectedDetalles.length
      ? selectedDetalles.map((d) => ({ producto_id: d.producto_id, cantidad: d.cantidad || "1" }))
      : [{ producto_id: 1, cantidad: selectedFactura.total || "1" }];

    try {
      await createNota.mutateAsync({
        factura_id: Number(formData.factura_id),
        motivo: formData.motivo.trim(),
        declarada_ats: formData.declarada_ats,
        detalle,
      });
      pushToast({ tone: "success", title: "Nota de credito emitida" });
      closeModal();
    } catch (err) {
      pushToast({ tone: "error", title: "No se pudo emitir", description: err?.response?.data?.detail || "Revisa la factura seleccionada" });
    }
  };

  const getSriBadge = (estado) => {
    switch (estado) {
      case "AUTORIZADO":
      case "AUTORIZADA":
        return (
          <span className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:border-emerald-800/50 dark:bg-emerald-900/20 dark:text-emerald-400">
            <CheckCircle2 size={14} /> Autorizado SRI
          </span>
        );
      case "DEVUELTA":
      case "ERROR":
        return (
          <span className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-bold text-red-700 dark:border-red-800/50 dark:bg-red-900/20 dark:text-red-400">
            <XCircle size={14} /> Devuelta
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-100 px-2.5 py-1 text-xs font-bold text-gray-700 dark:border-neutral-700 dark:bg-neutral-800 dark:text-gray-300">
            <RefreshCw size={14} className="animate-spin" /> Procesando
          </span>
        );
    }
  };

  if (isLoading) return <div className="flex h-64 items-center justify-center text-slate-500">Cargando notas de credito...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 md:flex-row md:items-center">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-100 dark:bg-blue-900/30">
            <FileMinus size={28} className="text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Notas de Credito (Devoluciones)</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Anula total o parcialmente facturas autorizadas por el SRI.</p>
          </div>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-bold text-white shadow-lg shadow-blue-500/30 transition-all hover:bg-blue-700 md:w-auto"
        >
          <Plus size={20} /> Emitir Nota de Credito
        </button>
      </div>

      <div className="flex items-start gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-800/50 dark:bg-blue-900/20">
        <AlertCircle className="mt-0.5 shrink-0 text-blue-600 dark:text-blue-400" size={20} />
        <div className="text-sm text-blue-800 dark:text-blue-300">
          <p className="mb-1 font-bold">Normativa SRI vigente</p>
          <p>Toda Nota de Credito debe referenciar una factura original autorizada e identificar obligatoriamente al receptor.</p>
        </div>
      </div>

      <PageInfoNote module="notasCredito" />

      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
          <Search size={18} className="text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Buscar por cliente, documento o factura origen..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full rounded-2xl border border-gray-200 bg-white py-4 pl-11 pr-4 text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-neutral-800 dark:bg-neutral-900 dark:text-white"
        />
      </div>

      <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-left">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wider text-gray-500 dark:border-neutral-800 dark:bg-neutral-800/50 dark:text-gray-400">
                <th className="px-6 py-4 font-medium">Nota de Credito</th>
                <th className="px-6 py-4 font-medium">Factura Modificada</th>
                <th className="px-6 py-4 font-medium">Cliente</th>
                <th className="px-6 py-4 font-medium">Total Devuelto</th>
                <th className="px-6 py-4 text-center font-medium">Estado SRI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-neutral-800">
              {filtered.map((nota) => (
                <tr key={nota.id} className="group transition-colors hover:bg-gray-50/50 dark:hover:bg-neutral-800/50">
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-gray-900 dark:text-white">{nota.numero}</p>
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400"><Calendar size={12} /> {nota.fecha}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="inline-block rounded-lg border border-gray-100 bg-gray-50 px-3 py-1.5 dark:border-neutral-700 dark:bg-neutral-800/50">
                      <p className="flex items-center gap-1 text-xs font-medium text-gray-500 dark:text-gray-400"><FileText size={12} /> Ref: {nota.facturaOrigen}</p>
                      <p className="mt-0.5 max-w-[200px] truncate text-xs font-bold text-gray-700 dark:text-gray-300" title={nota.motivo}>{nota.motivo}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4"><span className="text-sm font-medium text-gray-900 dark:text-white">{nota.cliente}</span></td>
                  <td className="px-6 py-4"><span className="text-sm font-bold text-blue-600 dark:text-blue-400">-${nota.total.toFixed(2)}</span></td>
                  <td className="px-6 py-4 text-center">{getSriBadge(nota.estado)}</td>
                </tr>
              ))}
              {filtered.length === 0 ? (
                <tr><td colSpan="5" className="px-6 py-10 text-center text-sm text-gray-500 dark:text-gray-400">No hay notas de credito para mostrar.</td></tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 p-4 backdrop-blur-sm dark:bg-black/70">
          <div className="w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-neutral-900">
            <div className="flex items-center justify-between border-b border-gray-100 bg-blue-50/50 p-6 dark:border-neutral-800 dark:bg-blue-900/10">
              <h3 className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-white"><FileMinus className="text-blue-500" size={24} /> Emitir Nota de Credito</h3>
              <button onClick={closeModal} className="rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-neutral-800 dark:hover:text-gray-300">
                <XCircle size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 p-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-900 dark:text-white">Factura original autorizada</label>
                <select
                  value={formData.factura_id}
                  onChange={(e) => setFormData((prev) => ({ ...prev, factura_id: e.target.value }))}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-neutral-700 dark:bg-neutral-950 dark:text-white"
                  required
                >
                  <option value="">Seleccione una factura</option>
                  {facturasAutorizadas.map((f) => (
                    <option key={f.id} value={f.id}>{f.numero_comprobante} - {clientesMap[f.cliente_id] || `Cliente #${f.cliente_id}`} - ${parseFloat(f.total || 0).toFixed(2)}</option>
                  ))}
                </select>
                {facturasAutorizadas.length === 0 ? <p className="text-xs text-amber-600 dark:text-amber-300">No hay facturas AUTORIZADAS disponibles.</p> : null}
              </div>

              {selectedFactura ? (
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm dark:border-neutral-800 dark:bg-neutral-950">
                  <p className="font-bold text-gray-900 dark:text-white">{selectedFactura.numero_comprobante}</p>
                  <p className="mt-1 text-gray-500 dark:text-gray-400">Total factura: ${parseFloat(selectedFactura.total || 0).toFixed(2)}</p>
                  <p className="mt-1 text-gray-500 dark:text-gray-400">Items a devolver: {selectedDetalles.length || 1}</p>
                </div>
              ) : null}

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-900 dark:text-white">Motivo de la modificacion</label>
                <textarea
                  rows={3}
                  value={formData.motivo}
                  onChange={(e) => setFormData((prev) => ({ ...prev, motivo: e.target.value }))}
                  placeholder="Ej. Devolucion de producto por garantia..."
                  className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-neutral-700 dark:bg-neutral-950 dark:text-white"
                  required
                />
              </div>

              <label className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-bold text-gray-700 dark:border-neutral-700 dark:bg-neutral-950 dark:text-gray-200">
                <input
                  type="checkbox"
                  checked={formData.declarada_ats}
                  onChange={(e) => setFormData((prev) => ({ ...prev, declarada_ats: e.target.checked }))}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                La factura ya fue declarada en ATS
              </label>

              <div className="flex justify-end gap-3 border-t border-gray-100 pt-6 dark:border-neutral-800">
                <button type="button" onClick={closeModal} className="rounded-xl px-6 py-2.5 font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-neutral-800">Cancelar</button>
                <button disabled={createNota.isPending || !formData.factura_id || !formData.motivo.trim()} type="submit" className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 font-bold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">
                  <FileCheck size={18} /> {createNota.isPending ? "Enviando..." : "Enviar al SRI"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
