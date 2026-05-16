import api from "./axios";
import { mockDb } from "./mockData";
import { isMockEnabled, mockResolve, nextId } from "./useMock";

export const categoriasApi = {
  getAll: () => (isMockEnabled() ? mockResolve(mockDb.categorias) : api.get("/categorias").then((r) => r.data)),
  getById: (id) => (isMockEnabled() ? mockResolve(mockDb.categorias.find((p) => p.id === Number(id)) || null) : api.get(`/categorias/${id}`).then((r) => r.data)),
  create: (data) => {
    if (!isMockEnabled()) return api.post("/categorias", data).then((r) => r.data);
    const item = { id: nextId(mockDb.categorias), ...data };
    mockDb.categorias.push(item);
    return mockResolve(item);
  },
  update: (id, data) => {
    if (!isMockEnabled()) return api.put(`/categorias/${id}`, data).then((r) => r.data);
    const idx = mockDb.categorias.findIndex((p) => p.id === Number(id));
    if (idx >= 0) mockDb.categorias[idx] = { ...mockDb.categorias[idx], ...data };
    return mockResolve(mockDb.categorias[idx] || null);
  },
  delete: (id) => {
    if (!isMockEnabled()) return api.delete(`/categorias/${id}`);
    const idx = mockDb.categorias.findIndex((p) => p.id === Number(id));
    if (idx >= 0) mockDb.categorias.splice(idx, 1);
    return mockResolve({ ok: true });
  },
};
