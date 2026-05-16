import { useMemo, useState } from "react";
import { Building2, CheckCircle2, Edit2, Mail, MapPin, Phone, Plus, Save, Search, ShieldAlert, Trash2, User, Users, X, FileText } from "lucide-react";
import { PageInfoNote, useToast } from "../../components/ui";
import { useClientes, useCreateCliente, useUpdateCliente, useDeleteCliente } from "../../hooks/useClientes";

export default function ClientesPage() {
  const { pushToast } = useToast();
  const { data: customers = [], isLoading, error } = useClientes();
  const createCliente = useCreateCliente();
  const updateCliente = useUpdateCliente();
  const deleteCliente = useDeleteCliente();

  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [formData, setFormData] = useState({ tipo: "CEDULA", identificacion: "", razon_social: "", email: "", telefono: "", direccion: "" });

  const filteredCustomers = useMemo(
    () =>
      customers.filter(
        (c) =>
          c.razon_social?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.identificacion?.includes(searchQuery) ||
          c.email?.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [customers, searchQuery]
  );

  if (isLoading) return <div className="flex h-64 items-center justify-center text-slate-500">Cargando clientes...</div>;
  if (error) return <div className="flex h-64 items-center justify-center text-red-500">Error al cargar clientes</div>;

  const getTypeBadge = (tipo) => {
    if (tipo === "RUC") return <span className="inline-flex items-center gap-1 rounded-md bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"><Building2 size={12} /> RUC</span>;
    if (tipo === "CEDULA") return <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"><User size={12} /> Cedula</span>;
    if (tipo === "PASAPORTE") return <span className="inline-flex items-center gap-1 rounded-md bg-purple-100 px-2 py-1 text-xs font-semibold text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"><FileText size={12} /> Pasaporte</span>;
    return null;
  };

  const idTypeToApi = { "CEDULA": "CEDULA", "RUC": "RUC", "PASAPORTE": "PASAPORTE" };

  const handleOpenModal = (customer = null) => {
    if (customer) {
      setEditingCustomer(customer);
      setFormData({
        tipo: customer.tipo_identificacion || "CEDULA",
        identificacion: customer.identificacion || "",
        razon_social: customer.razon_social || "",
        email: customer.email || "",
        telefono: customer.telefono || "",
        direccion: customer.direccion || "",
      });
    } else {
      setEditingCustomer(null);
      setFormData({ tipo: "CEDULA", identificacion: "", razon_social: "", email: "", telefono: "", direccion: "" });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        empresa_id: 1,
        tipo: "cliente",
        tipo_identificacion: formData.tipo,
        identificacion: formData.identificacion,
        razon_social: formData.razon_social,
        email: formData.email || null,
        telefono: formData.telefono || null,
        direccion: formData.direccion || null,
      };
      if (editingCustomer) {
        await updateCliente.mutateAsync({ id: editingCustomer.id, data: payload });
        pushToast({ tone: "success", title: "Cliente actualizado" });
      } else {
        await createCliente.mutateAsync(payload);
        pushToast({ tone: "success", title: "Cliente creado" });
      }
      setIsModalOpen(false);
    } catch {
      pushToast({ tone: "error", title: "Error al guardar cliente" });
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteCliente.mutateAsync(id);
      pushToast({ tone: "success", title: "Cliente eliminado" });
    } catch {
      pushToast({ tone: "error", title: "Error al eliminar" });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-bold">Clientes</h2>
        <button onClick={() => handleOpenModal()} className="inline-flex items-center gap-2 rounded-lg bg-brand-700 px-4 py-2 text-white transition hover:bg-brand-900">
          <Plus size={18} /> Nuevo Cliente
        </button>
      </div>

      <PageInfoNote module="clientes" />

      <div className="relative">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Buscar cliente..." className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm dark:border-neutral-700 dark:bg-neutral-900 dark:text-white" />
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-neutral-700 dark:bg-neutral-900">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-neutral-800">
            <tr>
              <th className="px-4 py-3 text-left">Tipo</th>
              <th className="px-4 py-3 text-left">Identificacion</th>
              <th className="px-4 py-3 text-left">Nombre</th>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-left">Telefono</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.map((c) => (
              <tr key={c.id} className="border-t border-slate-100 dark:border-neutral-800">
                <td className="px-4 py-3">{getTypeBadge(c.tipo_identificacion)}</td>
                <td className="px-4 py-3 font-mono">{c.identificacion}</td>
                <td className="px-4 py-3">{c.razon_social}</td>
                <td className="px-4 py-3">{c.email || "-"}</td>
                <td className="px-4 py-3">{c.telefono || "-"}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => handleOpenModal(c)} className="mr-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"><Edit2 size={16} /></button>
                  <button onClick={() => handleDelete(c.id)} className="text-red-500 hover:text-red-700"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <form onSubmit={handleSave} className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg dark:bg-neutral-900">
            <h3 className="mb-4 text-lg font-semibold">{editingCustomer ? "Editar" : "Nuevo"} Cliente</h3>
            <select value={formData.tipo} onChange={(e) => setFormData((f) => ({ ...f, tipo: e.target.value }))} className="mb-2 w-full rounded-lg border px-3 py-2 dark:bg-neutral-800 dark:border-neutral-700">
              <option value="CEDULA">Cedula</option>
              <option value="RUC">RUC</option>
              <option value="PASAPORTE">Pasaporte</option>
            </select>
            <input placeholder="Identificacion" value={formData.identificacion} onChange={(e) => setFormData((f) => ({ ...f, identificacion: e.target.value }))} className="mb-2 w-full rounded-lg border px-3 py-2 dark:bg-neutral-800 dark:border-neutral-700" required />
            <input placeholder="Razon Social" value={formData.razon_social} onChange={(e) => setFormData((f) => ({ ...f, razon_social: e.target.value }))} className="mb-2 w-full rounded-lg border px-3 py-2 dark:bg-neutral-800 dark:border-neutral-700" required />
            <input type="email" placeholder="Email" value={formData.email} onChange={(e) => setFormData((f) => ({ ...f, email: e.target.value }))} className="mb-2 w-full rounded-lg border px-3 py-2 dark:bg-neutral-800 dark:border-neutral-700" />
            <input placeholder="Telefono" value={formData.telefono} onChange={(e) => setFormData((f) => ({ ...f, telefono: e.target.value }))} className="mb-2 w-full rounded-lg border px-3 py-2 dark:bg-neutral-800 dark:border-neutral-700" />
            <input placeholder="Direccion" value={formData.direccion} onChange={(e) => setFormData((f) => ({ ...f, direccion: e.target.value }))} className="mb-4 w-full rounded-lg border px-3 py-2 dark:bg-neutral-800 dark:border-neutral-700" />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setIsModalOpen(false)} className="rounded-lg border px-4 py-2 dark:border-neutral-700"><X size={16} /></button>
              <button type="submit" className="inline-flex items-center gap-2 rounded-lg bg-brand-700 px-4 py-2 text-white"><Save size={16} /> Guardar</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
