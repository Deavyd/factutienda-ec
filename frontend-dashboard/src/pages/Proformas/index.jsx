import { useMemo, useState } from "react";
import { ArrowRightCircle, Calendar, CheckCircle2, Clock, FileOutput, FileText, Plus, Printer, Search, Trash2, User, XCircle } from "lucide-react";
import { useProformas, useCreateProforma, useConvertirProforma } from "../../hooks/useProformas";
import { useClientes } from "../../hooks/useClientes";
import { useProductos } from "../../hooks/useProductos";
import { PageInfoNote, useToast } from "../../components/ui";

const initialForm = { cliente_id: "", fecha_validez: "", observacion: "" };
const initialItem = { producto_id: "", cantidad: "1", precio_unitario: "", descuento: "0" };

export default function ProformasPage() {
  const { pushToast } = useToast();
  const { data: proformas = [], isLoading, error } = useProformas();
  const { data: clientes = [] } = useClientes();
  const { data: productos = [] } = useProductos();
  const createProforma = useCreateProforma();
  const convertirProforma = useConvertirProforma();
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mensajeExito, setMensajeExito] = useState(null);
  const [formData, setFormData] = useState(initialForm);
  const [currentItem, setCurrentItem] = useState(initialItem);
  const [items, setItems] = useState([]);

  const clientesMap = useMemo(() => Object.fromEntries(clientes.map((c) => [c.id, c.razon_social])), [clientes]);
  const productosMap = useMemo(() => Object.fromEntries(productos.map((p) => [p.id, p])), [productos]);

  const filtered = proformas.filter(
    (p) => (clientesMap[p.cliente_id] || "").toLowerCase().includes(searchTerm.toLowerCase()) || p.numero?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalItems = items.reduce((acc, item) => acc + (Number(item.cantidad) * Number(item.precio_unitario) - Number(item.descuento || 0)), 0);

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData(initialForm);
    setCurrentItem(initialItem);
    setItems([]);
  };

  const handleProductChange = (productId) => {
    const producto = productosMap[Number(productId)];
    setCurrentItem((prev) => ({
      ...prev,
      producto_id: productId,
      precio_unitario: producto ? String(producto.precio_venta || producto.precio_sin_iva || "0") : "",
    }));
  };

  const handleAddItem = () => {
    const producto = productosMap[Number(currentItem.producto_id)];
    if (!producto) {
      pushToast({ tone: "warning", title: "Selecciona un producto" });
      return;
    }
    if (Number(currentItem.cantidad) <= 0 || Number(currentItem.precio_unitario) < 0) {
      pushToast({ tone: "warning", title: "Cantidad o precio invalido" });
      return;
    }
    setItems((prev) => [
      ...prev,
      {
        ...currentItem,
        producto_id: Number(currentItem.producto_id),
        nombre: producto.nombre,
        cantidad: String(currentItem.cantidad),
        precio_unitario: String(currentItem.precio_unitario),
        descuento: String(currentItem.descuento || "0"),
      },
    ]);
    setCurrentItem(initialItem);
  };

  const handleRemoveItem = (index) => {
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleCreateProforma = async (e) => {
    e.preventDefault();
    if (items.length === 0) {
      pushToast({ tone: "warning", title: "Agrega al menos un producto" });
      return;
    }
    try {
      await createProforma.mutateAsync({
        cliente_id: Number(formData.cliente_id),
        fecha_validez: formData.fecha_validez || null,
        observacion: formData.observacion.trim() || null,
        detalles: items.map((item) => ({
          producto_id: item.producto_id,
          cantidad: item.cantidad,
          precio_unitario: item.precio_unitario,
          descuento: item.descuento,
        })),
      });
      pushToast({ tone: "success", title: "Proforma creada" });
      setMensajeExito("Proforma guardada exitosamente");
      setTimeout(() => setMensajeExito(null), 3000);
      closeModal();
    } catch (err) {
      pushToast({ tone: "error", title: "Error al guardar", description: err?.response?.data?.detail || "Revisa los datos" });
    }
  };

  const handleConvertirFactura = async (id) => {
    try {
      await convertirProforma.mutateAsync(id);
      pushToast({ tone: "success", title: "Proforma lista para facturar" });
      setMensajeExito("Datos de factura generados desde la proforma");
      setTimeout(() => setMensajeExito(null), 3000);
    } catch (err) {
      pushToast({ tone: "error", title: "Error al convertir", description: err?.response?.data?.detail || "No se pudo convertir" });
    }
  };

  const getStatusBadge = (estado) => {
    switch (estado) {
      case "FACTURADA":
        return <span className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:border-emerald-800/50 dark:bg-emerald-900/20 dark:text-emerald-400"><CheckCircle2 size={14} /> Facturada</span>;
      case "PENDIENTE":
        return <span className="inline-flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700 dark:border-amber-800/50 dark:bg-amber-900/20 dark:text-amber-400"><Clock size={14} /> Pendiente</span>;
      case "VENCIDA":
        return <span className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-bold text-red-700 dark:border-red-800/50 dark:bg-red-900/20 dark:text-red-400"><XCircle size={14} /> Vencida</span>;
      default:
        return <span className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-bold text-gray-700 dark:border-neutral-800 dark:bg-neutral-800 dark:text-gray-300">{estado}</span>;
    }
  };

  if (isLoading) return <div className="flex h-64 items-center justify-center text-slate-500">Cargando proformas...</div>;
  if (error) return <div className="flex h-64 items-center justify-center text-red-500">Error al cargar proformas</div>;

  return (
    <div className="space-y-6">
      {mensajeExito ? (
        <div className="fixed left-1/2 top-6 z-50 flex -translate-x-1/2 items-center gap-3 rounded-2xl bg-emerald-500 px-6 py-3 text-white shadow-xl">
          <CheckCircle2 size={20} />
          <span className="font-bold">{mensajeExito}</span>
        </div>
      ) : null}

      <div className="flex flex-col items-start justify-between gap-4 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 md:flex-row md:items-center">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-100 dark:bg-blue-900/30">
            <FileText size={28} className="text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Proformas / Cotizaciones</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Genera presupuestos para tus clientes sin afectar el inventario.</p>
          </div>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-bold text-white shadow-lg shadow-blue-500/30 transition-all hover:bg-blue-700 md:w-auto"
        >
          <Plus size={20} /> Nueva Proforma
        </button>
      </div>

      <PageInfoNote module="proformas" />

      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4"><Search size={18} className="text-gray-400" /></div>
        <input
          type="text"
          placeholder="Buscar por cliente o numero de proforma..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full rounded-2xl border border-gray-200 bg-white py-4 pl-11 pr-4 text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-neutral-800 dark:bg-neutral-900 dark:text-white"
        />
      </div>

      <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] border-collapse text-left">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wider text-gray-500 dark:border-neutral-800 dark:bg-neutral-800/50 dark:text-gray-400">
                <th className="px-6 py-4 font-medium">Documento</th>
                <th className="px-6 py-4 font-medium">Cliente</th>
                <th className="px-6 py-4 font-medium">Total</th>
                <th className="px-6 py-4 font-medium">Estado</th>
                <th className="px-6 py-4 text-center font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-neutral-800">
              {filtered.map((prof) => (
                <tr key={prof.id} className="group transition-colors hover:bg-gray-50/50 dark:hover:bg-neutral-800/50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <FileOutput size={16} className="text-gray-400" />
                      <div>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">{prof.numero}</p>
                        <p className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400"><Calendar size={12} /> {prof.fecha_emision || prof.fecha}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2"><User size={16} className="text-gray-400" /><span className="text-sm font-medium text-gray-700 dark:text-gray-300">{clientesMap[prof.cliente_id] || `Cliente #${prof.cliente_id}`}</span></div>
                  </td>
                  <td className="px-6 py-4"><span className="text-sm font-bold text-gray-900 dark:text-white">${parseFloat(prof.total || 0).toFixed(2)}</span></td>
                  <td className="px-6 py-4">{getStatusBadge(prof.estado)}</td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center gap-2">
                      <button className="rounded-lg bg-gray-50 p-2 text-gray-400 transition-colors hover:text-blue-600 dark:bg-neutral-800" title="Imprimir PDF"><Printer size={16} /></button>
                      {prof.estado === "PENDIENTE" ? (
                        <button
                          onClick={() => handleConvertirFactura(prof.id)}
                          className="flex items-center gap-1 rounded-lg bg-blue-50 p-2 text-xs font-bold text-blue-600 transition-colors hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/40"
                          title="Convertir a Factura"
                        >
                          <ArrowRightCircle size={16} /> Facturar
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 ? <tr><td colSpan="5" className="px-6 py-10 text-center text-sm text-gray-500 dark:text-gray-400">No hay proformas para mostrar.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 p-4 backdrop-blur-sm dark:bg-black/70">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-neutral-900">
            <div className="flex items-center justify-between border-b border-gray-100 p-6 dark:border-neutral-800">
              <h3 className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-white"><FileText className="text-blue-500" size={24} /> Nueva Proforma</h3>
              <button onClick={closeModal} className="rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-neutral-800 dark:hover:text-gray-300"><XCircle size={24} /></button>
            </div>

            <form onSubmit={handleCreateProforma} className="max-h-[calc(90vh-89px)] overflow-y-auto p-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-bold text-gray-900 dark:text-white">Cliente</label>
                  <select
                    value={formData.cliente_id}
                    onChange={(e) => setFormData((prev) => ({ ...prev, cliente_id: e.target.value }))}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-neutral-700 dark:bg-neutral-950 dark:text-white"
                    required
                  >
                    <option value="">Seleccione un cliente</option>
                    {clientes.map((cliente) => <option key={cliente.id} value={cliente.id}>{cliente.razon_social}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-bold text-gray-900 dark:text-white">Valida hasta</label>
                  <input
                    type="date"
                    value={formData.fecha_validez}
                    onChange={(e) => setFormData((prev) => ({ ...prev, fecha_validez: e.target.value }))}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-neutral-700 dark:bg-neutral-950 dark:text-white"
                  />
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-neutral-800 dark:bg-neutral-950">
                <p className="mb-3 text-sm font-bold text-gray-900 dark:text-white">Agregar producto</p>
                <div className="grid gap-3 md:grid-cols-[1fr_110px_120px_120px_auto]">
                  <select value={currentItem.producto_id} onChange={(e) => handleProductChange(e.target.value)} className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white">
                    <option value="">Producto</option>
                    {productos.map((producto) => <option key={producto.id} value={producto.id}>{producto.nombre}</option>)}
                  </select>
                  <input type="number" min="0.01" step="0.01" value={currentItem.cantidad} onChange={(e) => setCurrentItem((prev) => ({ ...prev, cantidad: e.target.value }))} placeholder="Cant." className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white" />
                  <input type="number" min="0" step="0.01" value={currentItem.precio_unitario} onChange={(e) => setCurrentItem((prev) => ({ ...prev, precio_unitario: e.target.value }))} placeholder="Precio" className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white" />
                  <input type="number" min="0" step="0.01" value={currentItem.descuento} onChange={(e) => setCurrentItem((prev) => ({ ...prev, descuento: e.target.value }))} placeholder="Desc." className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white" />
                  <button type="button" onClick={handleAddItem} className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-black dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200">Agregar</button>
                </div>
              </div>

              <div className="mt-4 overflow-hidden rounded-2xl border border-gray-200 dark:border-neutral-800">
                <div className="grid grid-cols-12 gap-3 bg-gray-50 px-4 py-3 text-xs font-bold uppercase tracking-wide text-gray-500 dark:bg-neutral-950 dark:text-gray-400">
                  <div className="col-span-5">Producto</div>
                  <div className="col-span-2 text-right">Cant.</div>
                  <div className="col-span-2 text-right">Precio</div>
                  <div className="col-span-2 text-right">Total</div>
                  <div className="col-span-1" />
                </div>
                {items.length === 0 ? (
                  <div className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">Agrega productos para calcular la proforma.</div>
                ) : items.map((item, index) => {
                  const total = Number(item.cantidad) * Number(item.precio_unitario) - Number(item.descuento || 0);
                  return (
                    <div key={`${item.producto_id}-${index}`} className="grid grid-cols-12 items-center gap-3 border-t border-gray-100 px-4 py-3 text-sm dark:border-neutral-800">
                      <div className="col-span-5 font-medium text-gray-900 dark:text-white">{item.nombre}</div>
                      <div className="col-span-2 text-right text-gray-600 dark:text-gray-300">{item.cantidad}</div>
                      <div className="col-span-2 text-right text-gray-600 dark:text-gray-300">${Number(item.precio_unitario).toFixed(2)}</div>
                      <div className="col-span-2 text-right font-bold text-gray-900 dark:text-white">${total.toFixed(2)}</div>
                      <div className="col-span-1 text-right"><button type="button" onClick={() => handleRemoveItem(index)} className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"><Trash2 size={16} /></button></div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4">
                <label className="mb-1.5 block text-sm font-bold text-gray-900 dark:text-white">Observacion</label>
                <textarea value={formData.observacion} onChange={(e) => setFormData((prev) => ({ ...prev, observacion: e.target.value }))} rows="2" className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-neutral-700 dark:bg-neutral-950 dark:text-white" placeholder="Condiciones comerciales, tiempos de entrega, etc." />
              </div>

              <div className="mt-8 flex flex-col justify-between gap-3 border-t border-gray-100 pt-6 dark:border-neutral-800 sm:flex-row sm:items-center">
                <span className="text-lg font-black text-gray-900 dark:text-white">Total: ${totalItems.toFixed(2)}</span>
                <div className="flex justify-end gap-3">
                  <button type="button" onClick={closeModal} className="rounded-xl px-6 py-2.5 font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-neutral-800">Cancelar</button>
                  <button disabled={createProforma.isPending || items.length === 0} type="submit" className="rounded-xl bg-blue-600 px-6 py-2.5 font-bold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">
                    {createProforma.isPending ? "Guardando..." : "Guardar Proforma"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
