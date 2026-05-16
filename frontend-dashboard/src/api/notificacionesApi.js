import api from "./axios";
import { isMockEnabled, mockResolve } from "./useMock";

const mockNotificaciones = [
  { id: 1, titulo: "Factura autorizada", mensaje: "Factura #001-001-123 autorizada por SRI", tipo: "SRI", prioridad: "ALTA", leida: false, created_at: new Date().toISOString() },
  { id: 2, titulo: "Stock bajo", mensaje: "Arroz 1kg tiene stock bajo (5 unidades)", tipo: "INVENTARIO", prioridad: "MEDIA", leida: false, created_at: new Date().toISOString() },
];

export const notificacionesApi = {
  getAll: (params) => (isMockEnabled() ? mockResolve(mockNotificaciones) : api.get("/notificaciones", { params }).then((r) => r.data)),
  countNoLeidas: () => (isMockEnabled() ? mockResolve({ count: mockNotificaciones.filter((n) => !n.leida).length }) : api.get("/notificaciones/no-leidas/count").then((r) => r.data)),
  marcarLeida: (id) => {
    if (!isMockEnabled()) return api.put(`/notificaciones/${id}/leer`).then((r) => r.data);
    const n = mockNotificaciones.find((n) => n.id === Number(id));
    if (n) n.leida = true;
    return mockResolve({ ok: true });
  },
  marcarTodasLeidas: () => {
    if (!isMockEnabled()) return api.put("/notificaciones/leer-todas").then((r) => r.data);
    mockNotificaciones.forEach((n) => (n.leida = true));
    return mockResolve({ ok: true });
  },
  delete: (id) => {
    if (!isMockEnabled()) return api.delete(`/notificaciones/${id}`);
    const idx = mockNotificaciones.findIndex((n) => n.id === Number(id));
    if (idx >= 0) mockNotificaciones.splice(idx, 1);
    return mockResolve({ ok: true });
  },
};
