import { useMemo, useState } from "react";
import { AlertCircle, Calendar, CheckCircle2, Clock, Download, Package, Receipt, TrendingUp } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useFacturas } from "../../hooks/useFacturas";
import { useExportarContador, useExportarXmls, useStockActual, useVentasDia } from "../../hooks/useReportes";
import { useClientes } from "../../hooks/useClientes";
import { PageInfoNote, useToast } from "../../components/ui";

export default function ReportesPage() {
  const [activeTab, setActiveTab] = useState("facturas");
  const [fechaInicio, setFechaInicio] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10));
  const [fechaFin, setFechaFin] = useState(new Date().toISOString().slice(0, 10));
  const [exporting, setExporting] = useState(false);
  const { data: facturas = [], isLoading: loadingF } = useFacturas();
  const { data: stockData = [], isLoading: loadingS } = useStockActual();
  const { data: ventasDia = [], isLoading: loadingV } = useVentasDia(fechaFin);
  const { data: clientes = [] } = useClientes();
  const exportarContador = useExportarContador();
  const exportarXmls = useExportarXmls();
  const { pushToast } = useToast();

  const totalVentas = useMemo(() => facturas.reduce((sum, f) => sum + parseFloat(f.total || 0), 0), [facturas]);
  const autorizadas = useMemo(() => facturas.filter((f) => f.sri_estado?.toLowerCase() === "autorizada").length, [facturas]);
  const clientesMap = useMemo(() => Object.fromEntries(clientes.map((c) => [c.id, c.razon_social])), [clientes]);
  const chartData = useMemo(
    () => ventasDia.map((item) => ({ name: item.hora || item.fecha || "-", ventas: Number(item.total || 0) })),
    [ventasDia]
  );

  const statusIcon = (estado) => {
    const s = estado?.toLowerCase();
    if (s === "autorizada") return <CheckCircle2 size={14} className="text-emerald-500" />;
    if (s === "pendiente" || s === "en_proceso") return <Clock size={14} className="text-amber-500" />;
    return <AlertCircle size={14} className="text-red-500" />;
  };

  const tabs = [
    { id: "facturas", label: "Facturas", icon: <Receipt size={16} /> },
    { id: "stock", label: "Stock", icon: <Package size={16} /> },
    { id: "grafico", label: "Grafico", icon: <TrendingUp size={16} /> },
  ];

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

  const handleExportContador = async () => {
    try {
      setExporting(true);
      const { data, filename } = await exportarContador.mutateAsync({ fecha_inicio: fechaInicio, fecha_fin: fechaFin });
      downloadBlob(data, filename);
      pushToast({ tone: "success", title: "Reporte contable descargado" });
    } catch {
      pushToast({ tone: "error", title: "No se pudo exportar reporte contable" });
    } finally {
      setExporting(false);
    }
  };

  const handleExportXmls = async (tipo = "TODOS") => {
    try {
      setExporting(true);
      const { data, filename } = await exportarXmls.mutateAsync({ fecha_inicio: fechaInicio, fecha_fin: fechaFin, tipo });
      downloadBlob(data, filename);
      pushToast({ tone: "success", title: "XMLs descargados" });
    } catch {
      pushToast({ tone: "error", title: "No se pudo exportar XMLs" });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Reportes y Comprobantes SRI</h2>
      <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-900">
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-sm">
            <span className="mb-1 block text-slate-500">Fecha inicio</span>
            <input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} className="rounded-lg border px-3 py-2 dark:border-neutral-700 dark:bg-neutral-800" />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-slate-500">Fecha fin</span>
            <input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} className="rounded-lg border px-3 py-2 dark:border-neutral-700 dark:bg-neutral-800" />
          </label>
          <button onClick={handleExportContador} disabled={exporting} className="inline-flex items-center gap-2 rounded-lg bg-brand-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-60">
            <Download size={16} /> Descargar Excel Contador
          </button>
          <button onClick={() => handleExportXmls("TODOS")} disabled={exporting} className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium dark:border-neutral-700">
            <Download size={16} /> Descargar XMLs
          </button>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border bg-white p-4 dark:bg-neutral-900 dark:border-neutral-700">
          <p className="text-sm text-slate-500">Facturas emitidas</p>
          <p className="text-2xl font-bold">{facturas.length}</p>
        </div>
        <div className="rounded-xl border bg-white p-4 dark:bg-neutral-900 dark:border-neutral-700">
          <p className="text-sm text-slate-500">Total facturado</p>
          <p className="text-2xl font-bold text-emerald-600">${totalVentas.toFixed(2)}</p>
        </div>
        <div className="rounded-xl border bg-white p-4 dark:bg-neutral-900 dark:border-neutral-700">
          <p className="text-sm text-slate-500">Autorizadas</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{autorizadas}</p>
        </div>
      </div>

      <div className="flex gap-2">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium ${activeTab === t.id ? "bg-brand-700 text-white" : "bg-white border dark:bg-neutral-900 dark:border-neutral-700"}`}>{t.icon}{t.label}</button>
        ))}
      </div>

      <PageInfoNote module={activeTab === "stock" ? "reportesStock" : activeTab === "grafico" ? "reportesGrafico" : "reportesFacturas"} />

      {activeTab === "facturas" && (
        <div className="overflow-hidden rounded-xl border bg-white dark:bg-neutral-900 dark:border-neutral-700">
          {loadingF ? <p className="p-4 text-slate-500">Cargando...</p> : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-neutral-800">
                <tr><th className="px-4 py-3 text-left">Numero</th><th className="px-4 py-3 text-left">Cliente</th><th className="px-4 py-3 text-left">Fecha</th><th className="px-4 py-3 text-left">Total</th><th className="px-4 py-3 text-left">Estado SRI</th></tr>
              </thead>
              <tbody>
                {facturas.map((f) => (
                  <tr key={f.id} className="border-t dark:border-neutral-800">
                    <td className="px-4 py-3 font-mono text-xs">{f.numero_comprobante}</td>
                    <td className="px-4 py-3">{clientesMap[f.cliente_id] || `Cliente #${f.cliente_id}`}</td>
                    <td className="px-4 py-3">{f.fecha_emision}</td>
                    <td className="px-4 py-3 font-semibold">${f.total}</td>
                    <td className="px-4 py-3">{statusIcon(f.sri_estado)} {f.sri_estado}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === "stock" && (
        <div className="overflow-hidden rounded-xl border bg-white dark:bg-neutral-900 dark:border-neutral-700">
          {loadingS ? <p className="p-4 text-slate-500">Cargando...</p> : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-neutral-800">
                <tr><th className="px-4 py-3 text-left">Producto</th><th className="px-4 py-3 text-left">Stock Actual</th><th className="px-4 py-3 text-left">Stock Minimo</th><th className="px-4 py-3 text-left">Alerta</th></tr>
              </thead>
              <tbody>
                {stockData.slice(0, 20).map((p) => (
                  <tr key={p.id} className="border-t dark:border-neutral-800">
                    <td className="px-4 py-3">{p.nombre}</td>
                    <td className="px-4 py-3">{p.stock_actual}</td>
                    <td className="px-4 py-3">{p.stock_minimo}</td>
                    <td className="px-4 py-3">{p.alerta ? <span className="text-red-500 font-semibold">BAJO</span> : <span className="text-emerald-500">OK</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === "grafico" && (
        <div className="rounded-xl border bg-white p-5 dark:bg-neutral-900 dark:border-neutral-700">
          <h3 className="mb-4 font-semibold">Ventas por periodo</h3>
          <div className="h-72">
            {loadingV ? (
              <p className="p-4 text-slate-500">Cargando grafico...</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" /><YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="ventas" stroke="#2563eb" fill="#3b82f6" fillOpacity={0.1} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
