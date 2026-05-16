import { useState } from "react";
import {
  Briefcase,
  Building2,
  CheckCircle2,
  Edit2,
  Mail,
  MapPin,
  Phone,
  Plus,
  Search,
  Trash2,
  XCircle,
} from "lucide-react";
import { useProveedores, useCreateProveedor, useUpdateProveedor, useDeleteProveedor } from "../../hooks/useProveedores";
import { PageInfoNote, useToast } from "../../components/ui";

export default function ProveedoresPage() {
  const { pushToast } = useToast();
  const { data: proveedores = [], isLoading, error } = useProveedores();
  const createProveedor = useCreateProveedor();
  const updateProveedor = useUpdateProveedor();
  const deleteProveedor = useDeleteProveedor();
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    ruc: "",
    razonSocial: "",
    nombreComercial: "",
    contacto: "",
    telefono: "",
    email: "",
    direccion: "",
    diasCredito: 0,
    estado: "ACTIVO",
  });

  const filtered = proveedores.filter(
    (p) =>
      (p.razon_social || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.identificacion || "").includes(searchTerm) ||
      (p.nombre_comercial || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenModal = (prov = null) => {
    if (prov) {
      setEditingId(prov.id);
      setFormData({
        ruc: prov.identificacion || "",
        razonSocial: prov.razon_social || "",
        nombreComercial: prov.nombre_comercial || "",
        contacto: prov.contacto || "",
        telefono: prov.telefono || "",
        email: prov.email || "",
        direccion: prov.direccion || "",
        diasCredito: prov.dias_credito || 0,
        estado: prov.estado || "ACTIVO",
      });
    } else {
      setEditingId(null);
      setFormData({
        ruc: "",
        razonSocial: "",
        nombreComercial: "",
        contacto: "",
        telefono: "",
        email: "",
        direccion: "",
        diasCredito: 0,
        estado: "ACTIVO",
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        empresa_id: 1,
        tipo: "proveedor",
        tipo_identificacion: "RUC",
        identificacion: formData.ruc,
        razon_social: formData.razonSocial,
        nombre_comercial: formData.nombreComercial || null,
        telefono: formData.telefono || null,
        email: formData.email || null,
        direccion: formData.direccion || null,
        dias_credito: formData.diasCredito,
      };
      if (editingId) {
        await updateProveedor.mutateAsync({ id: editingId, data: payload });
        pushToast({ tone: "success", title: "Proveedor actualizado" });
      } else {
        await createProveedor.mutateAsync(payload);
        pushToast({ tone: "success", title: "Proveedor creado" });
      }
      setIsModalOpen(false);
    } catch {
      pushToast({ tone: "error", title: "Error al guardar" });
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteProveedor.mutateAsync(id);
      pushToast({ tone: "success", title: "Proveedor eliminado" });
    } catch {
      pushToast({ tone: "error", title: "Error al eliminar" });
    }
  };

  if (isLoading) return <div className="flex h-64 items-center justify-center text-slate-500">Cargando proveedores...</div>;
  if (error) return <div className="flex h-64 items-center justify-center text-red-500">Error al cargar proveedores</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 md:flex-row md:items-center">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-100 dark:bg-blue-900/30">
            <Building2 size={28} className="text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Proveedores</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Directorio de empresas que suministran mercaderia a tu negocio.
            </p>
          </div>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-bold text-white shadow-lg shadow-blue-500/30 transition-all hover:bg-blue-700 md:w-auto"
        >
          <Plus size={20} />
          Nuevo Proveedor
        </button>
      </div>

      <PageInfoNote module="proveedores" />

      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
          <Search size={18} className="text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Buscar por RUC, Razon Social o Nombre Comercial..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full rounded-2xl border border-gray-200 bg-white py-4 pl-11 pr-4 text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-neutral-800 dark:bg-neutral-900 dark:text-white"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {filtered.map((prov) => (
          <div
            key={prov.id}
            className="group rounded-3xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:border-blue-200 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-blue-900/50"
          >
            <div className="mb-4 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 text-xl font-bold text-gray-500 dark:bg-neutral-800 dark:text-gray-400">
                  {(prov.nombre_comercial || prov.razon_social || "P").charAt(0)}
                </div>
                <div>
                  <h3 className="text-lg font-bold leading-tight text-gray-900 dark:text-white">
                    {prov.nombre_comercial || prov.razon_social}
                  </h3>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    RUC: {prov.identificacion}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleOpenModal(prov)}
                  className="rounded-lg bg-gray-50 p-2 text-gray-400 transition-colors hover:text-blue-600 dark:bg-neutral-800"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => handleDelete(prov.id)}
                  className="rounded-lg bg-gray-50 p-2 text-gray-400 transition-colors hover:text-red-600 dark:bg-neutral-800"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            <div className="space-y-3 border-t border-gray-100 pt-4 dark:border-neutral-800">
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                <Briefcase size={16} className="mr-3 shrink-0 text-gray-400" />
                <span className="truncate" title={prov.razon_social}>
                  {prov.razon_social}
                </span>
              </div>
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                <Phone size={16} className="mr-3 shrink-0 text-gray-400" />
                <span>
                  {prov.telefono}{" "}
                  <span className="ml-2 text-xs text-gray-400">({prov.contacto || prov.nombre_vendedor || ""})</span>
                </span>
              </div>
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                <Mail size={16} className="mr-3 shrink-0 text-gray-400" />
                <span className="truncate">{prov.email || "-"}</span>
              </div>
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                <MapPin size={16} className="mr-3 shrink-0 text-gray-400" />
                <span className="truncate">{prov.direccion || "-"}</span>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-4 dark:border-neutral-800">
              <span
                className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1 text-xs font-bold ${
                  prov.estado === "ACTIVO"
                    ? "border-emerald-100 bg-emerald-50 text-emerald-700 dark:border-emerald-800/50 dark:bg-emerald-900/20 dark:text-emerald-400"
                    : "border-red-100 bg-red-50 text-red-700 dark:border-red-800/50 dark:bg-red-900/20 dark:text-red-400"
                }`}
              >
                <CheckCircle2 size={14} /> {prov.estado || "ACTIVO"}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-600 dark:border-blue-900/50 dark:bg-blue-900/20 dark:text-blue-500">
                Crédito: {prov.dias_credito || 0} días
              </span>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4 backdrop-blur-sm dark:bg-black/70">
          <div className="w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-neutral-900">
            <div className="flex items-center justify-between border-b border-gray-100 p-6 dark:border-neutral-800">
              <h3 className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-white">
                <Building2 size={24} className="text-blue-500" />
                {editingId ? "Editar Proveedor" : "Registrar Proveedor"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-neutral-800 dark:hover:text-gray-300"
              >
                <XCircle size={24} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <h4 className="border-b border-gray-100 pb-2 text-sm font-bold text-gray-900 dark:border-neutral-800 dark:text-white">
                    Datos de la Empresa
                  </h4>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-700 dark:text-gray-300">RUC *</label>
                    <input
                      type="text"
                      required
                      value={formData.ruc}
                      onChange={(e) => setFormData({ ...formData, ruc: e.target.value })}
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-neutral-700 dark:bg-neutral-950 dark:text-white"
                      placeholder="13 digitos"
                      maxLength={13}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Razon Social *</label>
                    <input
                      type="text"
                      required
                      value={formData.razonSocial}
                      onChange={(e) => setFormData({ ...formData, razonSocial: e.target.value })}
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-neutral-700 dark:bg-neutral-950 dark:text-white"
                      placeholder="Ej. Empresa S.A."
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Nombre Comercial</label>
                    <input
                      type="text"
                      value={formData.nombreComercial}
                      onChange={(e) => setFormData({ ...formData, nombreComercial: e.target.value })}
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-neutral-700 dark:bg-neutral-950 dark:text-white"
                      placeholder="Como se conoce el negocio?"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="border-b border-gray-100 pb-2 text-sm font-bold text-gray-900 dark:border-neutral-800 dark:text-white">
                    Contacto y Logistica
                  </h4>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Nombre Vendedor</label>
                      <input
                        type="text"
                        value={formData.contacto}
                        onChange={(e) => setFormData({ ...formData, contacto: e.target.value })}
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-neutral-700 dark:bg-neutral-950 dark:text-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Telefono</label>
                      <input
                        type="text"
                        value={formData.telefono}
                        onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-neutral-700 dark:bg-neutral-950 dark:text-white"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Correo Electronico</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-neutral-700 dark:bg-neutral-950 dark:text-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Dias de Credito permitidos</label>
                      <input
                        type="number"
                        min="0"
                        value={formData.diasCredito}
                        onChange={(e) => setFormData({ ...formData, diasCredito: parseInt(e.target.value, 10) || 0 })}
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-neutral-700 dark:bg-neutral-950 dark:text-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Estado</label>
                      <select
                        value={formData.estado}
                        onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-neutral-700 dark:bg-neutral-950 dark:text-white"
                      >
                        <option value="ACTIVO">Activo</option>
                        <option value="INACTIVO">Inactivo</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 space-y-1">
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Direccion completa</label>
                <input
                  type="text"
                  value={formData.direccion}
                  onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-neutral-700 dark:bg-neutral-950 dark:text-white"
                />
              </div>

              <div className="mt-8 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl px-6 py-2.5 font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-neutral-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-6 py-2.5 font-bold text-white shadow-md shadow-blue-500/20 transition-colors hover:bg-blue-700"
                >
                  Guardar Proveedor
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
