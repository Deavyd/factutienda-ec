import { useState } from "react";
import {
  AlertCircle,
  BadgeDollarSign,
  Banknote,
  Calendar,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  DollarSign,
  FileText,
  History,
  Search,
  User,
} from "lucide-react";
import { useCuentasCobrar, useCuentasResumen, usePagarCuentaCobrar } from "../../hooks/useCuentasCobrar";
import { useClientes } from "../../hooks/useClientes";
import { PageInfoNote, useToast } from "../../components/ui";

export default function CuentasCobrarPage() {
  const { pushToast } = useToast();
  const { data: cartera = [], isLoading } = useCuentasCobrar();
  const { data: resumen } = useCuentasResumen();
  const pagarCuenta = usePagarCuentaCobrar();
  const { data: clientes = [] } = useClientes();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClient, setSelectedClient] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [abonoForm, setAbonoForm] = useState({ monto: "", metodo: "EFECTIVO", referencia: "" });
  const [mensajeExito, setMensajeExito] = useState(null);

  const clientesMap = Object.fromEntries(clientes.map((c) => [c.id, c.razon_social]));

  const carteraMapeada = cartera.map((c) => ({
    id: c.id,
    cliente: clientesMap[c.cliente_id] || `Cliente #${c.cliente_id}`,
    identificacion: c.cliente_id ? String(c.cliente_id) : "",
    telefono: "",
    totalDeuda: parseFloat(c.monto_pendiente || 0),
    estado: parseFloat(c.monto_pendiente || 0) > 0 ? "VENCIDO" : "AL_DIA",
    facturas: [
      {
        id: c.id,
        numero: `FAC-${c.cliente_id}-${c.id}`,
        fecha: c.fecha_vencimiento || "",
        vence: c.fecha_vencimiento || "",
        total: parseFloat(c.monto_total || 0),
        saldo: parseFloat(c.monto_pendiente || 0),
        estado: parseFloat(c.monto_pendiente || 0) > 0 ? "VENCIDA" : "AL_DIA",
      },
    ],
  }));

  const filtered = carteraMapeada.filter(
    (c) => c.cliente.toLowerCase().includes(searchTerm.toLowerCase()) || c.identificacion.includes(searchTerm)
  );

  const totalPorCobrar = carteraMapeada.reduce((acc, c) => acc + c.totalDeuda, 0);
  const totalVencido = carteraMapeada.filter((c) => c.estado === "VENCIDO").reduce((acc, c) => acc + c.totalDeuda, 0);

  const handleOpenDetalle = (cliente) => {
    setSelectedClient(cliente);
    setIsModalOpen(true);
  };

  const handleRegistrarAbono = async (e, idFactura) => {
    e.preventDefault();
    const monto = parseFloat(abonoForm.monto);
    if (!monto || monto <= 0) return;

    try {
      await pagarCuenta.mutateAsync({ id: selectedClient.id, data: { monto: parseFloat(abonoForm.monto), forma_pago: abonoForm.metodo } });
      setMensajeExito(`Abono de $${monto.toFixed(2)} registrado exitosamente.`);
      setTimeout(() => setMensajeExito(null), 3000);
      setAbonoForm({ monto: "", metodo: "EFECTIVO", referencia: "" });
      setIsModalOpen(false);
    } catch {
      pushToast({ tone: "error", title: "Error al registrar abono" });
    }
  };

  if (isLoading) return <div className="flex h-64 items-center justify-center text-slate-500">Cargando cuentas...</div>;

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
            <BadgeDollarSign size={28} className="text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Cuentas por Cobrar</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Gestion de creditos, facturas pendientes y registro de abonos.</p>
          </div>
        </div>
      </div>

      <PageInfoNote module="cuentasCobrar" />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <p className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400">
            <DollarSign size={16} /> Total de Cartera
          </p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">${totalPorCobrar.toFixed(2)}</p>
        </div>
        <div className="rounded-3xl border border-red-100 bg-red-50 p-6 shadow-sm dark:border-red-900/30 dark:bg-red-900/10">
          <p className="mb-2 flex items-center gap-2 text-sm font-medium text-red-600 dark:text-red-400">
            <AlertCircle size={16} /> Total Vencido (Riesgo)
          </p>
          <p className="text-3xl font-bold text-red-600 dark:text-red-500">${totalVencido.toFixed(2)}</p>
        </div>
        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <p className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400">
            <User size={16} /> Clientes con Credito
          </p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{carteraMapeada.length}</p>
        </div>
      </div>

      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
          <Search size={18} className="text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Buscar por cliente o identificacion..."
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
                <th className="px-6 py-4 font-medium">Cliente</th>
                <th className="px-6 py-4 font-medium">Contacto</th>
                <th className="px-6 py-4 font-medium">Documentos Pendientes</th>
                <th className="px-6 py-4 font-medium">Estado de Cuenta</th>
                <th className="px-6 py-4 text-right font-medium">Saldo Total</th>
                <th className="px-6 py-4 text-center font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-neutral-800">
              {filtered.map((c) => (
                <tr
                  key={c.id}
                  className="group cursor-pointer transition-colors hover:bg-gray-50/50 dark:hover:bg-neutral-800/50"
                  onClick={() => handleOpenDetalle(c)}
                >
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{c.cliente}</p>
                      <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">ID: {c.identificacion}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{c.telefono || "-"}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center justify-center rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-bold text-gray-700 dark:bg-neutral-800 dark:text-gray-300">
                      {c.facturas.length} Facturas
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {c.estado === "AL_DIA" ? (
                      <span className="inline-flex items-center gap-1 rounded-lg border border-blue-100 bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-600 dark:border-blue-800/50 dark:bg-blue-900/20 dark:text-blue-400">
                        <CheckCircle2 size={14} /> Al Dia
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-lg border border-red-100 bg-red-50 px-2.5 py-1 text-xs font-bold text-red-600 dark:border-red-800/50 dark:bg-red-900/20 dark:text-red-400">
                        <AlertCircle size={14} /> Vencido
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-sm font-bold text-gray-900 dark:text-white">${c.totalDeuda.toFixed(2)}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button className="flex w-full items-center gap-1 justify-center text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
                      Detalle <ChevronRight size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && selectedClient ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 p-4 backdrop-blur-sm dark:bg-black/70">
          <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-neutral-900">
            <div className="flex shrink-0 items-center justify-between border-b border-gray-100 bg-blue-50/50 p-6 dark:border-neutral-800 dark:bg-blue-900/10">
              <div>
                <h3 className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-white">
                  <User className="text-blue-500" size={24} /> {selectedClient.cliente}
                </h3>
                <p className="mt-1 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <span>ID: {selectedClient.identificacion}</span> |
                  <span className="font-bold text-gray-900 dark:text-white">Deuda Total: ${selectedClient.totalDeuda.toFixed(2)}</span>
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-neutral-800 dark:hover:text-gray-300"
              >
                <span className="text-2xl leading-none">&times;</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <h4 className="mb-4 border-b border-gray-100 pb-2 text-sm font-bold uppercase tracking-wider text-gray-900 dark:border-neutral-800 dark:text-white">
                Facturas Pendientes
              </h4>

              <div className="space-y-4">
                {selectedClient.facturas.map((fac) => (
                  <div
                    key={fac.id}
                    className={`rounded-2xl border p-5 transition-all ${
                      fac.estado === "VENCIDA"
                        ? "border-red-200 bg-red-50/30 dark:border-red-900/50 dark:bg-red-900/10"
                        : "border-gray-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
                    }`}
                  >
                    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                      <div>
                        <div className="mb-1 flex items-center gap-2">
                          <FileText size={18} className="text-gray-400" />
                          <span className="text-lg font-bold text-gray-900 dark:text-white">{fac.numero}</span>
                          {fac.estado === "VENCIDA" ? (
                            <span className="animate-pulse rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-red-700 bg-red-100 dark:bg-red-900/30 dark:text-red-400">
                              Vencida
                            </span>
                          ) : null}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                          <span className="flex items-center gap-1">
                            <Calendar size={12} /> Emitida: {fac.fecha}
                          </span>
                          <span className={`flex items-center gap-1 font-medium ${fac.estado === "VENCIDA" ? "text-red-600 dark:text-red-400" : ""}`}>
                            <History size={12} /> Vence: {fac.vence}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-6 md:flex-row md:items-center">
                        <div className="text-right">
                          <p className="text-xs text-gray-500 dark:text-gray-400">Total: ${fac.total.toFixed(2)}</p>
                          <p className="text-lg font-bold text-blue-600 dark:text-blue-400">Saldo: ${fac.saldo.toFixed(2)}</p>
                        </div>

                        <form
                          onSubmit={(e) => handleRegistrarAbono(e, fac.id)}
                          className="flex flex-wrap items-center gap-2 rounded-xl border border-gray-100 bg-gray-50 p-2 dark:border-neutral-800 dark:bg-neutral-950 md:flex-nowrap"
                        >
                          <div className="min-w-[120px] flex-1">
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-gray-500">$</span>
                              <input
                                type="number"
                                step="0.01"
                                max={fac.saldo}
                                required
                                placeholder="Monto"
                                value={abonoForm.monto}
                                onChange={(e) => setAbonoForm({ ...abonoForm, monto: e.target.value })}
                                className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-7 pr-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
                              />
                            </div>
                          </div>
                          <div className="w-full md:w-auto">
                            <select
                              value={abonoForm.metodo}
                              onChange={(e) => setAbonoForm({ ...abonoForm, metodo: e.target.value })}
                              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
                            >
                              <option value="EFECTIVO">Efectivo</option>
                              <option value="TRANSFERENCIA">Transf.</option>
                              <option value="TARJETA">Tarjeta</option>
                            </select>
                          </div>
                          <button
                            type="submit"
                            className="w-full whitespace-nowrap rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow-md shadow-blue-500/20 transition-colors hover:bg-blue-700 md:w-auto"
                          >
                            Abonar
                          </button>
                        </form>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex shrink-0 items-center justify-between border-t border-gray-100 bg-gray-50/50 p-6 dark:border-neutral-800 dark:bg-neutral-950/50">
              <p className="max-w-sm text-xs text-gray-500 dark:text-gray-400">
                Al registrar un abono, si este cubre el 100% del saldo, la factura se marcara como pagada y se movera al historial.
              </p>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-xl px-6 py-2.5 font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-neutral-800"
              >
                Cerrar Panel
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
