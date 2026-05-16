import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Box,
  Calendar,
  CheckCircle2,
  DollarSign,
  FileText,
  Plus,
  Search,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { useCompras, useCreateCompra } from "../../hooks/useCompras";
import { useProveedores } from "../../hooks/useProveedores";
import { useProductos } from "../../hooks/useProductos";
import { PageInfoNote, useToast } from "../../components/ui";

export default function ComprasPage() {
  const { pushToast } = useToast();
  const { data: compras = [], isLoading, error } = useCompras();
  const { data: proveedores = [] } = useProveedores();
  const { data: productos = [] } = useProductos();
  const createCompra = useCreateCompra();

  const [viewMode, setViewMode] = useState("list");
  const [searchTerm, setSearchTerm] = useState("");
  const [isCargandoXML, setIsCargandoXML] = useState(false);

  const [formCompra, setFormCompra] = useState({
    proveedorId: "",
    documento: "",
    claveAcceso: "",
    fechaEmision: "",
    sustentoTributario: "01",
  });

  const [itemsCompra, setItemsCompra] = useState([]);

  const proveedoresMap = useMemo(() => Object.fromEntries(proveedores.map((p) => [p.id, p.razon_social])), [proveedores]);

  const filtered = compras.filter(
    (c) =>
      (c.numero_documento || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (proveedoresMap[c.proveedor_id] || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const agregarFila = () => {
    setItemsCompra([...itemsCompra, { id: Date.now(), productoId: "", cant: 1, costoU: 0, iva: 15 }]);
  };

  const eliminarFila = (id) => {
    setItemsCompra(itemsCompra.filter((item) => item.id !== id));
  };

  const actualizarFila = (id, campo, valor) => {
    setItemsCompra(
      itemsCompra.map((item) => {
        if (item.id === id) {
          const newItem = { ...item, [campo]: valor };
          if (campo === "productoId") {
            const prodSel = productos.find((p) => String(p.id) === String(valor));
            if (prodSel) newItem.iva = 15;
          }
          return newItem;
        }
        return item;
      })
    );
  };

  const simularCargaXML = () => {
    setIsCargandoXML(true);
    setTimeout(() => {
      setFormCompra({
        proveedorId: proveedores[0]?.id ? String(proveedores[0].id) : "",
        documento: "001-002-000001050",
        claveAcceso: "1505202601099234567800120010020000010501234567812",
        fechaEmision: new Date().toISOString().slice(0, 10),
        sustentoTributario: "01",
      });
      if (productos.length >= 2) {
        setItemsCompra([
          { id: Date.now() + 1, productoId: String(productos[0]?.id || ""), cant: 50, costoU: 0.8, iva: 15 },
          { id: Date.now() + 2, productoId: String(productos[1]?.id || ""), cant: 20, costoU: 1.5, iva: 15 },
        ]);
      }
      setIsCargandoXML(false);
    }, 1500);
  };

  const calculos = useMemo(() => {
    let subtotal15 = 0;
    let subtotal0 = 0;

    itemsCompra.forEach((item) => {
      const sub = (parseFloat(item.cant) || 0) * (parseFloat(item.costoU) || 0);
      if (item.iva === 15) subtotal15 += sub;
      else subtotal0 += sub;
    });

    const montoIva = subtotal15 * 0.15;
    const total = subtotal15 + subtotal0 + montoIva;

    return { subtotal15, subtotal0, montoIva, total };
  }, [itemsCompra]);

  const handleGuardarCompra = async () => {
    if (!formCompra.proveedorId || itemsCompra.length === 0) return;
    try {
      await createCompra.mutateAsync({
        empresa_id: 1,
        proveedor_id: parseInt(formCompra.proveedorId, 10),
        numero_documento: formCompra.documento,
        fecha_emision: formCompra.fechaEmision,
        detalles: itemsCompra.map((item) => ({
          producto_id: parseInt(item.productoId, 10) || 0,
          cantidad: parseFloat(item.cant) || 0,
          costo_unitario: parseFloat(item.costoU) || 0,
        })),
      });
      pushToast({ tone: "success", title: "Compra registrada", description: `Total: $${calculos.total.toFixed(2)}. Stock actualizado.` });
      setViewMode("list");
      setItemsCompra([]);
      setFormCompra({ proveedorId: "", documento: "", claveAcceso: "", fechaEmision: "", sustentoTributario: "01" });
    } catch {
      pushToast({ tone: "error", title: "Error al registrar compra" });
    }
  };

  if (isLoading) return <div className="flex h-64 items-center justify-center text-slate-500">Cargando compras...</div>;
  if (error) return <div className="flex h-64 items-center justify-center text-red-500">Error al cargar compras</div>;

  return (
    <div className="space-y-6">
      {viewMode === "list" ? (
        <>
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <h1 className="text-2xl font-black tracking-tight text-gray-800 dark:text-white">Compras / Inventario</h1>
            <button
              onClick={() => setViewMode("new")}
              className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 font-bold text-white shadow-[0_4px_14px_0_rgba(37,99,235,0.39)] transition-all hover:bg-blue-700"
            >
              <Plus size={18} strokeWidth={2.5} /> Nueva Compra
            </button>
          </div>

          <PageInfoNote module="compras" />

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-neutral-700 dark:bg-neutral-900">
              <div>
                <p className="mb-1 text-sm font-medium text-gray-500">Compras registradas</p>
                <h2 className="text-3xl font-black text-gray-900 dark:text-white">{compras.length}</h2>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                <FileText size={24} />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-neutral-700 dark:bg-neutral-900">
              <div>
                <p className="mb-1 text-sm font-medium text-gray-500">Productos en catalogo</p>
                <h2 className="text-3xl font-black text-gray-900 dark:text-white">{productos.length}</h2>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                <Box size={24} />
              </div>
            </div>
          </div>

          <div className="flex items-center rounded-xl border border-gray-200 bg-white p-3 shadow-sm transition-all focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 dark:border-neutral-700 dark:bg-neutral-900">
            <Search className="mr-3 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar compra por factura o proveedor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-transparent text-sm text-gray-700 outline-none dark:text-gray-200"
            />
          </div>

          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-neutral-700 dark:bg-neutral-900">
            <div className="grid grid-cols-12 gap-4 border-b border-gray-100 bg-gray-50/50 p-4 text-xs font-bold uppercase tracking-wider text-gray-500 dark:border-neutral-700 dark:bg-neutral-800/50 dark:text-gray-400">
              <div className="col-span-12 pl-2 sm:col-span-3">Documento</div>
              <div className="col-span-12 hidden sm:col-span-4 sm:block">Proveedor</div>
              <div className="col-span-12 hidden md:col-span-2 md:block">Fecha</div>
              <div className="col-span-6 sm:col-span-1">Total</div>
              <div className="col-span-6 pr-2 text-right sm:col-span-2">Estado</div>
            </div>

            <div className="divide-y divide-gray-50 dark:divide-neutral-800">
              {filtered.map((comp) => (
                <div key={comp.id} className="group grid grid-cols-12 items-center gap-4 p-4 transition-colors hover:bg-gray-50/50 dark:hover:bg-neutral-800/50">
                  <div className="col-span-8 pl-2 font-mono text-sm font-bold text-gray-900 dark:text-white sm:col-span-3">{comp.numero_documento}</div>
                  <div className="col-span-12 hidden text-sm text-gray-700 dark:text-gray-300 sm:col-span-4 sm:block">{proveedoresMap[comp.proveedor_id] || `#${comp.proveedor_id}`}</div>
                  <div className="col-span-12 hidden text-sm text-gray-500 dark:text-gray-400 md:col-span-2 md:block">{comp.fecha_emision}</div>
                  <div className="col-span-4 text-sm font-bold text-gray-900 dark:text-white sm:col-span-1">${parseFloat(comp.total || 0).toFixed(2)}</div>
                  <div className="col-span-12 flex justify-end pr-2 sm:col-span-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[10px] font-bold text-blue-600 dark:border-blue-800/50 dark:bg-blue-900/20 dark:text-blue-400">
                      <CheckCircle2 size={12} strokeWidth={3} /> {comp.estado || "REGISTRADA"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <button
              onClick={() => setViewMode("list")}
              className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 font-medium text-gray-500 shadow-sm transition-colors hover:text-gray-800 dark:border-neutral-700 dark:bg-neutral-900 dark:hover:text-white"
            >
              <ArrowLeft size={18} /> Volver
            </button>

            <button
              onClick={simularCargaXML}
              disabled={isCargandoXML}
              className="flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2 font-bold text-indigo-700 shadow-sm transition-all hover:bg-indigo-100 dark:border-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400"
            >
              {isCargandoXML ? (
                <span className="h-4 w-4 animate-spin rounded-full border-b-2 border-indigo-700" />
              ) : (
                <UploadCloud size={18} />
              )}
              {isCargandoXML ? "Procesando..." : "Cargar XML del Proveedor"}
            </button>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <div className="space-y-6 xl:col-span-2">
              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-neutral-700 dark:bg-neutral-900">
                <h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-gray-400">
                  <FileText size={16} /> Datos de la Factura
                </h2>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="mb-1.5 block text-xs font-bold text-gray-700 dark:text-gray-300">Proveedor *</label>
                    <select
                      value={formCompra.proveedorId}
                      onChange={(e) => setFormCompra({ ...formCompra, proveedorId: e.target.value })}
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-neutral-700 dark:bg-neutral-950 dark:text-white"
                    >
                      <option value="">Seleccione un proveedor...</option>
                      {proveedores.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.razon_social} (RUC: {p.identificacion})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-gray-700 dark:text-gray-300">N° Documento Fisico/Electronico *</label>
                    <input
                      type="text"
                      placeholder="001-001-000000000"
                      value={formCompra.documento}
                      onChange={(e) => setFormCompra({ ...formCompra, documento: e.target.value })}
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 font-mono text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-neutral-700 dark:bg-neutral-950 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-gray-700 dark:text-gray-300">Fecha Emision *</label>
                    <div className="relative">
                      <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="date"
                        value={formCompra.fechaEmision}
                        onChange={(e) => setFormCompra({ ...formCompra, fechaEmision: e.target.value })}
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-neutral-700 dark:bg-neutral-950 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="mb-1.5 flex justify-between text-xs font-bold text-gray-700 dark:text-gray-300">
                      <span>Clave de Acceso (Autorizacion SRI)</span>
                      <span className="text-[10px] font-normal text-gray-400">49 Digitos</span>
                    </label>
                    <input
                      type="text"
                      maxLength={49}
                      placeholder="Copie y pegue la clave de 49 digitos del RIDE"
                      value={formCompra.claveAcceso}
                      onChange={(e) => setFormCompra({ ...formCompra, claveAcceso: e.target.value })}
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 font-mono text-xs tracking-widest text-gray-600 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-neutral-700 dark:bg-neutral-950 dark:text-gray-300"
                    />
                  </div>
                </div>
              </div>

              <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-neutral-700 dark:bg-neutral-900">
                <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/50 p-4 dark:border-neutral-700 dark:bg-neutral-800/50">
                  <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-gray-400">
                    <Box size={16} /> Detalle y Stock
                  </h2>
                  <button onClick={agregarFila} className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-600 transition-colors hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400">
                    + Fila Manual
                  </button>
                </div>

                <div className="overflow-x-auto p-4">
                  <table className="min-w-[600px] w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 text-left text-xs text-gray-500 dark:border-neutral-700">
                        <th className="w-1/3 pb-3 font-bold">Producto del Catalogo</th>
                        <th className="pb-3 font-bold">Cant (Ingresa)</th>
                        <th className="pb-3 font-bold">Costo U.</th>
                        <th className="pb-3 font-bold">IVA</th>
                        <th className="pb-3 text-right font-bold">Subtotal</th>
                        <th className="pb-3" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-neutral-800">
                      {itemsCompra.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-gray-400">
                            <p className="font-medium">No hay productos agregados.</p>
                            <p className="text-xs">Usa "Cargar XML" o agrega una fila manual.</p>
                          </td>
                        </tr>
                      ) : (
                        itemsCompra.map((item) => (
                          <tr key={item.id} className="group transition-colors hover:bg-gray-50 dark:hover:bg-neutral-800/50">
                            <td className="py-2 pr-2">
                              <select
                                value={item.productoId}
                                onChange={(e) => actualizarFila(item.id, "productoId", e.target.value)}
                                className="w-full rounded-lg border border-gray-200 bg-white p-2 outline-none focus:border-blue-400 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
                              >
                                <option value="">Seleccionar...</option>
                                {productos.map((p) => (
                                  <option key={p.id} value={p.id}>
                                    {p.nombre}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="py-2 pr-2">
                              <input
                                type="number"
                                min="1"
                                value={item.cant}
                                onChange={(e) => actualizarFila(item.id, "cant", e.target.value)}
                                className="w-full rounded-lg border border-gray-200 bg-white p-2 outline-none focus:border-blue-400 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
                              />
                            </td>
                            <td className="py-2 pr-2">
                              <div className="relative">
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">$</span>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={item.costoU}
                                  onChange={(e) => actualizarFila(item.id, "costoU", e.target.value)}
                                  className="w-full rounded-lg border border-gray-200 bg-white p-2 pl-5 outline-none focus:border-blue-400 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
                                />
                              </div>
                            </td>
                            <td className="py-2 pr-2">
                              <select
                                value={item.iva}
                                onChange={(e) => actualizarFila(item.id, "iva", parseInt(e.target.value, 10))}
                                className="w-full rounded-lg border border-gray-200 bg-white p-2 outline-none focus:border-blue-400 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
                              >
                                <option value={15}>15%</option>
                                <option value={0}>0%</option>
                              </select>
                            </td>
                            <td className="py-2 pr-2 text-right font-medium text-gray-800 dark:text-white">
                              ${((parseFloat(item.cant) || 0) * (parseFloat(item.costoU) || 0)).toFixed(2)}
                            </td>
                            <td className="py-2 text-right">
                              <button onClick={() => eliminarFila(item.id)} className="rounded p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500">
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="xl:col-span-1">
              <div className="sticky top-8 rounded-2xl bg-slate-900 p-6 text-white shadow-xl">
                <h3 className="mb-6 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-400">
                  <DollarSign size={16} /> Resumen de Compra
                </h3>

                <div className="mb-6 space-y-4 border-b border-slate-700 pb-6 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Subtotal 15%</span>
                    <span className="font-medium">${calculos.subtotal15.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Subtotal 0%</span>
                    <span className="font-medium">${calculos.subtotal0.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">IVA 15%</span>
                    <span className="font-medium">${calculos.montoIva.toFixed(2)}</span>
                  </div>
                </div>

                <div className="mb-8 flex items-end justify-between">
                  <span className="font-bold text-gray-400">Total a Pagar</span>
                  <span className="text-3xl font-black">${calculos.total.toFixed(2)}</span>
                </div>

                <button
                  onClick={handleGuardarCompra}
                  disabled={itemsCompra.length === 0 || !formCompra.proveedorId}
                  className={`flex w-full items-center justify-center gap-2 rounded-xl py-3.5 font-bold shadow-lg transition-all ${
                    itemsCompra.length > 0 && formCompra.proveedorId
                      ? "bg-blue-600 text-white shadow-blue-600/30 hover:bg-blue-500"
                      : "cursor-not-allowed bg-slate-800 text-slate-600 shadow-none"
                  }`}
                >
                  <CheckCircle2 size={20} /> Registrar en Inventario
                </button>
                <p className="mt-4 text-center text-[10px] text-slate-500">
                  Al guardar, las cantidades se sumaran automaticamente al stock de cada producto.
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
