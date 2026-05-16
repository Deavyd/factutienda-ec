import api from "./axios";
import { mockDb } from "./mockData";
import { isMockEnabled, mockResolve, nextId } from "./useMock";

export const retencionesApi = {
  getAll: (params) => (isMockEnabled() ? mockResolve(mockDb.retenciones) : api.get("/retenciones", { params }).then((r) => r.data)),
  getById: (id) => (isMockEnabled() ? mockResolve(mockDb.retenciones.find((r) => r.id === Number(id)) || null) : api.get(`/retenciones/${id}`).then((r) => r.data)),
  create: (data) => {
    if (!isMockEnabled()) return api.post("/retenciones", data).then((r) => r.data);
    const item = { id: nextId(mockDb.retenciones), estado: "REGISTRADA", ...data };
    mockDb.retenciones.push(item);
    return mockResolve(item);
  },
  anular: (id) => {
    if (!isMockEnabled()) return api.put(`/retenciones/${id}/anular`).then((r) => r.data);
    const idx = mockDb.retenciones.findIndex((r) => r.id === Number(id));
    if (idx >= 0) mockDb.retenciones[idx] = { ...mockDb.retenciones[idx], estado: "ANULADA" };
    return mockResolve({ id, estado: "ANULADA" });
  },
  reporte: (anio, mes) => (isMockEnabled() ? mockResolve(mockDb.retenciones) : api.get(`/retenciones/reporte/${anio}/${mes}`).then((r) => r.data)),
};
