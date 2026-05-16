import api from "./axios";
import { isMockEnabled, mockResolve, clone } from "./useMock";

const mockCaja = {
  turnoActual: null,
  historial: [],
  _nextId: 1,
};

function _now() {
  return new Date().toISOString();
}

export const cajaApi = {
  abrir: (data) => {
    if (!isMockEnabled()) return api.post("/caja/abrir", data).then((r) => r.data);
    const turno = {
      id: mockCaja._nextId++,
      estado: "ABIERTO",
      estado_sri: "ABIERTA",
      monto_apertura: Number(data.monto_apertura || 100),
      fecha_apertura: _now(),
      fecha_cierre: null,
      monto_cierre_real: null,
      observaciones: null,
    };
    mockCaja.turnoActual = turno;
    mockCaja.historial.unshift(clone(turno));
    return mockResolve(clone(turno));
  },
  cerrar: (data) => {
    if (!isMockEnabled()) return api.post("/caja/cerrar", data).then((r) => r.data);
    if (!mockCaja.turnoActual) {
      return Promise.reject(new Error("No hay turno abierto"));
    }
    const cerrado = {
      ...mockCaja.turnoActual,
      estado: "CERRADO",
      estado_sri: "CERRADA",
      fecha_cierre: _now(),
      monto_cierre_real: Number(data.monto_cierre_real || data.contado || 0),
      observaciones: data.observaciones || "",
    };
    const idx = mockCaja.historial.findIndex((h) => h.id === cerrado.id);
    if (idx >= 0) mockCaja.historial[idx] = clone(cerrado);
    const result = {
      turno_id: cerrado.id,
      arqueo: { esperado: Number(data.esperado || 0), contado: cerrado.monto_cierre_real, diferencia: cerrado.monto_cierre_real - Number(data.esperado || 0) },
      reporte_base64: "",
      ok: true,
    };
    mockCaja.turnoActual = null;
    return mockResolve(result);
  },
  turnoActual: () => {
    if (!isMockEnabled()) return api.get("/caja/turno-actual").then((r) => r.data);
    if (!mockCaja.turnoActual) {
      return Promise.reject({ response: { status: 404, data: { detail: "No hay turno abierto" } } });
    }
    return mockResolve(clone(mockCaja.turnoActual));
  },
  arqueo: (id) => {
    if (!isMockEnabled()) return api.get(`/caja/arqueo/${id}`).then((r) => r.data);
    return mockResolve({ turno_id: id, esperado: 250, contado: 248.5, diferencia: -1.5 });
  },
  movimiento: (data) => {
    if (!isMockEnabled()) return api.post("/caja/movimiento", data).then((r) => r.data);
    if (!mockCaja.turnoActual) {
      return Promise.reject(new Error("No hay turno abierto"));
    }
    return mockResolve({ ok: true, id: Date.now(), tipo: data.tipo, monto: data.monto, descripcion: data.descripcion });
  },
  historial: (params) => {
    if (!isMockEnabled()) return api.get("/caja/turnos", { params }).then((r) => r.data);
    const limit = Number(params?.limit || 100);
    return mockResolve(clone(mockCaja.historial.slice(0, limit)));
  },
};
