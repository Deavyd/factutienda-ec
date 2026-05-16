import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Calculator,
  CheckCircle2,
  Clock,
  Coins,
  DollarSign,
  Download,
  Eye,
  FileText,
  Filter,
  History,
  Lock,
  Plus,
  Printer,
  Receipt,
  Search,
  ShoppingBag,
  Unlock,
  X,
  XCircle,
} from "lucide-react";
import { PageInfoNote, useToast } from "../../components/ui";
import { useOutletContext } from "react-router-dom";
import { useAbrirCaja, useCerrarCaja, useMovimientoCaja, useTurnoActual } from "../../hooks/useCaja";
import { useFacturas } from "../../hooks/useFacturas";
import { useClientes } from "../../hooks/useClientes";
import { useExportarXmls } from "../../hooks/useReportes";

export default function FacturasPage() {
  const { isDarkMode } = useOutletContext();
  const { pushToast } = useToast();
  const { data: turnoActual, isLoading: loadingCaja } = useTurnoActual();
  const abrirCaja = useAbrirCaja();
  const cerrarCaja = useCerrarCaja();
  const movimientoCaja = useMovimientoCaja();

  const [activeTab, setActiveTab] = useState("caja");

  const [isShiftOpen, setIsShiftOpen] = useState(false);
  const [baseAmount, setBaseAmount] = useState("");
  const [salesSummary] = useState(isShiftOpen ? { cash: 350.5, card: 120, transfer: 45 } : { cash: 0, card: 0, transfer: 0 });
  const [movements, setMovements] = useState([]);
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [movementForm, setMovementForm] = useState({ type: "EGRESO", amount: "", description: "" });
  const [countedCash, setCountedCash] = useState("");

  useEffect(() => {
    setIsShiftOpen(turnoActual?.estado === "ABIERTA");
  }, [turnoActual]);

  const totalIncomes = movements.filter((m) => m.type === "INGRESO").reduce((acc, m) => acc + m.amount, 0);
  const totalExpenses = movements.filter((m) => m.type === "EGRESO").reduce((acc, m) => acc + m.amount, 0);
  const expectedCash = Number(baseAmount || 0) + salesSummary.cash + totalIncomes - totalExpenses;
  const difference = countedCash !== "" ? Number(countedCash) - expectedCash : 0;

  const handleOpenShift = async (e) => {
    e.preventDefault();
    if (!baseAmount || Number(baseAmount) < 0) return;
    try {
      await abrirCaja.mutateAsync({ monto_apertura: Number(baseAmount) });
      setIsShiftOpen(true);
      pushToast({ tone: "success", title: "Turno abierto" });
    } catch {
      pushToast({ tone: "error", title: "No se pudo abrir turno" });
    }
  };

  const handleAddMovement = async (e) => {
    e.preventDefault();
    if (!movementForm.amount || !movementForm.description) return;
    try {
      await movimientoCaja.mutateAsync({
        tipo: movementForm.type,
        monto: Number(movementForm.amount),
        descripcion: movementForm.description,
      });
      setMovements((prev) => [
        { id: Date.now(), time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), ...movementForm, amount: Number(movementForm.amount) },
        ...prev,
      ]);
      setIsMovementModalOpen(false);
      setMovementForm({ type: "EGRESO", amount: "", description: "" });
      pushToast({ tone: "info", title: "Movimiento registrado" });
    } catch {
      pushToast({ tone: "error", title: "No se pudo registrar movimiento" });
    }
  };

  const handleCloseShift = async (e) => {
    e.preventDefault();
    try {
      await cerrarCaja.mutateAsync({ contado: Number(countedCash), esperado: expectedCash });
      setIsShiftOpen(false);
      setIsCloseModalOpen(false);
      setBaseAmount("");
      setCountedCash("");
      pushToast({ tone: "success", title: "Caja cerrada", description: "Se imprimio ticket Z del turno" });
    } catch {
      pushToast({ tone: "error", title: "No se pudo cerrar caja" });
    }
  };

  if (loadingCaja) return <div className="flex h-64 items-center justify-center text-slate-500">Cargando estado de caja...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Modulo Operativo</h2>
        {isShiftOpen ? (
          <div className="inline-flex gap-1 rounded-xl border border-gray-200 bg-white p-1 dark:border-neutral-700 dark:bg-neutral-900">
            <button type="button" onClick={() => setActiveTab("caja")} className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-all ${activeTab === "caja" ? "bg-blue-600 text-white" : "text-gray-600 dark:text-gray-300"}`}>
              Caja
            </button>
            <button type="button" onClick={() => setActiveTab("historial")} className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-all ${activeTab === "historial" ? "bg-blue-600 text-white" : "text-gray-600 dark:text-gray-300"}`}>
              Historial Ventas
            </button>
          </div>
        ) : null}
      </div>

      <PageInfoNote module={activeTab === "historial" && isShiftOpen ? "facturasHistorial" : "facturasCaja"} />

      {activeTab === "historial" && isShiftOpen ? (
        <HistorialVentas />
      ) : (
        <CajaContent
          isShiftOpen={isShiftOpen}
          baseAmount={baseAmount}
          setBaseAmount={setBaseAmount}
          handleOpenShift={handleOpenShift}
          salesSummary={salesSummary}
          movements={movements}
          totalExpenses={totalExpenses}
          totalIncomes={totalIncomes}
          expectedCash={expectedCash}
          difference={difference}
          countedCash={countedCash}
          setCountedCash={setCountedCash}
          setIsMovementModalOpen={setIsMovementModalOpen}
          setIsCloseModalOpen={setIsCloseModalOpen}
          isMovementModalOpen={isMovementModalOpen}
          isCloseModalOpen={isCloseModalOpen}
          movementForm={movementForm}
          setMovementForm={setMovementForm}
          handleAddMovement={handleAddMovement}
          handleCloseShift={handleCloseShift}
        />
      )}
    </div>
  );
}

function CajaContent({
  isShiftOpen, baseAmount, setBaseAmount, handleOpenShift, salesSummary, movements, totalExpenses, totalIncomes,
  expectedCash, difference, countedCash, setCountedCash,
  setIsMovementModalOpen, setIsCloseModalOpen, isMovementModalOpen, isCloseModalOpen,
  movementForm, setMovementForm, handleAddMovement, handleCloseShift,
}) {
  if (!isShiftOpen) {
    return (
      <div className="flex h-[calc(100vh-10rem)] items-center justify-center">
        <div className="w-full max-w-md overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-xl dark:border-neutral-800 dark:bg-neutral-900">
          <div className="flex flex-col items-center border-b border-gray-100 bg-gray-50 p-8 text-center dark:border-neutral-800 dark:bg-neutral-800/50">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
              <Lock size={40} className="text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Caja Cerrada</h2>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Abre un nuevo turno para comenzar a facturar.</p>
          </div>
          <form onSubmit={handleOpenShift} className="space-y-6 p-8">
            <div className="space-y-2 text-center">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Saldo Inicial / Base</label>
              <div className="relative mx-auto max-w-xs">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 font-semibold text-gray-500">$</span>
                <input type="number" step="0.01" required value={baseAmount} onChange={(e) => setBaseAmount(e.target.value)} placeholder="0.00" className="w-full rounded-2xl border-2 border-gray-200 bg-gray-50 py-4 pl-10 pr-4 text-center text-2xl font-bold text-gray-900 transition-colors focus:border-blue-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-950 dark:text-white" />
              </div>
            </div>
            <button type="submit" className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 py-4 text-lg font-bold text-white shadow-lg shadow-blue-500/30 transition-colors hover:bg-blue-700">
              <Unlock size={24} /> Abrir Turno
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 md:flex-row md:items-center">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-900/30">
            <Unlock size={28} className="text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Turno Activo</h1>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
                <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" /> En curso
              </span>
            </div>
            <p className="mt-1 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">Cajero: Administrador • Inicio: {new Date().toLocaleDateString()}</p>
          </div>
        </div>
        <div className="flex w-full items-center gap-3 md:w-auto">
          <button onClick={() => setIsMovementModalOpen(true)} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gray-100 px-5 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-200 dark:bg-neutral-800 dark:text-gray-300 dark:hover:bg-neutral-700 md:flex-none">
            <History size={18} /> Movimiento manual
          </button>
          <button onClick={() => setIsCloseModalOpen(true)} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 px-6 py-3 font-bold text-white shadow-sm transition-colors hover:bg-red-700 md:flex-none">
            <Lock size={18} /> Cerrar Caja
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard icon={Coins} title="Saldo Inicial" value={`$${Number(baseAmount).toFixed(2)}`} tone="gray" subtitle="Base al abrir turno" />
        <KpiCard icon={DollarSign} title="Ventas Efectivo" value={`$${salesSummary.cash.toFixed(2)}`} tone="emerald" subtitle={`+$${salesSummary.card.toFixed(2)} en T/C y Transf.`} />
        <KpiCard icon={ArrowDownRight} title="Egresos" value={`-$${totalExpenses.toFixed(2)}`} tone="red" subtitle="Salidas de dinero" />
        <div className="flex flex-col justify-between rounded-3xl bg-blue-600 p-6 text-white shadow-xl shadow-blue-600/20">
          <div className="mb-4 flex items-start justify-between">
            <div className="rounded-xl bg-white/20 p-3 backdrop-blur-sm"><Calculator size={20} /></div>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-100">Esperado en Caja</span>
          </div>
          <div>
            <p className="text-4xl font-bold">${expectedCash.toFixed(2)}</p>
            <p className="mt-1 text-sm text-blue-200">Efectivo fisico que debe haber</p>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50/50 p-5 dark:border-neutral-800 dark:bg-neutral-900/50">
          <h3 className="flex items-center gap-2 font-bold text-gray-900 dark:text-white"><History size={20} className="text-gray-400" /> Movimientos Manuales del Turno</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/80 text-xs uppercase tracking-wider text-gray-500 dark:border-neutral-800 dark:bg-neutral-900/80 dark:text-gray-400">
                <th className="px-6 py-4 font-medium">Hora</th>
                <th className="px-6 py-4 font-medium">Tipo</th>
                <th className="px-6 py-4 font-medium">Descripcion</th>
                <th className="px-6 py-4 text-right font-medium">Monto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-neutral-800">
              {movements.length > 0 ? (
                movements.map((mov) => (
                  <tr key={mov.id} className="transition-colors hover:bg-gray-50/50 dark:hover:bg-neutral-800/50">
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{mov.time}</td>
                    <td className="px-6 py-4">
                      {mov.type === "INGRESO" ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"><ArrowUpRight size={12} /> Ingreso</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-md bg-red-100 px-2.5 py-1 text-xs font-bold text-red-700 dark:bg-red-900/30 dark:text-red-400"><ArrowDownRight size={12} /> Egreso</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{mov.description}</td>
                    <td className={`px-6 py-4 text-right text-sm font-bold ${mov.type === "INGRESO" ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>{mov.type === "INGRESO" ? "+" : "-"}${mov.amount.toFixed(2)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-400 dark:text-gray-500"><FileText size={32} className="mb-2 opacity-50" /><p className="text-sm">No hay movimientos manuales registrados aun</p></div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isMovementModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-neutral-900">
            <div className="flex items-center justify-between border-b border-gray-100 p-6 dark:border-neutral-800">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Registrar Movimiento</h3>
              <button onClick={() => setIsMovementModalOpen(false)} className="rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 dark:hover:bg-neutral-800"><X size={20} /></button>
            </div>
            <form onSubmit={handleAddMovement} className="space-y-5 p-6">
              <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={() => setMovementForm({ ...movementForm, type: "EGRESO" })} className={`flex flex-col items-center justify-center gap-1 rounded-xl border-2 py-3 transition-all ${movementForm.type === "EGRESO" ? "border-red-500 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400" : "border-transparent bg-gray-50 text-gray-500 hover:bg-gray-100 dark:bg-neutral-800 dark:text-gray-400"}`}><ArrowDownRight size={20} /><span className="text-sm font-bold">Salida / Egreso</span></button>
                <button type="button" onClick={() => setMovementForm({ ...movementForm, type: "INGRESO" })} className={`flex flex-col items-center justify-center gap-1 rounded-xl border-2 py-3 transition-all ${movementForm.type === "INGRESO" ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400" : "border-transparent bg-gray-50 text-gray-500 hover:bg-gray-100 dark:bg-neutral-800 dark:text-gray-400"}`}><ArrowUpRight size={20} /><span className="text-sm font-bold">Ingreso Extra</span></button>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Monto ($) *</label>
                <input type="number" step="0.01" required value={movementForm.amount} onChange={(e) => setMovementForm({ ...movementForm, amount: e.target.value })} placeholder="0.00" className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pr-4 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-neutral-700 dark:bg-neutral-950 dark:text-white" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Motivo / Descripcion *</label>
                <input type="text" required value={movementForm.description} onChange={(e) => setMovementForm({ ...movementForm, description: e.target.value })} placeholder="Ej: Compra de agua, Pago proveedor..." className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-neutral-700 dark:bg-neutral-950 dark:text-white" />
              </div>
              <button type="submit" className="w-full rounded-xl bg-blue-600 py-3 font-bold text-white transition-colors hover:bg-blue-700">Guardar Movimiento</button>
            </form>
          </div>
        </div>
      ) : null}

      {isCloseModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-gray-900/80 p-4 backdrop-blur-sm">
          <div className="my-8 w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-neutral-900">
            <div className="flex items-center justify-between bg-red-600 p-6 text-white">
              <h3 className="flex items-center gap-2 text-xl font-bold"><AlertTriangle size={24} /> Arqueo y Cierre de Turno</h3>
              <button onClick={() => setIsCloseModalOpen(false)} className="rounded-full p-2 text-red-200 transition-colors hover:bg-red-700"><X size={20} /></button>
            </div>
            <form onSubmit={handleCloseShift} className="p-6">
              <div className="mb-6 rounded-2xl border border-gray-100 bg-gray-50 p-5 dark:border-neutral-800 dark:bg-neutral-800/50">
                <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Resumen del Sistema</h4>
                <div className="space-y-3 text-sm">
                  <Row label="Saldo Inicial" value={`$${Number(baseAmount).toFixed(2)}`} />
                  <Row label="+ Ventas en Efectivo" value={`+$${salesSummary.cash.toFixed(2)}`} className="text-emerald-600 dark:text-emerald-400" />
                  <Row label="+ Ingresos Manuales" value={`+$${totalIncomes.toFixed(2)}`} className="text-emerald-600 dark:text-emerald-400" />
                  <Row label="- Egresos Manuales" value={`-$${totalExpenses.toFixed(2)}`} className="text-red-600 dark:text-red-400" />
                  <div className="flex items-center justify-between border-t border-gray-200 pt-3 dark:border-neutral-700">
                    <span className="font-bold text-gray-900 dark:text-white">Efectivo Esperado</span>
                    <span className="text-xl font-bold text-blue-600 dark:text-blue-400">${expectedCash.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              <div className="mb-6 space-y-2 text-center">
                <label className="text-base font-bold text-gray-900 dark:text-white">Dinero fisico contado en gaveta</label>
                <div className="relative mx-auto max-w-sm">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-xl font-bold text-gray-500">$</span>
                  <input type="number" step="0.01" required value={countedCash} onChange={(e) => setCountedCash(e.target.value)} placeholder="0.00" className="w-full rounded-2xl border-2 border-blue-500 bg-white py-4 pl-10 pr-4 text-center text-3xl font-bold text-gray-900 shadow-inner focus:outline-none focus:ring-4 focus:ring-blue-500/20 dark:bg-neutral-950 dark:text-white" />
                </div>
              </div>
              {countedCash !== "" ? (
                <div className={`mb-8 flex items-center gap-4 rounded-2xl p-4 ${difference === 0 ? "border border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/20" : difference > 0 ? "border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20" : "border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20"}`}>
                  <div className={`shrink-0 rounded-xl p-3 ${difference === 0 ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50" : difference > 0 ? "bg-blue-100 text-blue-600 dark:bg-blue-900/50" : "bg-red-100 text-red-600 dark:bg-red-900/50"}`}>
                    {difference === 0 ? <CheckCircle2 size={28} /> : difference > 0 ? <Plus size={28} /> : <AlertTriangle size={28} />}
                  </div>
                  <div>
                    <h4 className={`text-lg font-bold ${difference === 0 ? "text-emerald-800 dark:text-emerald-400" : difference > 0 ? "text-blue-800 dark:text-blue-400" : "text-red-800 dark:text-red-400"}`}>
                      {difference === 0 ? "Cuadre Perfecto" : difference > 0 ? "Sobrante en Caja" : "Faltante en Caja"}
                    </h4>
                    <p className={`text-sm font-medium ${difference === 0 ? "text-emerald-600 dark:text-emerald-500" : difference > 0 ? "text-blue-600 dark:text-blue-500" : "text-red-600 dark:text-red-500"}`}>
                      {difference === 0 ? "Todo coincide exactamente." : `Hay una diferencia de $${Math.abs(difference).toFixed(2)}`}
                    </p>
                  </div>
                </div>
              ) : null}
              <div className="flex gap-3 border-t border-gray-100 pt-4 dark:border-neutral-800">
                <button type="button" onClick={() => setIsCloseModalOpen(false)} className="flex-1 rounded-xl bg-gray-100 px-4 py-3 font-bold text-gray-700 transition-colors hover:bg-gray-200 dark:bg-neutral-800 dark:text-gray-300 dark:hover:bg-neutral-700">Cancelar</button>
                <button type="submit" disabled={countedCash === ""} className="flex flex-[2] items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 font-bold text-white shadow-sm transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-400"><Printer size={18} /> Confirmar y Cierre Z</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function HistorialVentas() {
  const { pushToast } = useToast();
  const { data: facturas = [], isLoading } = useFacturas();
  const { data: clientes = [] } = useClientes();
  const exportarXmls = useExportarXmls();
  const [searchTerm, setSearchTerm] = useState("");
  const [estadoFilter, setEstadoFilter] = useState("TODAS");
  const [fechaFilter, setFechaFilter] = useState("HOY");
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
      const matchSearch =
        v.id.toLowerCase().includes(searchTerm.toLowerCase()) || v.cliente.toLowerCase().includes(searchTerm.toLowerCase());
      const matchEstado = estadoFilter === "TODAS" || v.estadoSRI === estadoFilter;
      return matchSearch && matchEstado;
    });
  }, [ventasMapeadas, searchTerm, estadoFilter]);

  const ventasValidas = ventasFiltradas.filter((v) => v.estadoSRI !== "ANULADO");
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

function KpiCard({ icon: Icon, title, value, subtitle, tone }) {
  const toneMap = {
    gray: "bg-gray-100 text-gray-600 dark:bg-neutral-800 dark:text-gray-400",
    emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400",
    red: "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400",
  };
  return (
    <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <div className="mb-4 flex items-start justify-between">
        <div className={`rounded-xl p-3 ${toneMap[tone]}`}><Icon size={20} /></div>
        <span className="text-xs font-bold uppercase tracking-wider text-gray-500">{title}</span>
      </div>
      <p className="text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>
    </div>
  );
}

function Row({ label, value, className = "" }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-600 dark:text-gray-400">{label}</span>
      <span className={`font-medium text-gray-900 dark:text-white ${className}`}>{value}</span>
    </div>
  );
}
