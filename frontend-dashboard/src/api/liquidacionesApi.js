import api from "./axios";
import { mockDb } from "./mockData";
import { isMockEnabled, mockResolve, nextId } from "./useMock";

export const liquidacionesApi = {
  getAll: () => (isMockEnabled() ? mockResolve(mockDb.liquidaciones) : api.get("/liquidaciones").then((r) => r.data)),
  getById: (id) => (isMockEnabled() ? mockResolve(mockDb.liquidaciones.find((l) => l.id === Number(id)) || null) : api.get(`/liquidaciones/${id}`).then((r) => r.data)),
  create: (data) => {
    if (!isMockEnabled()) return api.post("/liquidaciones", data).then((r) => r.data);
    const item = { id: nextId(mockDb.liquidaciones), estado_sri: "PENDIENTE", ...data };
    mockDb.liquidaciones.push(item);
    return mockResolve(item);
  },
  reenviar: (id) => (isMockEnabled() ? mockResolve({ ok: true, id }) : api.post(`/liquidaciones/${id}/reenviar`).then((r) => r.data)),
};
