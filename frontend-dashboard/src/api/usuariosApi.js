import api from "./axios";
import { mockDb } from "./mockData";
import { isMockEnabled, mockResolve, nextId } from "./useMock";

export const usuariosApi = {
  getAll: () => (isMockEnabled() ? mockResolve(mockDb.usuarios) : api.get("/usuarios").then((r) => r.data)),
  getById: (id) => (isMockEnabled() ? mockResolve(mockDb.usuarios.find((p) => p.id === Number(id)) || null) : api.get(`/usuarios/${id}`).then((r) => r.data)),
  create: (data) => {
    if (!isMockEnabled()) return api.post("/usuarios", data).then((r) => r.data);
    const item = { id: nextId(mockDb.usuarios), ...data };
    mockDb.usuarios.push(item);
    return mockResolve(item);
  },
  update: (id, data) => {
    if (!isMockEnabled()) return api.put(`/usuarios/${id}`, data).then((r) => r.data);
    const idx = mockDb.usuarios.findIndex((p) => p.id === Number(id));
    if (idx >= 0) mockDb.usuarios[idx] = { ...mockDb.usuarios[idx], ...data };
    return mockResolve(mockDb.usuarios[idx] || null);
  },
  delete: (id) => {
    if (!isMockEnabled()) return api.delete(`/usuarios/${id}`);
    const idx = mockDb.usuarios.findIndex((p) => p.id === Number(id));
    if (idx >= 0) mockDb.usuarios.splice(idx, 1);
    return mockResolve({ ok: true });
  },
};
