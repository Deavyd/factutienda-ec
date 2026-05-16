import api from "./axios";
import { isMockEnabled, mockResolve } from "./useMock";

const mockAuditoria = [
  { id: 1, usuario_nombre: "Administrador", accion: "CREAR", modulo: "productos", registro_id: 1, resultado: "EXITOSO", created_at: new Date().toISOString() },
];

export const auditoriaApi = {
  getAll: (params) => (isMockEnabled() ? mockResolve(mockAuditoria) : api.get("/auditoria", { params }).then((r) => r.data)),
  exportar: (params) => {
    if (!isMockEnabled()) return api.get("/auditoria/exportar", { params, responseType: "blob" }).then((r) => ({ data: r.data, filename: "auditoria.xlsx" }));
    return mockResolve({ data: new Blob(), filename: "auditoria.xlsx" });
  },
};
