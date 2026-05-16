import api from "./axios";
import { mockDb } from "./mockData";
import { isMockEnabled, mockResolve, nextId } from "./useMock";

export const clientesApi = {
  getAll: () => (isMockEnabled() ? mockResolve(mockDb.clientes) : api.get("/clientes").then((r) => r.data)),
  getById: (id) => (isMockEnabled() ? mockResolve(mockDb.clientes.find((p) => p.id === Number(id)) || null) : api.get(`/clientes/${id}`).then((r) => r.data)),
  create: (data) => {
    if (!isMockEnabled()) return api.post("/clientes", data).then((r) => r.data);
    const item = { id: nextId(mockDb.clientes), ...data };
    mockDb.clientes.push(item);
    return mockResolve(item);
  },
  update: (id, data) => {
    if (!isMockEnabled()) return api.put(`/clientes/${id}`, data).then((r) => r.data);
    const idx = mockDb.clientes.findIndex((p) => p.id === Number(id));
    if (idx >= 0) mockDb.clientes[idx] = { ...mockDb.clientes[idx], ...data };
    return mockResolve(mockDb.clientes[idx] || null);
  },
  delete: (id) => {
    if (!isMockEnabled()) return api.delete(`/clientes/${id}`);
    const idx = mockDb.clientes.findIndex((p) => p.id === Number(id));
    if (idx >= 0) mockDb.clientes.splice(idx, 1);
    return mockResolve({ ok: true });
  },
};
