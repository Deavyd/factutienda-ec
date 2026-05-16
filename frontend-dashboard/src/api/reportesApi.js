import api from "./axios";
import { mockDb, mockReportes } from "./mockData";
import { isMockEnabled, mockResolve } from "./useMock";

export const reportesApi = {
  ventasDia: (params) => (isMockEnabled() ? mockResolve(mockReportes.ventasDia) : api.get("/reportes/ventas-dia", { params }).then((r) => r.data)),
  ventasRango: (params) => (isMockEnabled() ? mockResolve(mockReportes.ventasRango) : api.get("/reportes/ventas-rango", { params }).then((r) => r.data)),
  stockActual: () => (isMockEnabled() ? mockResolve(mockDb.productos.map((p) => ({ ...p, alerta: Number(p.stock_actual) <= Number(p.stock_minimo || 0) }))) : api.get("/reportes/stock-actual").then((r) => r.data)),
  facturasSri: () => (isMockEnabled() ? mockResolve(mockDb.facturas) : api.get("/reportes/facturas-sri").then((r) => r.data)),
  topProductos: (params) => (isMockEnabled() ? mockResolve(mockReportes.topProductos) : api.get("/reportes/top-productos", { params }).then((r) => r.data)),
  exportarContador: async (params) => {
    if (isMockEnabled()) {
      const text = "Modo mock: exportacion contable disponible solo en backend real.";
      return { data: new Blob([text], { type: "text/plain" }), filename: "mock_export_contador.txt" };
    }
    const response = await api.get("/reportes/exportar-contador", { params, responseType: "blob" });
    return {
      data: response.data,
      filename: response.headers["content-disposition"]?.split("filename=")[1]?.replaceAll('"', "") || "reporte_contador.xlsx",
    };
  },
  exportarXmls: async (params) => {
    if (isMockEnabled()) {
      const text = "Modo mock: exportacion XML disponible solo en backend real.";
      return { data: new Blob([text], { type: "text/plain" }), filename: "mock_export_xmls.txt" };
    }
    const response = await api.get("/reportes/exportar-xmls", { params, responseType: "blob" });
    return {
      data: response.data,
      filename: response.headers["content-disposition"]?.split("filename=")[1]?.replaceAll('"', "") || "xmls.zip",
    };
  },
};
