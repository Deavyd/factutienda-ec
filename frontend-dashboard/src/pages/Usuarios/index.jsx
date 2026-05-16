import { useState } from "react";
import { CheckCircle2, Edit2, Mail, Plus, Search, Shield, Trash2, Users } from "lucide-react";
import { useUsuarios, useCreateUsuario, useUpdateUsuario, useDeleteUsuario } from "../../hooks/useUsuarios";
import { PageInfoNote, useToast } from "../../components/ui";

export default function UsuariosPage() {
  const { pushToast } = useToast();
  const { data: users = [], isLoading, error } = useUsuarios();
  const createUsuario = useCreateUsuario();
  const updateUsuario = useUpdateUsuario();
  const deleteUsuario = useDeleteUsuario();
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ username: "", email: "", nombres: "", apellidos: "", rol: "CAJERO", password: "" });

  const filtered = users.filter((u) => u.username?.toLowerCase().includes(searchTerm.toLowerCase()) || u.email?.toLowerCase().includes(searchTerm.toLowerCase()));

  if (isLoading) return <div className="flex h-64 items-center justify-center text-slate-500">Cargando usuarios...</div>;
  if (error) return <div className="flex h-64 items-center justify-center text-red-500">Error al cargar usuarios</div>;

  const openCreate = () => { setEditingId(null); setFormData({ username: "", email: "", nombres: "", apellidos: "", rol: "CAJERO", password: "" }); setIsModalOpen(true); };
  const openEdit = (u) => { setEditingId(u.id); setFormData({ username: u.username, email: u.email, nombres: u.nombres, apellidos: u.apellidos || "", rol: u.rol, password: "" }); setIsModalOpen(true); };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const payload = { empresa_id: 1, username: formData.username, email: formData.email, nombres: formData.nombres, apellidos: formData.apellidos, rol: formData.rol, password: formData.password || undefined };
      if (editingId) {
        const updatePayload = { ...payload };
        if (!formData.password) delete updatePayload.password;
        await updateUsuario.mutateAsync({ id: editingId, data: updatePayload });
        pushToast({ tone: "success", title: "Usuario actualizado" });
      } else {
        if (!formData.password) { pushToast({ tone: "error", title: "Contrasena requerida" }); return; }
        await createUsuario.mutateAsync(payload);
        pushToast({ tone: "success", title: "Usuario creado" });
      }
      setIsModalOpen(false);
    } catch { pushToast({ tone: "error", title: "Error al guardar" }); }
  };

  const handleDelete = async (id) => {
    try { await deleteUsuario.mutateAsync(id); pushToast({ tone: "success", title: "Usuario desactivado" }); }
    catch { pushToast({ tone: "error", title: "Error al eliminar" }); }
  };

  const roleBadge = (rol) => {
    const map = {
      SUPERADMIN: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
      ADMIN: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      CAJERO: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
      BODEGUERO: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
      CONTADOR: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    };
    return <span className={`inline-flex rounded-lg px-2 py-0.5 text-xs font-semibold ${map[rol] || "bg-slate-100 text-slate-700 dark:bg-neutral-800 dark:text-slate-300"}`}>{rol}</span>;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Usuarios</h2>
        <button onClick={openCreate} className="inline-flex items-center gap-2 rounded-lg bg-brand-700 px-4 py-2 text-white"><Plus size={18} /> Nuevo</button>
      </div>
      <PageInfoNote module="usuarios" />
      <div className="relative max-w-md">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Buscar usuario..." className="w-full rounded-lg border px-10 py-2 dark:bg-neutral-900 dark:border-neutral-700" />
      </div>
      <div className="overflow-hidden rounded-xl border bg-white dark:bg-neutral-900 dark:border-neutral-700">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-neutral-800">
            <tr><th className="px-4 py-3 text-left">Usuario</th><th className="px-4 py-3 text-left">Email</th><th className="px-4 py-3 text-left">Rol</th><th className="px-4 py-3 text-left">Estado</th><th className="px-4 py-3 text-right">Acciones</th></tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr key={u.id} className="border-t dark:border-neutral-800">
                <td className="px-4 py-3 font-medium"><Users size={14} className="mr-2 inline" />{u.username}</td>
                <td className="px-4 py-3">{u.email}</td>
                <td className="px-4 py-3">{roleBadge(u.rol)}</td>
                <td className="px-4 py-3">{u.activo ? <CheckCircle2 size={14} className="text-emerald-500" /> : <span className="text-red-500 text-xs">Inactivo</span>}</td>
                <td className="px-4 py-3 text-right space-x-2">
                   <button onClick={() => openEdit(u)} className="text-blue-600 dark:text-blue-400"><Edit2 size={16} /></button>
                  <button onClick={() => handleDelete(u.id)} className="text-red-500"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {isModalOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <form onSubmit={handleSave} className="w-full max-w-sm rounded-xl bg-white p-6 dark:bg-neutral-900">
            <h3 className="mb-4 text-lg font-semibold">{editingId ? "Editar" : "Nuevo"} Usuario</h3>
            <input placeholder="Username" value={formData.username} onChange={(e) => setFormData((f) => ({ ...f, username: e.target.value }))} className="mb-2 w-full rounded-lg border px-3 py-2 dark:bg-neutral-800 dark:border-neutral-700" required />
            <input type="email" placeholder="Email" value={formData.email} onChange={(e) => setFormData((f) => ({ ...f, email: e.target.value }))} className="mb-2 w-full rounded-lg border px-3 py-2 dark:bg-neutral-800 dark:border-neutral-700" required />
            <input placeholder="Nombres" value={formData.nombres} onChange={(e) => setFormData((f) => ({ ...f, nombres: e.target.value }))} className="mb-2 w-full rounded-lg border px-3 py-2 dark:bg-neutral-800 dark:border-neutral-700" required />
            <input placeholder="Apellidos" value={formData.apellidos} onChange={(e) => setFormData((f) => ({ ...f, apellidos: e.target.value }))} className="mb-2 w-full rounded-lg border px-3 py-2 dark:bg-neutral-800 dark:border-neutral-700" />
            <select value={formData.rol} onChange={(e) => setFormData((f) => ({ ...f, rol: e.target.value }))} className="mb-2 w-full rounded-lg border px-3 py-2 dark:bg-neutral-800 dark:border-neutral-700">
              <option value="CAJERO">CAJERO</option><option value="BODEGUERO">BODEGUERO</option><option value="CONTADOR">CONTADOR</option><option value="ADMIN">ADMIN</option><option value="SUPERADMIN">SUPERADMIN</option>
            </select>
            <input type="password" placeholder={editingId ? "Nueva contrasena (opcional)" : "Contrasena"} value={formData.password} onChange={(e) => setFormData((f) => ({ ...f, password: e.target.value }))} className="mb-4 w-full rounded-lg border px-3 py-2 dark:bg-neutral-800 dark:border-neutral-700" required={!editingId} />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setIsModalOpen(false)} className="rounded-lg border px-4 py-2 dark:border-neutral-700">Cancelar</button>
              <button type="submit" className="rounded-lg bg-brand-700 px-4 py-2 text-white">Guardar</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
