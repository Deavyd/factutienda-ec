import api from "./axios";
import { mockDb } from "./mockData";
import { isMockEnabled, mockResolve, nextId } from "./useMock";

export const guiasApi = {
  getAll: () => (isMockEnabled() ? mockResolve(mockDb.guiasRemision) : api.get("/guias-remision").then((r) => r.data)),
  getById: (id) => (isMockEnabled() ? mockResolve(mockDb.guiasRemision.find((g) => g.id === Number(id)) || null) : api.get(`/guias-remision/${id}`).then((r) => r.data)),
  create: (data) => {
    if (!isMockEnabled()) return api.post("/guias-remision", data).then((r) => r.data);
    const item = { id: nextId(mockDb.guiasRemision), estado_sri: "PENDIENTE", ...data };
    mockDb.guiasRemision.push(item);
    return mockResolve(item);
  },
  reenviar: (id) => (isMockEnabled() ? mockResolve({ ok: true, id }) : api.post(`/guias-remision/${id}/reenviar`).then((r) => r.data)),
};
