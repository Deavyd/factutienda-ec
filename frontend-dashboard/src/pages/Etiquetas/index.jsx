import { useMemo, useState } from "react";
import { Printer, QrCode, Barcode, Search, Settings2, Layers, FileText, Droplet, Scale, Package } from "lucide-react";
import { useProductos } from "../../hooks/useProductos";
import { useGenerarEtiqueta } from "../../hooks/useEtiquetas";
import { PageInfoNote, useToast } from "../../components/ui";

export default function EtiquetasPage() {
  const { data: productos = [], isLoading } = useProductos();
  const { pushToast } = useToast();

  const unidadesMedida = [
    { id: "u", nombre: "Unidad (U)", icon: Package },
    { id: "l", nombre: "Litros (L)", icon: Droplet },
    { id: "gal", nombre: "Galones (Gal)", icon: Droplet },
    { id: "ml", nombre: "Mililitros (ml)", icon: Droplet },
    { id: "kg", nombre: "Kilogramos (Kg)", icon: Scale },
    { id: "lb", nombre: "Libras (lb)", icon: Scale },
  ];

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const generateMutation = useGenerarEtiqueta();
  const [labelConfig, setLabelConfig] = useState({
    nombrePersonalizado: "",
    precio: "",
    unidad: "u",
    tipoCodigo: "QR",
    cantidad: 12,
    tamanio: "MEDIUM",
  });

  const filteredProducts = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return productos.filter((p) => p.nombre?.toLowerCase().includes(term) || p.codigo_interno?.toLowerCase().includes(term) || p.codigo_barras?.toLowerCase().includes(term));
  }, [productos, searchTerm]);

  const handleSelectProduct = (prod) => {
    setSelectedProduct(prod);
    setSearchTerm("");
    setLabelConfig((prev) => ({
      ...prev,
      nombrePersonalizado: prod.nombre,
      precio: String(prod.precio_venta || prod.precio_sin_iva || 0),
    }));
  };

  const handleGenerate = async () => {
    if (!selectedProduct) {
      pushToast({ tone: "error", title: "Selecciona un producto" });
      return;
    }
    try {
      const result = await generateMutation.mutateAsync({
        producto_id: selectedProduct.id,
        cantidad: labelConfig.cantidad,
        config: {
          tamano: labelConfig.tamanio,
          mostrar_precio: true,
          mostrar_barcode: labelConfig.tipoCodigo === "BARCODE",
          formato_codigo: labelConfig.tipoCodigo === "BARCODE" ? "CODE128" : "QR",
        },
      });
      if (result?.content_base64 && result?.filename) {
        const link = document.createElement("a");
        link.href = `data:application/pdf;base64,${result.content_base64}`;
        link.download = result.filename;
        link.click();
      }
      pushToast({ tone: "success", title: "Etiquetas generadas" });
    } catch {
      pushToast({ tone: "error", title: "No se pudo generar etiquetas" });
    }
  };

  const handlePrint = () => window.print();

  const getGridCols = () => {
    switch (labelConfig.tamanio) {
      case "SMALL":
        return "grid-cols-4 md:grid-cols-5 gap-2";
      case "LARGE":
        return "grid-cols-2 gap-4";
      default:
        return "grid-cols-3 gap-3";
    }
  };

  const getLabelHeight = () => {
    switch (labelConfig.tamanio) {
      case "SMALL":
        return "h-[25mm]";
      case "LARGE":
        return "h-[60mm]";
      default:
        return "h-[35mm]";
    }
  };

  if (isLoading) return <div className="flex h-64 items-center justify-center text-slate-500">Cargando productos...</div>;

  return (
    <div className="font-sans transition-colors duration-300 print:min-h-0 print:bg-white">
      <div className="mb-6 print:hidden">
        <div className="flex flex-col items-start justify-between gap-4 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 md:flex-row md:items-center">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-pink-100 dark:bg-pink-900/30">
              <Printer size={28} className="text-pink-600 dark:text-pink-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Generador de Etiquetas</h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Crea tickets con QR/Codigo de barras para fracciones o nuevos productos.
              </p>
            </div>
          </div>
          <div className="flex w-full gap-2 md:w-auto">
            <button onClick={handleGenerate} disabled={generateMutation.isPending} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 py-3 font-bold text-white transition-all hover:bg-slate-800 disabled:opacity-60 md:flex-none">
              <FileText size={18} /> Generar
            </button>
            <button onClick={handlePrint} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-pink-600 px-6 py-3 font-bold text-white shadow-lg shadow-pink-500/30 transition-all hover:bg-pink-700 md:flex-none">
              <Printer size={20} /> Imprimir A4
            </button>
          </div>
        </div>
      </div>

      <PageInfoNote module="etiquetas" className="mb-6 print:hidden" />

      <div className="flex flex-col gap-8 pb-12 print:m-0 print:block print:p-0 lg:flex-row">
        <div className="w-full shrink-0 space-y-6 print:hidden lg:w-[400px]">
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white">
              <Search size={16} className="text-pink-500" /> 1. Producto Base
            </h3>

            {!selectedProduct ? (
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar en inventario..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-10 pr-4 text-gray-900 focus:outline-none focus:ring-2 focus:ring-pink-500/20 dark:border-neutral-700 dark:bg-neutral-950 dark:text-white"
                />

                {searchTerm.length > 0 ? (
                  <div className="absolute z-10 mt-2 w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl dark:border-neutral-700 dark:bg-neutral-800">
                    {filteredProducts.slice(0, 20).map((prod) => (
                      <button
                        key={prod.id}
                        onClick={() => handleSelectProduct(prod)}
                        className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-gray-50 dark:hover:bg-neutral-700"
                      >
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{prod.nombre}</span>
                        <span className="text-xs text-gray-500">${Number(prod.precio_venta || prod.precio_sin_iva || 0).toFixed(2)}</span>
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="flex items-center justify-between rounded-xl border border-pink-100 bg-pink-50 p-4 dark:border-pink-800/30 dark:bg-pink-900/10">
                <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{selectedProduct.nombre}</p>
                  <p className="mt-0.5 text-xs text-gray-500">SKU: {selectedProduct.codigo_interno || selectedProduct.codigo_barras || "N/A"}</p>
                </div>
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="text-xs font-bold text-pink-600 underline hover:text-pink-700 dark:text-pink-400"
                >
                  Cambiar
                </button>
              </div>
            )}
          </div>

          <div className={`rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 ${!selectedProduct ? "pointer-events-none opacity-80" : ""}`}>
            <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white">
              <Settings2 size={16} className="text-pink-500" /> 2. Datos de la Etiqueta
            </h3>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Nombre Personalizado</label>
                <input
                  type="text"
                  value={labelConfig.nombrePersonalizado}
                  onChange={(e) => setLabelConfig({ ...labelConfig, nombrePersonalizado: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-pink-500/20 dark:border-neutral-700 dark:bg-neutral-950 dark:text-white"
                  placeholder="Ej. Media botella de agua"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Precio de Venta</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-gray-500">$</span>
                    <input
                      type="number"
                      step="0.01"
                      value={labelConfig.precio}
                      onChange={(e) => setLabelConfig({ ...labelConfig, precio: e.target.value })}
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-7 pr-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-pink-500/20 dark:border-neutral-700 dark:bg-neutral-950 dark:text-white"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Unidad de Medida</label>
                  <select
                    value={labelConfig.unidad}
                    onChange={(e) => setLabelConfig({ ...labelConfig, unidad: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-pink-500/20 dark:border-neutral-700 dark:bg-neutral-950 dark:text-white"
                  >
                    {unidadesMedida.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className={`rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 ${!selectedProduct ? "pointer-events-none opacity-80" : ""}`}>
            <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white">
              <Layers size={16} className="text-pink-500" /> 3. Formato de Impresion
            </h3>

            <div className="space-y-5">
              <div className="flex gap-2 rounded-xl bg-gray-100 p-1 dark:bg-neutral-800">
                <button
                  onClick={() => setLabelConfig({ ...labelConfig, tipoCodigo: "BARCODE" })}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-bold transition-all ${
                    labelConfig.tipoCodigo === "BARCODE"
                      ? "bg-white text-pink-600 shadow-sm dark:bg-neutral-900"
                      : "text-gray-500 dark:text-gray-400"
                  }`}
                >
                  <Barcode size={18} /> Barras
                </button>
                <button
                  onClick={() => setLabelConfig({ ...labelConfig, tipoCodigo: "QR" })}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-bold transition-all ${
                    labelConfig.tipoCodigo === "QR"
                      ? "bg-white text-pink-600 shadow-sm dark:bg-neutral-900"
                      : "text-gray-500 dark:text-gray-400"
                  }`}
                >
                  <QrCode size={18} /> QR Code
                </button>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Tamano (Afecta cantidad por hoja)</label>
                <select
                  value={labelConfig.tamanio}
                  onChange={(e) => setLabelConfig({ ...labelConfig, tamanio: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-pink-500/20 dark:border-neutral-700 dark:bg-neutral-950 dark:text-white"
                >
                  <option value="SMALL">Pequena (Joyeria / Cosmeticos)</option>
                  <option value="MEDIUM">Mediana (Estandar Gondolas)</option>
                  <option value="LARGE">Grande (Cajas / Bultos)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Cantidad de etiquetas a generar</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={labelConfig.cantidad}
                  onChange={(e) => setLabelConfig({ ...labelConfig, cantidad: parseInt(e.target.value, 10) || 1 })}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-center text-lg font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-pink-500/20 dark:border-neutral-700 dark:bg-neutral-950 dark:text-white"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="relative flex flex-1 justify-center overflow-hidden rounded-3xl bg-gray-200 shadow-inner print:m-0 print:w-full print:rounded-none print:bg-white print:p-0 print:shadow-none dark:bg-neutral-800">
          <div className="flex max-h-[800px] w-full justify-center overflow-y-auto p-4 print:max-h-none print:overflow-visible print:p-0 md:p-8">
            <div className="min-h-[297mm] w-[210mm] shrink-0 bg-white p-[10mm] text-black shadow-2xl print:shadow-none md:p-[15mm]">
              {!selectedProduct ? (
                <div className="flex h-full w-full flex-col items-center justify-center rounded-2xl border-4 border-dashed border-gray-200 text-gray-400">
                  <FileText size={64} className="mb-4 text-gray-300" />
                  <p className="text-lg font-bold text-gray-500">Selecciona un producto</p>
                  <p className="text-sm">La previsualizacion A4 aparecera aqui.</p>
                </div>
              ) : (
                <div className={`grid content-start ${getGridCols()}`}>
                  {Array.from({ length: labelConfig.cantidad }).map((_, index) => (
                    <div
                      key={index}
                      className={`flex flex-col items-center justify-between overflow-hidden border border-dashed border-black bg-white p-1.5 md:p-2 ${getLabelHeight()}`}
                    >
                      <p className="line-clamp-2 w-full text-center text-[10px] font-bold uppercase leading-tight md:text-xs">
                        {labelConfig.nombrePersonalizado || "Producto sin nombre"}
                      </p>

                      <div className="flex w-full flex-1 items-center justify-center overflow-hidden py-1">
                        {labelConfig.tipoCodigo === "QR" ? (
                          <div className="relative flex aspect-square h-full items-center justify-center border-2 border-black p-1">
                            <div className="h-full w-full bg-[radial-gradient(circle_at_center,_black_2px,_transparent_2px)] bg-[size:4px_4px]" />
                            <div className="absolute left-0 top-0 h-2 w-2 bg-black" />
                            <div className="absolute right-0 top-0 h-2 w-2 bg-black" />
                            <div className="absolute bottom-0 left-0 h-2 w-2 bg-black" />
                          </div>
                        ) : (
                          <div className="flex h-full w-full flex-col items-center justify-center px-1">
                            <div className="flex h-8 w-full items-end justify-center gap-[1px] overflow-hidden bg-white md:h-10 md:gap-[2px]">
                              <div className="h-full w-1.5 shrink-0 bg-black" />
                              <div className="h-full w-0.5 shrink-0 bg-black" />
                              <div className="h-full w-2 shrink-0 bg-black" />
                              <div className="h-full w-1 shrink-0 bg-black" />
                              <div className="h-full w-0.5 shrink-0 bg-black" />
                              <div className="h-[90%] w-2 shrink-0 bg-black" />
                              <div className="h-full w-1 shrink-0 bg-black" />
                              <div className="h-[90%] w-0.5 shrink-0 bg-black" />
                              <div className="h-full w-1.5 shrink-0 bg-black" />
                              <div className="h-[90%] w-1 shrink-0 bg-black" />
                              <div className="h-full w-2 shrink-0 bg-black" />
                              <div className="h-full w-0.5 shrink-0 bg-black" />
                              <div className="h-full w-1 shrink-0 bg-black" />
                              <div className="h-full w-2 shrink-0 bg-black" />
                              <div className="h-full w-1.5 shrink-0 bg-black" />
                            </div>
                            <p className="mt-0.5 text-[8px] font-mono font-bold tracking-widest text-black md:text-[10px]">
                              {(selectedProduct.codigo_interno || `P-${selectedProduct.id}`)}-{index.toString().padStart(3, "0")}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="mt-0.5 flex w-full items-end justify-between border-t border-black/20 pt-1">
                        <span className="rounded-sm bg-black px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
                          {labelConfig.unidad}
                        </span>
                        <span className="text-sm font-black leading-none tracking-tighter md:text-base">
                          ${parseFloat(labelConfig.precio || 0).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
