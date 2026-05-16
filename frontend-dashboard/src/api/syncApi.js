import api from "./axios";
import { isMockEnabled, mockResolve } from "./useMock";

const mockSyncItems = [
  { id: 1, tipo_operacion: "FACTURA", estado: "PENDIENTE", intentos: 0, max_intentos: 5, created_at: new Date().toISOString() },
];

export const syncApi = {
  getEstado: () => (isMockEnabled() ? mockResolve({ pendientes: 2, procesados: 10, fallidos: 0 }) : api.get("/sync/estado").then((r) => r.data)),
  procesar: () => (isMockEnabled() ? mockResolve({ ok: true, procesados: 2 }) : api.post("/sync/procesar").then((r) => r.data)),
  getCola: () => (isMockEnabled() ? mockResolve(mockSyncItems) : api.get("/sync/cola").then((r) => r.data)),
  reintentar: () => (isMockEnabled() ? mockResolve({ ok: true }) : api.post("/sync/reintentar").then((r) => r.data)),
  deleteCola: (id) => (isMockEnabled() ? mockResolve({ ok: true }) : api.delete(`/sync/cola/${id}`)),
};
