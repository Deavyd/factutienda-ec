import { useMemo, useState } from "react";
import {
  CheckCircle2,
  Clock,
  DollarSign,
  Download,
  Eye,
  FileText,
  Filter,
  Printer,
  Receipt,
  Search,
  ShoppingBag,
  X,
  XCircle,
} from "lucide-react";
import { useFacturas } from "../../hooks/useFacturas";
import { useClientes } from "../../hooks/useClientes";
import { useExportarXmls } from "../../hooks/useReportes";
import { PageInfoNote, useToast } from "../../components/ui";

export default function HistorialVentasPage() {
  const { pushToast } = useToast();
  const { data: facturas = [], isLoading } = useFacturas();
  const { data: clientes = [] } = useClientes();
  const exportarXmls = useExportarXmls();
  const [searchTerm, setSearchTerm] = useState("");
  const [estadoFilter, setEstadoFilter] = useState("TODAS");
  const [selectedVenta, setSelectedVenta] = useState(null);
  const [exporting, setExporting] = useState(false);

  const clientesMap = useMemo(() => Object.fromEntries(clientes.map((c) => [c.id, c.razon_social])), [clientes]);

  const ventasMapeadas = useMemo(
    () =>
      facturas.map((f) => ({
        id: f.numero_comprobante || `FAC-${f.id}`,
        fecha: f.fecha_emision || "",
        cliente: clientesMap[f.cliente_id] || `Cliente #${f.cliente_id}`,
        identificacion: String(f.cliente_id || ""),
        total: parseFloat(f.total || 0),
        subtotal: parseFloat(f.total || 0) / 1.15,
        iva: parseFloat(f.total || 0) - parseFloat(f.total || 0) / 1.15,
        metodo: "Efectivo",
        estadoSRI: f.sri_estado?.toUpperCase() || "PENDIENTE",
        items: f.detalles || [],
      })),
    [facturas, clientesMap]
  );

  const ventasFiltradas = useMemo(() => {
    return ventasMapeadas.filter((v) => {
      const matchSearch = v.id.toLowerCase().includes(searchTerm.toLowerCase()) || v.cliente.toLowerCase().includes(searchTerm.toLowerCase());
      const matchEstado = estadoFilter === "TODAS" || v.estadoSRI === estadoFilter;
      return matchSearch && matchEstado;
    });
  }, [ventasMapeadas, searchTerm, estadoFilter]);

  const ventasValidas = ventasFiltradas.filter((v) => v.estadoSRI !== "ANULADO" && v.estadoSRI !== "ANULADA");
  const totalIngresos = ventasValidas.reduce((acc, v) => acc + v.total, 0);
  const totalTransacciones = ventasValidas.length;
  const ticketPromedio = totalTransacciones > 0 ? totalIngresos / totalTransacciones : 0;

  const getEstadoBadge = (estado) => {
    switch (estado) {
      case "AUTORIZADO":
      case "AUTORIZADA":
        return (
          <span className="flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-600 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
            <CheckCircle2 size={12} strokeWidth={3} /> AUTORIZADO
          </span>
        );
      case "ANULADO":
      case "ANULADA":
        return (
          <span className="flex items-center gap-1.5 rounded-full border border-red-100 bg-red-50 px-3 py-1 text-[11px] font-bold text-red-600 dark:border-red-800 dark:bg-red-900/30 dark:text-red-400">
            <XCircle size={12} strokeWidth={3} /> ANULADO
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1.5 rounded-full border border-amber-100 bg-amber-50 px-3 py-1 text-[11px] font-bold text-amber-600 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
            <Clock size={12} strokeWidth={3} /> PENDIENTE SRI
          </span>
        );
    }
  };

  const downloadBlob = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const handleExportXml = async () => {
    try {
      setExporting(true);
      const { data, filename } = await exportarXmls.mutateAsync({ tipo: "TODOS" });
      downloadBlob(data, filename);
      pushToast({ tone: "success", title: "XMLs descargados" });
    } catch {
      pushToast({ tone: "error", title: "No se pudo exportar XMLs" });
    } finally {
      setExporting(false);
    }
  };

  if (isLoading) return <div className="flex h-64 items-center justify-center text-slate-500">Cargando historial...</div>;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Historial de Ventas</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Monitorea, reimprime o anula comprobantes emitidos</p>
        </div>
      </div>

      <PageInfoNote module="historialVentas" />

      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        <div className="flex items-center gap-4 rounded-[1.5rem] border border-gray-100 bg-white p-6 shadow-sm dark:border-neutral-700 dark:bg-neutral-900">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
            <DollarSign size={28} strokeWidth={2.5} />
          </div>
          <div>
            <p className="mb-1 text-sm font-bold uppercase tracking-wider text-gray-400">Ingresos Filtrados</p>
            <h2 className="text-2xl font-black text-gray-900 dark:text-white">${totalIngresos.toFixed(2)}</h2>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-[1.5rem] border border-gray-100 bg-white p-6 shadow-sm dark:border-neutral-700 dark:bg-neutral-900">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
            <Receipt size={28} strokeWidth={2.5} />
          </div>
          <div>
            <p className="mb-1 text-sm font-bold uppercase tracking-wider text-gray-400">Transacciones</p>
            <h2 className="text-2xl font-black text-gray-900 dark:text-white">
              {totalTransacciones} <span className="text-sm font-medium text-gray-400">ventas</span>
            </h2>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-[1.5rem] border border-gray-100 bg-white p-6 shadow-sm dark:border-neutral-700 dark:bg-neutral-900">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
            <ShoppingBag size={28} strokeWidth={2.5} />
          </div>
          <div>
            <p className="mb-1 text-sm font-bold uppercase tracking-wider text-gray-400">Ticket Promedio</p>
            <h2 className="text-2xl font-black text-gray-900 dark:text-white">${ticketPromedio.toFixed(2)}</h2>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-neutral-700 dark:bg-neutral-900 lg:flex-row">
        <div className="flex flex-1 items-center rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 transition-all focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 dark:border-neutral-700 dark:bg-neutral-950">
          <Search size={18} className="mr-3 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por N Factura o Cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-400 dark:text-gray-200"
          />
        </div>

        <div className="flex gap-3 overflow-x-auto">
          <div className="relative flex shrink-0 items-center rounded-xl border border-gray-200 bg-white px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900">
            <Filter size={16} className="mr-2 text-gray-400" />
            <select
              value={estadoFilter}
              onChange={(e) => setEstadoFilter(e.target.value)}
              className="cursor-pointer appearance-none bg-transparent pr-4 text-sm font-medium text-gray-700 outline-none dark:text-gray-200"
            >
              <option value="TODAS">Todos los estados</option>
              <option value="AUTORIZADO">Autorizados</option>
              <option value="AUTORIZADA">Autorizados</option>
              <option value="PENDIENTE">Pendientes</option>
              <option value="ANULADO">Anulados</option>
              <option value="ANULADA">Anulados</option>
            </select>
          </div>

          <button onClick={handleExportXml} disabled={exporting} className="flex shrink-0 items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-bold text-blue-600 transition-all hover:bg-blue-100 disabled:opacity-60 dark:border-blue-900 dark:bg-blue-900/20 dark:text-blue-400">
            <Download size={16} /> XML
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-neutral-700 dark:bg-neutral-900">
        <div className="grid grid-cols-12 gap-4 border-b border-gray-100 bg-gray-50/80 p-4 text-xs font-bold uppercase tracking-wider text-gray-500 dark:border-neutral-700 dark:bg-neutral-800/80 dark:text-gray-400">
          <div className="col-span-12 pl-2 sm:col-span-3">Comprobante / Fecha</div>
          <div className="col-span-12 hidden sm:col-span-4 sm:block">Cliente</div>
          <div className="col-span-12 hidden md:col-span-2 md:block md:text-center">Estado SRI</div>
          <div className="col-span-6 text-right sm:col-span-2">Total</div>
          <div className="col-span-6 pr-2 text-center sm:col-span-1">Accion</div>
        </div>

        {ventasFiltradas.length > 0 ? (
          <div className="divide-y divide-gray-50 dark:divide-neutral-800">
            {ventasFiltradas.map((venta) => (
              <div key={venta.id} className="group grid grid-cols-12 items-center gap-4 p-4 transition-colors hover:bg-gray-50/50 dark:hover:bg-neutral-800/50">
                <div className="col-span-8 pl-2 sm:col-span-3">
                  <p className="mb-0.5 text-sm font-bold text-blue-600 dark:text-blue-400">{venta.id}</p>
                  <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400">{venta.fecha}</p>
                </div>
                <div className="col-span-12 hidden sm:col-span-4 sm:block">
                  <p className="truncate text-sm font-bold text-gray-800 dark:text-white">{venta.cliente}</p>
                  <p className="font-mono text-[11px] text-gray-400">{venta.identificacion}</p>
                </div>
                <div className="col-span-12 hidden md:col-span-2 md:flex md:justify-center">{getEstadoBadge(venta.estadoSRI)}</div>
                <div className="col-span-4 text-right sm:col-span-2">
                  <p className={`text-base font-black ${venta.estadoSRI === "ANULADO" || venta.estadoSRI === "ANULADA" ? "text-gray-400 line-through" : "text-slate-900 dark:text-white"}`}>${venta.total.toFixed(2)}</p>
                  <p className="text-[10px] font-bold uppercase text-gray-400">{venta.metodo}</p>
                </div>
                <div className="col-span-12 flex justify-end pr-2 sm:col-span-1 sm:justify-center">
                  <button onClick={() => setSelectedVenta(venta)} className="rounded-xl p-2 text-gray-400 transition-all hover:bg-blue-50 hover:text-blue-600 dark:hover:text-blue-400" title="Ver Detalles">
                    <Eye size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center p-12 text-center text-gray-400 dark:text-gray-500">
            <Receipt size={48} className="mb-3 opacity-20" />
            <p className="font-medium text-gray-600 dark:text-gray-300">No se encontraron comprobantes</p>
            <p className="text-sm">Ajusta los filtros o intenta con otra busqueda.</p>
          </div>
        )}
      </div>

      {selectedVenta ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm sm:p-6">
          <div className="flex w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-gray-200 bg-[#f8f9fa] shadow-2xl dark:border-neutral-700 dark:bg-neutral-900 md:flex-row">
            <div className="flex flex-1 flex-col bg-white p-6 dark:bg-neutral-900 md:p-8">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-xl font-black text-gray-800 dark:text-white">Detalle de Compra</h3>
                <span className="rounded-lg border border-gray-200 bg-gray-100 px-3 py-1 text-xs font-bold text-gray-600 dark:border-neutral-700 dark:bg-neutral-800 dark:text-gray-300">
                  {selectedVenta.items.length || 0} Items
                </span>
              </div>
              <div className="flex-1 space-y-3 overflow-y-auto pr-2">
                {selectedVenta.items.length > 0 ? (
                  selectedVenta.items.map((item, index) => (
                    <div key={index} className="flex items-center justify-between rounded-xl border border-gray-100 p-3 transition-colors hover:border-gray-200 dark:border-neutral-700">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-gray-100 bg-gray-50 text-xs font-bold text-gray-500 dark:border-neutral-700 dark:bg-neutral-800">
                          {item.cantidad}x
                        </div>
                        <div>
                          <p className="line-clamp-1 text-sm font-bold text-gray-800 dark:text-white">{item.nombre || `Producto #${item.producto_id}`}</p>
                          <p className="text-xs text-gray-400">${parseFloat(item.precio_unitario || 0).toFixed(2)} c/u</p>
                        </div>
                      </div>
                      <span className="font-bold text-gray-900 dark:text-white">${parseFloat(item.precio_unitario * (item.cantidad || 1) || 0).toFixed(2)}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-400">Sin detalle de items disponible.</p>
                )}
              </div>
            </div>

            <div className="relative flex w-full flex-col border-l border-gray-200 bg-slate-50 p-6 dark:border-neutral-700 dark:bg-neutral-800/50 md:w-[380px]">
              <button onClick={() => setSelectedVenta(null)} className="absolute right-4 top-4 z-10 rounded-xl border border-gray-200 bg-white p-2 text-gray-400 shadow-sm transition-colors hover:text-gray-800 dark:border-neutral-700 dark:bg-neutral-900 dark:hover:text-white">
                <X size={16} />
              </button>
              <div className="mt-4 flex-1">
                <div className="mb-6 text-center">
                  <h4 className="text-xl font-black text-gray-900 dark:text-white">FactuTienda</h4>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{selectedVenta.fecha}</p>
                  <div className="mt-3 inline-block">{getEstadoBadge(selectedVenta.estadoSRI)}</div>
                </div>
                <div className="mb-6 space-y-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-neutral-700 dark:bg-neutral-900">
                  <div className="flex justify-between">
                    <span className="text-xs font-medium text-gray-500">Comprobante:</span>
                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{selectedVenta.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs font-medium text-gray-500">Cliente:</span>
                    <span className="text-xs font-bold text-gray-800 dark:text-white">{selectedVenta.cliente}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs font-medium text-gray-500">RUC/CI:</span>
                    <span className="font-mono text-xs text-gray-600 dark:text-gray-300">{selectedVenta.identificacion}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs font-medium text-gray-500">Metodo Pago:</span>
                    <span className="text-xs font-bold text-gray-800 dark:text-white">{selectedVenta.metodo}</span>
                  </div>
                </div>
                <div className="space-y-2 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-neutral-700 dark:bg-neutral-900">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Subtotal:</span>
                    <span className="font-medium text-gray-800 dark:text-white">${selectedVenta.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">IVA (15%):</span>
                    <span className="font-medium text-gray-800 dark:text-white">${selectedVenta.iva.toFixed(2)}</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-dashed border-gray-200 pt-3 dark:border-neutral-700">
                    <span className="text-lg font-bold text-gray-800 dark:text-white">Total</span>
                    <span className="text-3xl font-black text-slate-900 dark:text-white">${selectedVenta.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              <div className="mt-6 grid grid-cols-2 gap-2">
                <button className="flex items-center justify-center gap-2 rounded-xl border-2 border-gray-200 bg-white py-3 text-sm font-bold text-gray-700 transition-all hover:border-gray-300 hover:bg-gray-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-gray-200 dark:hover:bg-neutral-800">
                  <Printer size={16} /> Ticket
                </button>
                <button className="flex items-center justify-center gap-2 rounded-xl border-2 border-blue-200 bg-white py-3 text-sm font-bold text-blue-600 transition-all hover:bg-blue-50 dark:border-blue-900 dark:bg-blue-900/20 dark:text-blue-400">
                  <FileText size={16} /> RIDE PDF
                </button>
                {selectedVenta.estadoSRI !== "ANULADO" && selectedVenta.estadoSRI !== "ANULADA" ? (
                  <button className="col-span-2 mt-1 flex items-center justify-center gap-2 rounded-xl border border-red-100 bg-red-50 py-3 text-sm font-bold text-red-600 transition-all hover:bg-red-100 dark:border-red-900 dark:bg-red-900/20 dark:text-red-400">
                    <XCircle size={16} /> Solicitar Anulacion SRI
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
