import { useEffect, useState } from "react";
import { AlertCircle, Barcode, DollarSign, Image as ImageIcon, Layers, PackagePlus, Percent, Save, UploadCloud, X } from "lucide-react";
import { useToast } from "../../../components/ui";

export default function ProductCreateView({ onCancel, onSubmit, initialData = null }) {
  const { pushToast } = useToast();
  const [costo, setCosto] = useState("");
  const [precio, setPrecio] = useState("");
  const [margen, setMargen] = useState(0);
  const [grabaIva, setGrabaIva] = useState(true);
  const [nombre, setNombre] = useState("");
  const [codigo, setCodigo] = useState("");
  const [codigoBarras, setCodigoBarras] = useState("");
  const [stock, setStock] = useState("");
  const isEditMode = Boolean(initialData?.id);

  useEffect(() => {
    if (!initialData) return;
    setNombre(initialData.nombre || "");
    setCodigo(initialData.codigo_interno || "");
    setCodigoBarras(initialData.codigo_barras || "");
    setCosto(String(initialData.precio_compra || ""));
    setPrecio(String(initialData.precio_venta || initialData.precio_sin_iva || ""));
    setStock(String(initialData.stock_actual || ""));
  }, [initialData]);

  useEffect(() => {
    const c = Number.parseFloat(costo);
    const p = Number.parseFloat(precio);
    if (c > 0 && p > c) {
      const ganancia = p - c;
      setMargen(((ganancia / c) * 100).toFixed(2));
      return;
    }
    setMargen(0);
  }, [costo, precio]);

  const handleSave = () => {
    const data = {
      empresa_id: 1,
      codigo_interno: codigo || `P-${Date.now()}`,
      codigo_barras: codigoBarras || null,
      nombre: nombre || "Producto nuevo",
      precio_sin_iva: String(parseFloat(precio) || 0),
      precio_compra: String(parseFloat(costo) || 0),
      precio_venta: String(parseFloat(precio) || 0),
      stock_actual: String(parseFloat(stock) || 0),
      stock_minimo: "5",
      tarifa_iva_id: grabaIva ? undefined : undefined,
      maneja_inventario: true,
    };
    if (onSubmit) {
      onSubmit(data);
    } else {
      pushToast({ tone: "success", title: "Producto creado", description: "El producto fue agregado al inventario." });
      onCancel();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white"><PackagePlus className="text-blue-600 dark:text-blue-500" /> {isEditMode ? "Editar Producto" : "Nuevo Producto"}</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{isEditMode ? "Actualiza la informacion del producto seleccionado." : "Agrega un nuevo articulo a tu inventario para la venta."}</p>
        </div>
        <div className="flex w-full items-center gap-3 sm:w-auto">
          <button type="button" onClick={onCancel} className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 font-medium text-gray-700 shadow-sm hover:bg-gray-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-gray-300 dark:hover:bg-neutral-700 sm:flex-none">
            <X size={18} /> Cancelar
          </button>
          <button type="button" onClick={handleSave} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 font-medium text-white shadow-sm hover:bg-blue-700 sm:flex-none">
            <Save size={18} /> Guardar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
            <h3 className="mb-5 text-lg font-bold text-gray-900 dark:text-white">Informacion Basica</h3>
            <div className="space-y-4">
              <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre del producto" className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm dark:border-neutral-700 dark:bg-neutral-950 dark:text-white" />
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="relative">
                  <Barcode size={18} className="pointer-events-none absolute left-3 top-3 text-gray-400" />
                  <input value={codigoBarras} onChange={(e) => setCodigoBarras(e.target.value)} placeholder="Codigo de barras / SKU" className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-10 pr-4 text-sm dark:border-neutral-700 dark:bg-neutral-950 dark:text-white" />
                </div>
                <div className="relative">
                  <Layers size={18} className="pointer-events-none absolute left-3 top-3 text-gray-400" />
                  <select className="w-full appearance-none rounded-xl border border-gray-200 bg-gray-50 py-3 pl-10 pr-4 text-sm dark:border-neutral-700 dark:bg-neutral-950 dark:text-white">
                    <option value="">Categoria...</option>
                    <option>Bebidas</option>
                    <option>Snacks</option>
                    <option>Limpieza</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
            <h3 className="mb-5 flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white"><DollarSign size={18} className="text-gray-400" /> Precios e Inventario</h3>
            <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
              <input type="number" value={costo} onChange={(e) => setCosto(e.target.value)} placeholder="Costo" className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm dark:border-neutral-700 dark:bg-neutral-950 dark:text-white" />
              <input type="number" value={precio} onChange={(e) => setPrecio(e.target.value)} placeholder="Precio" className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm dark:border-neutral-700 dark:bg-neutral-950 dark:text-white" />
              <input readOnly value={margen > 0 ? `${margen}%` : "0%"} className="rounded-xl border border-transparent bg-green-50 px-4 py-3 text-sm font-semibold text-green-700 dark:bg-green-900/20 dark:text-green-400" />
            </div>
            <div className="grid grid-cols-1 gap-6 border-t border-gray-100 pt-4 dark:border-neutral-800 md:grid-cols-2">
              <div className="flex gap-4">
                <input type="number" value={stock} onChange={(e) => setStock(e.target.value)} className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm dark:border-neutral-700 dark:bg-neutral-950 dark:text-white" />
                <div className="relative w-full">
                  <AlertCircle size={12} className="absolute right-3 top-3 text-gray-400" />
                  <input type="number" defaultValue="5" className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm dark:border-neutral-700 dark:bg-neutral-950 dark:text-white" />
                </div>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 p-3 dark:border-neutral-800 dark:bg-neutral-800/50">
                <div className="flex items-center gap-3">
                  <div className={`rounded-lg p-2 ${grabaIva ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30" : "bg-gray-200 text-gray-500 dark:bg-neutral-700"}`}><Percent size={16} /></div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Graba IVA (15%)</p>
                </div>
                <input type="checkbox" checked={grabaIva} onChange={() => setGrabaIva(!grabaIva)} className="h-4 w-4" />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white"><ImageIcon size={18} className="text-gray-400" /> Imagen</h3>
            <label className="group block cursor-pointer rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center transition-colors hover:bg-gray-100 dark:border-neutral-700 dark:bg-neutral-950 dark:hover:bg-neutral-900">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-blue-500 transition-transform group-hover:scale-110 dark:bg-blue-900/20"><UploadCloud size={28} /></div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">Sube una imagen</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">PNG, JPG o WEBP</p>
              <input type="file" accept="image/*" className="hidden" />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
