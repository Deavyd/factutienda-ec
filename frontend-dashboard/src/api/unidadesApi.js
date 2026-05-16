import api from "./axios";
import { isMockEnabled, mockResolve, nextId } from "./useMock";

const mockUnidades = [
  { id: 1, nombre: "Unidad", abreviatura: "und", tipo: "unidad", factor_conversion: 1, es_base: true, activo: true },
  { id: 2, nombre: "Kilogramo", abreviatura: "kg", tipo: "peso", factor_conversion: 1, es_base: true, activo: true },
  { id: 3, nombre: "Litro", abreviatura: "lt", tipo: "volumen", factor_conversion: 1, es_base: true, activo: true },
];

export const unidadesApi = {
  getAll: () => (isMockEnabled() ? mockResolve(mockUnidades.filter((u) => u.activo)) : api.get("/unidades").then((r) => r.data)),
  getTipos: () => (isMockEnabled() ? mockResolve(["peso", "volumen", "longitud", "unidad"]) : api.get("/unidades/tipos").then((r) => r.data)),
  getById: (id) => (isMockEnabled() ? mockResolve(mockUnidades.find((u) => u.id === Number(id)) || null) : api.get(`/unidades/${id}`).then((r) => r.data)),
  create: (data) => {
    if (!isMockEnabled()) return api.post("/unidades", data).then((r) => r.data);
    const item = { id: nextId(mockUnidades), activo: true, ...data };
    mockUnidades.push(item);
    return mockResolve(item);
  },
  update: (id, data) => {
    if (!isMockEnabled()) return api.put(`/unidades/${id}`, data).then((r) => r.data);
    const idx = mockUnidades.findIndex((u) => u.id === Number(id));
    if (idx >= 0) mockUnidades[idx] = { ...mockUnidades[idx], ...data };
    return mockResolve(mockUnidades[idx] || null);
  },
  delete: (id) => {
    if (!isMockEnabled()) return api.delete(`/unidades/${id}`);
    const idx = mockUnidades.findIndex((u) => u.id === Number(id));
    if (idx >= 0) mockUnidades[idx] = { ...mockUnidades[idx], activo: false };
    return mockResolve({ ok: true });
  },
};
