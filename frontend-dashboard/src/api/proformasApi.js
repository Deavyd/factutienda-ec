import api from "./axios";
import { mockDb } from "./mockData";
import { isMockEnabled, mockResolve, nextId } from "./useMock";

export const proformasApi = {
  create: (data) => {
    if (!isMockEnabled()) return api.post("/proformas", data).then((r) => r.data);
    const item = { id: nextId(mockDb.proformas), numero: `PRO-${String(nextId(mockDb.proformas)).padStart(4, "0")}`, estado: "PENDIENTE", ...data };
    mockDb.proformas.push(item);
    return mockResolve(item);
  },
  getAll: () => (isMockEnabled() ? mockResolve(mockDb.proformas) : api.get("/proformas").then((r) => r.data)),
  getById: (id) => (isMockEnabled() ? mockResolve(mockDb.proformas.find((p) => p.id === Number(id)) || null) : api.get(`/proformas/${id}`).then((r) => r.data)),
  cambiarEstado: (id, estado) => {
    if (!isMockEnabled()) return api.put(`/proformas/${id}/estado?estado=${estado}`).then((r) => r.data);
    const idx = mockDb.proformas.findIndex((p) => p.id === Number(id));
    if (idx >= 0) mockDb.proformas[idx] = { ...mockDb.proformas[idx], estado };
    return mockResolve(mockDb.proformas[idx] || null);
  },
  convertirAFactura: (id) => (isMockEnabled() ? mockResolve({ ok: true, factura_id: id }) : api.post(`/proformas/${id}/convertir`).then((r) => r.data)),
};
