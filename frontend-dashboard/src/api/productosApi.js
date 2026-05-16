import api from "./axios";
import { mockDb } from "./mockData";
import { isMockEnabled, mockResolve, nextId } from "./useMock";

export const productosApi = {
  getAll: () => (isMockEnabled() ? mockResolve(mockDb.productos) : api.get("/productos").then((r) => r.data)),
  getById: (id) => (isMockEnabled() ? mockResolve(mockDb.productos.find((p) => p.id === Number(id)) || null) : api.get(`/productos/${id}`).then((r) => r.data)),
  create: (data) => {
    if (!isMockEnabled()) return api.post("/productos", data).then((r) => r.data);
    const item = { id: nextId(mockDb.productos), ...data };
    mockDb.productos.push(item);
    return mockResolve(item);
  },
  update: (id, data) => {
    if (!isMockEnabled()) return api.put(`/productos/${id}`, data).then((r) => r.data);
    const idx = mockDb.productos.findIndex((p) => p.id === Number(id));
    if (idx >= 0) mockDb.productos[idx] = { ...mockDb.productos[idx], ...data };
    return mockResolve(mockDb.productos[idx] || null);
  },
  delete: (id) => {
    if (!isMockEnabled()) return api.delete(`/productos/${id}`);
    const idx = mockDb.productos.findIndex((p) => p.id === Number(id));
    if (idx >= 0) mockDb.productos.splice(idx, 1);
    return mockResolve({ ok: true });
  },
};
