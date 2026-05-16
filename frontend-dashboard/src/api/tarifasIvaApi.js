import api from "./axios";
import { isMockEnabled, mockResolve, nextId } from "./useMock";

const mockTarifas = [
  { id: 1, nombre: "IVA 0%", porcentaje: 0, codigo_sri: "0", activo: true },
  { id: 2, nombre: "IVA 15%", porcentaje: 15, codigo_sri: "2", activo: true },
];

export const tarifasIvaApi = {
  getAll: () => (isMockEnabled() ? mockResolve(mockTarifas) : api.get("/tarifas-iva").then((r) => r.data)),
  create: (data) => {
    if (!isMockEnabled()) return api.post("/tarifas-iva", data).then((r) => r.data);
    const item = { id: nextId(mockTarifas), activo: true, ...data };
    mockTarifas.push(item);
    return mockResolve(item);
  },
  update: (id, data) => {
    if (!isMockEnabled()) return api.put(`/tarifas-iva/${id}`, data).then((r) => r.data);
    const idx = mockTarifas.findIndex((t) => t.id === Number(id));
    if (idx >= 0) mockTarifas[idx] = { ...mockTarifas[idx], ...data };
    return mockResolve(mockTarifas[idx] || null);
  },
  setDefault: (id) => {
    if (!isMockEnabled()) return api.put(`/tarifas-iva/${id}/default`).then((r) => r.data);
    mockTarifas.forEach((t) => (t.es_default = t.id === Number(id)));
    return mockResolve({ ok: true });
  },
};
