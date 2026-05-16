import { useMemo, useState } from "react";
import { Search, Plus, LayoutGrid, List, Edit2, Trash2, Tag, X } from "lucide-react";
import { useCategorias, useCreateCategoria, useDeleteCategoria, useUpdateCategoria } from "../../hooks/useCategorias";
import { PageInfoNote, useToast } from "../../components/ui";

const initialForm = { nombre: "", descripcion: "", activo: true };

export default function CategoriasView() {
  const { pushToast } = useToast();
  const { data: categorias = [], isLoading, error } = useCategorias();
  const createCategoria = useCreateCategoria();
  const updateCategoria = useUpdateCategoria();
  const deleteCategoria = useDeleteCategoria();
  const [viewMode, setViewMode] = useState("list");
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState(null);
  const [formData, setFormData] = useState(initialForm);

  const colorClasses = [
    "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-300",
    "bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-300",
    "bg-cyan-50 text-cyan-600 dark:bg-cyan-900/20 dark:text-cyan-300",
    "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-300",
    "bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-300",
  ];

  const categoriasFiltradas = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return categorias.filter(
      (c) => c.nombre?.toLowerCase().includes(term) || (c.descripcion || "").toLowerCase().includes(term)
    );
  }, [categorias, searchTerm]);

  const openModal = (cat = null) => {
    setEditingCat(cat);
    setFormData(cat ? { nombre: cat.nombre || "", descripcion: cat.descripcion || "", activo: cat.activo ?? true } : initialForm);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCat(null);
    setFormData(initialForm);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Estas seguro de eliminar esta categoria?")) return;
    try {
      await deleteCategoria.mutateAsync(id);
      pushToast({ tone: "success", title: "Categoria eliminada" });
    } catch (err) {
      pushToast({ tone: "error", title: "No se pudo eliminar", description: err?.response?.data?.detail || "Intenta nuevamente" });
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const payload = { nombre: formData.nombre.trim(), descripcion: formData.descripcion.trim() || null, activo: formData.activo };
    try {
      if (editingCat) {
        await updateCategoria.mutateAsync({ id: editingCat.id, data: payload });
        pushToast({ tone: "success", title: "Categoria actualizada" });
      } else {
        await createCategoria.mutateAsync(payload);
        pushToast({ tone: "success", title: "Categoria creada" });
      }
      closeModal();
    } catch (err) {
      pushToast({ tone: "error", title: "No se pudo guardar", description: err?.response?.data?.detail || "Revisa los datos" });
    }
  };

  const getColorClass = (id) => colorClasses[Math.abs(Number(id || 0)) % colorClasses.length];
  const isSaving = createCategoria.isPending || updateCategoria.isPending;

  if (isLoading) return <div className="flex h-64 items-center justify-center text-slate-500">Cargando categorias...</div>;
  if (error) return <div className="flex h-64 items-center justify-center text-red-500">Error al cargar categorias</div>;

  return (
    <div className="font-sans">
      <div className="mx-auto mb-8 max-w-6xl">
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-gray-800 dark:text-white">Categorias</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Gestiona las familias de productos de tu inventario</p>
          </div>
          <button
            onClick={() => openModal()}
            className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 font-bold text-white shadow-[0_4px_14px_0_rgba(37,99,235,0.39)] transition-all hover:bg-blue-700"
          >
            <Plus size={18} strokeWidth={2.5} /> Nueva Categoria
          </button>
        </div>

        <PageInfoNote module="categorias" className="mb-6" />

        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="flex flex-1 items-center rounded-xl border border-gray-200 bg-white p-3 shadow-sm transition-all focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 dark:border-neutral-700 dark:bg-neutral-900">
            <Search className="mr-3 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar categoria por nombre o descripcion..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-transparent text-sm text-gray-700 outline-none dark:text-gray-200"
            />
          </div>

          <div className="flex shrink-0 rounded-xl border border-gray-200 bg-white p-1.5 shadow-sm dark:border-neutral-700 dark:bg-neutral-900">
            <button
              onClick={() => setViewMode("grid")}
              className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
                viewMode === "grid"
                  ? "bg-slate-100 text-slate-800 shadow-sm dark:bg-neutral-800 dark:text-white"
                  : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              }`}
            >
              <LayoutGrid size={16} /> <span className="hidden sm:inline">Mosaico</span>
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
                viewMode === "list"
                  ? "bg-slate-100 text-slate-800 shadow-sm dark:bg-neutral-800 dark:text-white"
                  : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              }`}
            >
              <List size={16} /> <span className="hidden sm:inline">Lista</span>
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl">
        {categoriasFiltradas.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white p-12 text-gray-400 dark:border-neutral-700 dark:bg-neutral-900">
            <Tag size={48} className="mb-4 opacity-20" />
            <p className="text-lg font-medium text-gray-600 dark:text-gray-200">No se encontraron categorias</p>
            <p className="text-sm">Intenta con otro termino de busqueda o crea una nueva.</p>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {categoriasFiltradas.map((cat) => (
              <div
                key={cat.id}
                className="group relative overflow-hidden rounded-[1.5rem] border border-gray-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md dark:border-neutral-700 dark:bg-neutral-900"
              >
                <div className={`absolute top-0 left-0 h-1.5 w-full opacity-70 ${getColorClass(cat.id).split(" ")[0]}`} />
                <div className="mb-4 flex items-start justify-between">
                  <div className={`flex h-14 w-14 items-center justify-center rounded-2xl text-2xl shadow-sm ${getColorClass(cat.id)}`}>
                    <Tag size={24} />
                  </div>
                  <div className="flex gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                    <button onClick={() => openModal(cat)} className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-blue-50 hover:text-blue-600 dark:hover:text-blue-400">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleDelete(cat.id)} className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:text-red-400">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <h3 className="mb-1 text-lg font-bold text-gray-800 dark:text-white">{cat.nombre}</h3>
                <p className="line-clamp-2 text-sm leading-relaxed text-gray-500 dark:text-gray-300">{cat.descripcion || "Sin descripcion"}</p>
                {cat.activo === false ? <span className="mt-3 inline-flex rounded-full bg-gray-100 px-2 py-1 text-xs font-bold text-gray-500 dark:bg-neutral-800 dark:text-gray-300">Inactiva</span> : null}
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-neutral-700 dark:bg-neutral-900">
            <div className="grid grid-cols-12 gap-4 border-b border-gray-100 bg-gray-50/50 p-4 text-xs font-bold uppercase tracking-wider text-gray-500 dark:border-neutral-700 dark:bg-neutral-800/50">
              <div className="col-span-12 pl-2 sm:col-span-4">Categoria</div>
              <div className="col-span-12 hidden sm:col-span-5 sm:block">Descripcion</div>
              <div className="col-span-12 hidden sm:col-span-1 sm:block">Estado</div>
              <div className="col-span-12 pr-2 text-right sm:col-span-2">Acciones</div>
            </div>

            <div className="divide-y divide-gray-100 dark:divide-neutral-700">
              {categoriasFiltradas.map((cat) => (
                <div key={cat.id} className="group grid grid-cols-12 items-center gap-4 p-4 transition-colors hover:bg-gray-50/50 dark:hover:bg-neutral-800/50">
                  <div className="col-span-8 flex items-center gap-3 sm:col-span-4">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${getColorClass(cat.id)}`}><Tag size={18} /></div>
                    <span className="font-bold text-gray-800 dark:text-white">{cat.nombre}</span>
                  </div>
                  <div className="col-span-12 hidden truncate text-sm text-gray-500 dark:text-gray-300 sm:col-span-5 sm:block">{cat.descripcion || "-"}</div>
                  <div className="col-span-12 hidden sm:col-span-1 sm:block">
                    <span className={`rounded-full px-2 py-1 text-xs font-bold ${cat.activo === false ? "bg-gray-100 text-gray-500 dark:bg-neutral-800 dark:text-gray-300" : "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300"}`}>
                      {cat.activo === false ? "Inactiva" : "Activa"}
                    </span>
                  </div>
                  <div className="col-span-4 flex justify-end gap-1 sm:col-span-2">
                    <button title="Editar" onClick={() => openModal(cat)} className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-blue-50 hover:text-blue-600 dark:hover:text-blue-400">
                      <Edit2 size={18} />
                    </button>
                    <button title="Eliminar" onClick={() => handleDelete(cat.id)} className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:text-red-400">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-neutral-900">
            <div className="flex items-center justify-between border-b border-gray-100 bg-slate-50/50 p-6 dark:border-neutral-700 dark:bg-neutral-800/50">
              <h3 className="flex items-center gap-2 text-xl font-black text-gray-800 dark:text-white">
                {editingCat ? <Edit2 className="text-blue-500" size={24} /> : <Plus className="text-blue-500" size={24} />}
                {editingCat ? "Editar Categoria" : "Nueva Categoria"}
              </h3>
              <button onClick={closeModal} className="rounded-xl border border-gray-200 bg-white p-2 text-gray-400 shadow-sm transition-colors hover:text-gray-800 dark:border-neutral-700 dark:bg-neutral-900 dark:hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-5 p-6">
              <div>
                <label className="mb-1.5 block text-sm font-bold text-gray-700 dark:text-gray-200">Nombre de la Categoria</label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData((prev) => ({ ...prev, nombre: e.target.value }))}
                  placeholder="Ej. Lacteos, Ferreteria, Bebidas..."
                  className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-2.5 font-medium text-gray-800 transition-all focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100 dark:border-neutral-700 dark:bg-neutral-950 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-bold text-gray-700 dark:text-gray-200">
                  Descripcion <span className="font-normal text-gray-400">(Opcional)</span>
                </label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData((prev) => ({ ...prev, descripcion: e.target.value }))}
                  placeholder="Pequena descripcion de los productos..."
                  rows="3"
                  className="w-full resize-none rounded-xl border-2 border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-600 transition-all focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100 dark:border-neutral-700 dark:bg-neutral-950 dark:text-gray-200"
                />
              </div>

              <label className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-bold text-gray-700 dark:border-neutral-700 dark:bg-neutral-950 dark:text-gray-200">
                <input
                  type="checkbox"
                  checked={formData.activo}
                  onChange={(e) => setFormData((prev) => ({ ...prev, activo: e.target.checked }))}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                Categoria activa
              </label>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={closeModal} className="flex-1 rounded-xl bg-gray-100 py-3 font-bold text-gray-600 transition-colors hover:bg-gray-200 dark:bg-neutral-800 dark:text-gray-200 dark:hover:bg-neutral-700">
                  Cancelar
                </button>
                <button disabled={isSaving} type="submit" className="flex-1 rounded-xl bg-blue-600 py-3 font-bold text-white shadow-[0_4px_14px_0_rgba(37,99,235,0.39)] transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">
                  {isSaving ? "Guardando..." : editingCat ? "Guardar Cambios" : "Crear Categoria"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
