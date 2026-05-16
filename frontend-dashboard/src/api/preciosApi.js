import api from "./axios";
import { isMockEnabled, mockResolve, nextId } from "./useMock";

const mockListas = [
  { id: 1, nombre: "Precio Publico", descripcion: "Lista default", tipo_calculo: "FIJO", valor: 0, es_default: true, activo: true },
];

export const preciosApi = {
  getListas: () => (isMockEnabled() ? mockResolve(mockListas) : api.get("/precios/listas-precio").then((r) => r.data)),
  createLista: (data) => {
    if (!isMockEnabled()) return api.post("/precios/listas-precio", data).then((r) => r.data);
    const item = { id: nextId(mockListas), activo: true, ...data };
    mockListas.push(item);
    return mockResolve(item);
  },
  updateLista: (id, data) => {
    if (!isMockEnabled()) return api.put(`/precios/listas-precio/${id}`, data).then((r) => r.data);
    const idx = mockListas.findIndex((l) => l.id === Number(id));
    if (idx >= 0) mockListas[idx] = { ...mockListas[idx], ...data };
    return mockResolve(mockListas[idx] || null);
  },
  getPreciosProducto: (productoId) => (isMockEnabled() ? mockResolve([]) : api.get(`/precios/productos/${productoId}/precios`).then((r) => r.data)),
  asignarPrecio: (productoId, data) => {
    if (!isMockEnabled()) return api.post(`/precios/productos/${productoId}/precios`, data).then((r) => r.data);
    return mockResolve({ ok: true, ...data });
  },
};
