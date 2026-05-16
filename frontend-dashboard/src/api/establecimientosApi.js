import api from "./axios";
import { mockDb } from "./mockData";
import { isMockEnabled, mockResolve, nextId } from "./useMock";

export const establecimientosApi = {
  getAll: () => (isMockEnabled() ? mockResolve(mockDb.establecimientos) : api.get("/establecimientos").then((r) => r.data)),
  create: (data) => {
    if (!isMockEnabled()) return api.post("/establecimientos", data).then((r) => r.data);
    const item = { id: nextId(mockDb.establecimientos), ...data };
    mockDb.establecimientos.push(item);
    return mockResolve(item);
  },
  update: (id, data) => {
    if (!isMockEnabled()) return api.put(`/establecimientos/${id}`, data).then((r) => r.data);
    const idx = mockDb.establecimientos.findIndex((e) => e.id === Number(id));
    if (idx >= 0) mockDb.establecimientos[idx] = { ...mockDb.establecimientos[idx], ...data };
    return mockResolve(mockDb.establecimientos[idx] || null);
  },
  delete: (id) => {
    if (!isMockEnabled()) return api.delete(`/establecimientos/${id}`);
    const idx = mockDb.establecimientos.findIndex((e) => e.id === Number(id));
    if (idx >= 0) mockDb.establecimientos.splice(idx, 1);
    return mockResolve({ ok: true });
  },
  getPuntosEmision: (estId) => (isMockEnabled() ? mockResolve(mockDb.puntosEmision.filter((p) => p.establecimiento_id === Number(estId))) : api.get(`/establecimientos/${estId}/puntos-emision`).then((r) => r.data)),
  createPuntoEmision: (data) => {
    if (!isMockEnabled()) return api.post("/establecimientos/puntos-emision", data).then((r) => r.data);
    const item = { id: nextId(mockDb.puntosEmision), ...data };
    mockDb.puntosEmision.push(item);
    return mockResolve(item);
  },
};
