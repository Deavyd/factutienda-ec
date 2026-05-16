import api from "./axios";
import { isMockEnabled, mockResolve, nextId } from "./useMock";

const mockLotes = [
  { id: 1, producto_id: 1, codigo_lote: "LOTE-2026-001", fecha_fabricacion: "2026-01-01", fecha_vencimiento: "2026-12-31", cantidad_inicial: 100, cantidad_actual: 65, costo_unitario: 0.85, activo: true },
];

export const lotesApi = {
  getAll: (params) => (isMockEnabled() ? mockResolve(mockLotes) : api.get("/lotes", { params }).then((r) => r.data)),
  create: (data) => {
    if (!isMockEnabled()) return api.post("/lotes", data).then((r) => r.data);
    const item = { id: nextId(mockLotes), activo: true, ...data };
    mockLotes.push(item);
    return mockResolve(item);
  },
  update: (id, data) => {
    if (!isMockEnabled()) return api.put(`/lotes/${id}`, data).then((r) => r.data);
    const idx = mockLotes.findIndex((l) => l.id === Number(id));
    if (idx >= 0) mockLotes[idx] = { ...mockLotes[idx], ...data };
    return mockResolve(mockLotes[idx] || null);
  },
  ajustar: (id, data) => (isMockEnabled() ? mockResolve({ ok: true }) : api.post(`/lotes/${id}/ajustar`, data).then((r) => r.data)),
  proximosVencer: (dias = 30) => (isMockEnabled() ? mockResolve(mockLotes.filter((l) => l.activo)) : api.get("/lotes/proximos-vencer", { params: { dias } }).then((r) => r.data)),
  vencidos: () => (isMockEnabled() ? mockResolve([]) : api.get("/lotes/vencidos").then((r) => r.data)),
};
