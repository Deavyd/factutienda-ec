import api from "./axios";
import { mockDb } from "./mockData";
import { isMockEnabled, mockResolve, nextId } from "./useMock";

export const proveedoresApi = {
  getAll: () => (isMockEnabled() ? mockResolve(mockDb.proveedores) : api.get("/proveedores").then((r) => r.data)),
  getById: (id) => (isMockEnabled() ? mockResolve(mockDb.proveedores.find((p) => p.id === Number(id)) || null) : api.get(`/proveedores/${id}`).then((r) => r.data)),
  create: (data) => {
    if (!isMockEnabled()) return api.post("/proveedores", data).then((r) => r.data);
    const item = { id: nextId(mockDb.proveedores), ...data };
    mockDb.proveedores.push(item);
    return mockResolve(item);
  },
  update: (id, data) => {
    if (!isMockEnabled()) return api.put(`/proveedores/${id}`, data).then((r) => r.data);
    const idx = mockDb.proveedores.findIndex((p) => p.id === Number(id));
    if (idx >= 0) mockDb.proveedores[idx] = { ...mockDb.proveedores[idx], ...data };
    return mockResolve(mockDb.proveedores[idx] || null);
  },
  delete: (id) => {
    if (!isMockEnabled()) return api.delete(`/proveedores/${id}`);
    const idx = mockDb.proveedores.findIndex((p) => p.id === Number(id));
    if (idx >= 0) mockDb.proveedores.splice(idx, 1);
    return mockResolve({ ok: true });
  },
};
