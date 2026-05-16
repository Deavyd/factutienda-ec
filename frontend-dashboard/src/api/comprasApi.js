import api from "./axios";
import { mockDb } from "./mockData";
import { isMockEnabled, mockResolve, nextId } from "./useMock";

export const comprasApi = {
  create: (data) => {
    if (!isMockEnabled()) return api.post("/compras", data).then((r) => r.data);
    const item = { id: nextId(mockDb.compras), numero_documento: `FAC-PRV-${1000 + nextId(mockDb.compras)}`, total: (data.detalles || []).reduce((s, d) => s + (Number(d.cantidad) || 0) * (Number(d.costo_unitario) || 0), 0), estado: "REGISTRADA", ...data };
    mockDb.compras.push(item);
    return mockResolve(item);
  },
  getAll: () => (isMockEnabled() ? mockResolve(mockDb.compras) : api.get("/compras").then((r) => r.data)),
  getById: (id) => (isMockEnabled() ? mockResolve(mockDb.compras.find((c) => c.id === Number(id)) || null) : api.get(`/compras/${id}`).then((r) => r.data)),
  update: (id, data) => {
    if (!isMockEnabled()) return api.put(`/compras/${id}`, data).then((r) => r.data);
    const idx = mockDb.compras.findIndex((c) => c.id === Number(id));
    if (idx >= 0) mockDb.compras[idx] = { ...mockDb.compras[idx], ...data };
    return mockResolve(mockDb.compras[idx] || null);
  },
};
