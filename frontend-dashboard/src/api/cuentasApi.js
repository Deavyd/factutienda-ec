import api from "./axios";
import { mockDb } from "./mockData";
import { isMockEnabled, mockResolve } from "./useMock";

export const cuentasApi = {
  getCobrar: (params) => (isMockEnabled() ? mockResolve(mockDb.cuentasCobrar) : api.get("/cuentas/cobrar", { params }).then((r) => r.data)),
  pagarCobrar: (id, data) => {
    if (!isMockEnabled()) return api.post(`/cuentas/cobrar/${id}/pagar`, data).then((r) => r.data);
    const idx = mockDb.cuentasCobrar.findIndex((c) => c.id === Number(id));
    if (idx >= 0) {
      const monto = Number(data.monto) || 0;
      const cuenta = mockDb.cuentasCobrar[idx];
      const pagado = (Number(cuenta.monto_pagado) || 0) + monto;
      const pendiente = Math.max((Number(cuenta.monto_total) || 0) - pagado, 0);
      mockDb.cuentasCobrar[idx] = { ...cuenta, monto_pagado: pagado, monto_pendiente: pendiente, estado: pendiente === 0 ? "PAGADA" : "PENDIENTE" };
    }
    return mockResolve({ ok: true });
  },
  getPagar: (params) => (isMockEnabled() ? mockResolve(mockDb.cuentasPagar) : api.get("/cuentas/pagar", { params }).then((r) => r.data)),
  pagarPagar: (id, data) => {
    if (!isMockEnabled()) return api.post(`/cuentas/pagar/${id}/pagar`, data).then((r) => r.data);
    const idx = mockDb.cuentasPagar.findIndex((c) => c.id === Number(id));
    if (idx >= 0) {
      const monto = Number(data.monto) || 0;
      const cuenta = mockDb.cuentasPagar[idx];
      const pagado = (Number(cuenta.monto_pagado) || 0) + monto;
      const pendiente = Math.max((Number(cuenta.monto_total) || 0) - pagado, 0);
      mockDb.cuentasPagar[idx] = { ...cuenta, monto_pagado: pagado, monto_pendiente: pendiente, estado: pendiente === 0 ? "PAGADA" : "PENDIENTE" };
    }
    return mockResolve({ ok: true });
  },
  resumen: () => {
    if (!isMockEnabled()) return api.get("/cuentas/resumen").then((r) => r.data);
    const totalCobrar = mockDb.cuentasCobrar.reduce((s, c) => s + (Number(c.monto_pendiente) || 0), 0);
    const totalPagar = mockDb.cuentasPagar.reduce((s, c) => s + (Number(c.monto_pendiente) || 0), 0);
    return mockResolve({ total_por_cobrar: totalCobrar.toFixed(2), vencido_cobrar: "0.00", total_por_pagar: totalPagar.toFixed(2), vencido_pagar: "0.00" });
  },
};
