import api from "./axios";
import { isMockEnabled, mockResolve, nextId } from "./useMock";

const mockDescuentos = [
  { id: 1, nombre: "Descuento efectivo 5%", descripcion: "Pago en efectivo", tipo: "PORCENTAJE", valor: 5, aplica_a: "TOTAL", activo: true },
];

export const descuentosApi = {
  getAll: () => (isMockEnabled() ? mockResolve(mockDescuentos) : api.get("/descuentos").then((r) => r.data)),
  create: (data) => {
    if (!isMockEnabled()) return api.post("/descuentos", data).then((r) => r.data);
    const item = { id: nextId(mockDescuentos), activo: true, ...data };
    mockDescuentos.push(item);
    return mockResolve(item);
  },
  update: (id, data) => {
    if (!isMockEnabled()) return api.put(`/descuentos/${id}`, data).then((r) => r.data);
    const idx = mockDescuentos.findIndex((d) => d.id === Number(id));
    if (idx >= 0) mockDescuentos[idx] = { ...mockDescuentos[idx], ...data };
    return mockResolve(mockDescuentos[idx] || null);
  },
  delete: (id) => {
    if (!isMockEnabled()) return api.delete(`/descuentos/${id}`);
    const idx = mockDescuentos.findIndex((d) => d.id === Number(id));
    if (idx >= 0) mockDescuentos[idx] = { ...mockDescuentos[idx], activo: false };
    return mockResolve({ ok: true });
  },
};
