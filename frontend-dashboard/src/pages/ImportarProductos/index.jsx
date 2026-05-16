import { useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Box,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  RefreshCw,
  Server,
  UploadCloud,
  XCircle,
} from "lucide-react";
import { PageInfoNote, useToast } from "../../components/ui";
import { useDescargarPlantillaProductos, useImportarProductosExcel, usePreviewImportacionProductos } from "../../hooks/useImportarProductos";

export default function ImportarProductosPage() {
  const { pushToast } = useToast();
  const descargarPlantilla = useDescargarPlantillaProductos();
  const previewImportacion = usePreviewImportacionProductos();
  const importarExcel = useImportarProductosExcel();
  const [step, setStep] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewData, setPreviewData] = useState([]);
  const [errores, setErrores] = useState([]);
  const [mensaje, setMensaje] = useState("");
  const [resultado, setResultado] = useState(null);
  const [archivoBase64, setArchivoBase64] = useState("");
  const fileInputRef = useRef(null);

  const handleDownloadTemplate = async () => {
    try {
      const { data, filename } = await descargarPlantilla.mutateAsync();
      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      pushToast({ tone: "success", title: "Plantilla descargada" });
    } catch { pushToast({ tone: "error", title: "No se pudo descargar plantilla" }); }
  };

  const procesarArchivo = async (file) => {
    if (!file) return;
    setIsProcessing(true);
    try {
      const base64 = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(",")[1]);
        reader.readAsDataURL(file);
      });
      setArchivoBase64(base64);
      const data = await previewImportacion.mutateAsync({ archivo_base64: base64, mapeo_columnas: {} });
      const rows = (data.preview || []).map((p, i) => ({
        id: i + 1,
        sku: p.codigo_principal,
        nombre: p.nombre,
        categoria: p.categoria || "-",
        costo: Number(p.precio_sin_iva || 0),
        precio: Number(p.precio_con_iva || 0),
        stock: Number(p.stock_inicial || 0),
        iva: `${p.tarifa_iva}%`,
        status: "VALIDO",
        msg: "",
      }));
      setPreviewData(rows);
      setErrores(data.errores || []);
      setMensaje(data.mensaje || "");
      setIsProcessing(false);
      setStep(2);
    } catch {
      setIsProcessing(false);
      pushToast({ tone: "error", title: "Error al procesar archivo" });
    }
  };

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    procesarArchivo(file);
  };
  const handleFileInput = (e) => {
    const file = e.target.files?.[0];
    procesarArchivo(file);
  };

  const handleImportarDatos = async () => {
    if (!archivoBase64) return;
    setIsProcessing(true);
    try {
      const data = await importarExcel.mutateAsync({ archivo_base64: archivoBase64, mapeo_columnas: {} });
      setResultado({ ...data, validos: previewData.length });
      setIsProcessing(false);
      setStep(3);
      pushToast({ tone: "success", title: `Importados: ${data.importados}, Duplicados: ${data.duplicados}` });
    } catch {
      setIsProcessing(false);
      pushToast({ tone: "error", title: "Error al importar" });
    }
  };

  const resetearImportador = () => { setPreviewData([]); setErrores([]); setMensaje(""); setArchivoBase64(""); setResultado(null); setStep(1); };

  const stats = {
    total: previewData.length,
    validos: previewData.filter((d) => d.status === "VALIDO" || d.status === "WARNING").length,
    errores: errores.length,
    warnings: 0,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-gray-800 dark:text-white">Importacion de Productos</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Carga masiva de inventario mediante Excel o CSV</p>
      </div>

      <PageInfoNote module="importarProductos" />

      <div className="relative rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-neutral-700 dark:bg-neutral-900">
        <div className="relative flex items-center justify-between">
          <div className="absolute left-0 top-1/2 z-0 h-1 w-full -translate-y-1/2 rounded-full bg-gray-100 dark:bg-neutral-700" />
          <div className="absolute left-0 top-1/2 z-0 h-1 -translate-y-1/2 rounded-full bg-blue-500 transition-all duration-500" style={{ width: step === 1 ? "0%" : step === 2 ? "50%" : "100%" }} />
          {[
            { num: 1, label: "Subir Archivo", active: step >= 1, done: step > 1 },
            { num: 2, label: "Revisar Datos", active: step >= 2, done: step > 2 },
            { num: 3, label: "Completado", active: step === 3, done: false },
          ].map((s) => (
            <div key={s.num} className="relative z-10 flex flex-col items-center gap-2 bg-white px-2 dark:bg-neutral-900">
              <div className={`flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-bold transition-colors ${s.done || s.active ? "border-blue-600 bg-blue-600 text-white" : "border-gray-200 text-gray-400 dark:border-neutral-700"}`}>{s.num}</div>
              <span className={`text-xs font-bold ${s.active ? "text-gray-800 dark:text-white" : "text-gray-400"}`}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {step === 1 ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="flex flex-col justify-center rounded-3xl border border-gray-200 bg-white p-8 shadow-sm dark:border-neutral-700 dark:bg-neutral-900">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"><FileSpreadsheet size={32} /></div>
            <h2 className="mb-2 text-xl font-bold text-gray-800 dark:text-white">Paso 1: Descarga la plantilla</h2>
            <p className="mb-8 text-sm leading-relaxed text-gray-500 dark:text-gray-400">Para asegurar que la informacion se importe correctamente, te recomendamos utilizar nuestra plantilla oficial de Excel.</p>
            <button onClick={handleDownloadTemplate} className="flex items-center justify-center gap-2 rounded-xl border-2 border-emerald-500 bg-white px-6 py-3 font-bold text-emerald-600 shadow-sm transition-all hover:bg-emerald-50 dark:bg-transparent dark:hover:bg-emerald-900/20"><Download size={18} /> Descargar Plantilla .XLSX</button>
          </div>
          <div
            onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
            onClick={() => fileInputRef.current.click()}
            className={`flex min-h-[300px] cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed bg-white p-8 text-center transition-all dark:bg-neutral-900 ${
              isDragging ? "scale-[1.02] border-blue-500 bg-blue-50 dark:bg-blue-900/20" : "border-gray-300 hover:border-blue-400 hover:bg-slate-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
            }`}
          >
            <input type="file" ref={fileInputRef} className="hidden" accept=".csv,.xlsx,.xls" onChange={handleFileInput} />
            {isProcessing ? (
              <div className="flex flex-col items-center">
                <div className="mb-4 h-16 w-16 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
                <h3 className="text-lg font-bold text-gray-800 dark:text-white">Procesando archivo...</h3>
                <p className="text-sm text-gray-500">Analizando filas y validando informacion</p>
              </div>
            ) : (
              <>
                <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-blue-50 text-blue-500 dark:bg-blue-900/30 dark:text-blue-400"><UploadCloud size={40} /></div>
                <h2 className="mb-2 text-xl font-bold text-gray-800 dark:text-white">Paso 2: Sube tu archivo</h2>
                <p className="mb-6 max-w-[250px] text-sm text-gray-500">Arrastra y suelta tu archivo Excel o CSV aqui, o haz clic para explorar.</p>
                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-400 dark:bg-neutral-800">Soporta: .XLSX, .CSV (Max 5MB)</span>
              </>
            )}
          </div>
        </div>
      ) : step === 2 ? (
        <div className="space-y-6">
          <div className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-neutral-700 dark:bg-neutral-900 md:flex-row md:items-center">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-bold text-gray-800 dark:text-white"><Server size={20} className="text-blue-500" /> Resultados del Analisis</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Revisa que los datos esten correctos antes de insertarlos a la base de datos.</p>
            </div>
            <div className="flex gap-4">
              <div className="text-center"><p className="mb-1 text-xs font-bold uppercase tracking-wider text-gray-400">Filas Validas</p><p className="text-2xl font-black text-emerald-500">{stats.validos}</p></div>
              <div className="h-10 w-px bg-gray-200 dark:bg-neutral-700" />
              <div className="text-center"><p className="mb-1 text-xs font-bold uppercase tracking-wider text-gray-400">Errores</p><p className="text-2xl font-black text-red-500">{stats.errores}</p></div>
            </div>
          </div>

          {mensaje ? (
            <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-800 shadow-sm dark:border-amber-900/50 dark:bg-amber-900/10">
              <AlertTriangle size={20} className="mt-0.5 shrink-0 text-amber-500" />
              <div className="text-sm leading-relaxed">{mensaje}</div>
            </div>
          ) : null}

          {stats.errores > 0 ? (
            <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800 shadow-sm dark:border-red-900/50 dark:bg-red-900/10">
              <AlertTriangle size={20} className="mt-0.5 shrink-0 text-red-500" />
              <div className="text-sm leading-relaxed"><span className="font-bold">Se detectaron errores en {stats.errores} fila(s).</span> Las filas con errores no seran importadas. Corrige tu Excel y vuelve a subirlo.</div>
            </div>
          ) : null}

          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-neutral-700 dark:bg-neutral-900">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-gray-200 bg-gray-50 text-xs font-bold uppercase tracking-wider text-gray-500 dark:border-neutral-700 dark:bg-neutral-800/50 dark:text-gray-400">
                  <tr><th className="px-4 py-3">Estado</th><th className="px-4 py-3">SKU</th><th className="px-4 py-3">Nombre</th><th className="px-4 py-3">Categoria</th><th className="px-4 py-3 text-right">Costo</th><th className="px-4 py-3 text-right">Precio</th><th className="px-4 py-3 text-center">Stock</th></tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-neutral-800">
                  {previewData.map((row, index) => (
                    <tr key={index} className="transition-colors hover:bg-gray-50 dark:hover:bg-neutral-800/50">
                      <td className="px-4 py-3">
                        <span className="flex w-max items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400"><CheckCircle2 size={14} /> Listo</span>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-600 dark:text-gray-300">{row.sku}</td>
                      <td className="px-4 py-3 font-medium text-gray-800 dark:text-white">{row.nombre}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{row.categoria}</td>
                      <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-300">${row.costo.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right font-medium text-gray-800 dark:text-white">${row.precio.toFixed(2)}</td>
                      <td className="px-4 py-3 text-center text-gray-600 dark:text-gray-300">{row.stock}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-neutral-700 dark:bg-neutral-900">
            <button onClick={resetearImportador} disabled={isProcessing} className="flex items-center gap-2 rounded-xl px-4 py-2 font-bold text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-800 dark:hover:bg-neutral-800 dark:hover:text-white"><RefreshCw size={18} /> Subir otro archivo</button>
            <button onClick={handleImportarDatos} disabled={stats.validos === 0 || isProcessing} className={`flex items-center gap-2 rounded-xl px-6 py-3 font-bold shadow-md transition-all ${stats.validos > 0 && !isProcessing ? "bg-blue-600 text-white shadow-blue-500/30 hover:bg-blue-700" : "cursor-not-allowed bg-gray-200 text-gray-400 shadow-none dark:bg-neutral-800"}`}>
              {isProcessing ? <><div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> Importando...</> : <>Importar {stats.validos} Productos <ArrowRight size={18} /></>}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center px-4 py-12">
          <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-emerald-100 shadow-xl shadow-emerald-100 dark:bg-emerald-900/30"><CheckCircle2 size={48} className="text-emerald-500 dark:text-emerald-400" /></div>
          <h1 className="mb-2 text-3xl font-black text-gray-800 dark:text-white">Importacion Exitosa!</h1>
          <p className="mb-8 max-w-md text-center text-gray-500">Se han agregado <strong className="text-gray-800 dark:text-white">{resultado?.importados || 0} productos</strong> correctamente a tu catalogo de inventario.</p>
          <div className="mb-8 flex w-full max-w-md items-center justify-between rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-neutral-700 dark:bg-neutral-900">
            <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"><Box size={20} /></div><div><p className="text-sm font-bold text-gray-800 dark:text-white">Catalogo Actualizado</p><p className="text-xs text-gray-500">Los productos ya estan en el POS</p></div></div>
          </div>
          <div className="flex gap-4">
            <button onClick={resetearImportador} className="rounded-xl border-2 border-gray-200 bg-white px-6 py-3 font-bold text-gray-700 transition-all hover:border-gray-300 hover:bg-gray-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-gray-200">Importar mas</button>
            <button onClick={() => window.location.href = "/productos"} className="rounded-xl bg-slate-900 px-6 py-3 font-bold text-white shadow-lg transition-all hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-gray-200">Ir al Catalogo</button>
          </div>
        </div>
      )}
    </div>
  );
}
