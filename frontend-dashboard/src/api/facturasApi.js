import api from "./axios";
import { mockDb } from "./mockData";
import { isMockEnabled, mockResolve, nextId } from "./useMock";

export const facturasApi = {
  create: (data) => {
    if (!isMockEnabled()) return api.post("/facturas", data).then((r) => r.data);
    const item = { id: nextId(mockDb.facturas), numero_comprobante: `001-001-${String(nextId(mockDb.facturas)).padStart(9, "0")}`, fecha_emision: new Date().toISOString().slice(0, 10), sri_estado: "PENDIENTE", ...data };
    mockDb.facturas.push(item);
    return mockResolve(item);
  },
  createOffline: (data) => (isMockEnabled() ? facturasApi.create(data) : api.post("/facturas/offline", data).then((r) => r.data)),
  getAll: (params) => (isMockEnabled() ? mockResolve(mockDb.facturas) : api.get("/facturas", { params }).then((r) => r.data)),
  getById: (id) => (isMockEnabled() ? mockResolve(mockDb.facturas.find((f) => f.id === Number(id)) || null) : api.get(`/facturas/${id}`).then((r) => r.data)),
  reenviar: (id) => (isMockEnabled() ? mockResolve({ ok: true, id }) : api.post(`/facturas/${id}/reenviar`).then((r) => r.data)),
};
