import api from "./axios";
import { mockDb } from "./mockData";
import { isMockEnabled, mockResolve, nextId } from "./useMock";

export const notasCreditoApi = {
  create: (data) => {
    if (!isMockEnabled()) return api.post("/notas-credito", data).then((r) => r.data);
    const item = { id: nextId(mockDb.notasCredito), estado: "EMITIDA", fecha_emision: new Date().toISOString().slice(0, 10), ...data };
    mockDb.notasCredito.push(item);
    return mockResolve(item);
  },
  getAll: () => (isMockEnabled() ? mockResolve(mockDb.notasCredito) : api.get("/notas-credito").then((r) => r.data)),
  getById: (id) => (isMockEnabled() ? mockResolve(mockDb.notasCredito.find((n) => n.id === Number(id)) || null) : api.get(`/notas-credito/${id}`).then((r) => r.data)),
};
