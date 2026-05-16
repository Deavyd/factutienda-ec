import api from "./axios";
import { isMockEnabled, mockResolve } from "./useMock";

export const importarProductosApi = {
  descargarPlantilla: async () => {
    if (isMockEnabled()) {
      return { data: new Blob(["codigo,nombre,precio,stock\n"], { type: "text/csv" }), filename: "plantilla_importacion_productos.csv" };
    }
    const response = await api.get("/productos/plantilla-importacion", { responseType: "blob" });
    return { data: response.data, filename: "plantilla_importacion_productos.xlsx" };
  },
  preview: (payload) => {
    if (isMockEnabled()) {
      return mockResolve({ preview: [], errores: [], mensaje: "Vista previa mock generada" });
    }
    return api.post("/productos/importar-preview", payload).then((r) => r.data);
  },
  importar: (payload) => {
    if (isMockEnabled()) {
      return mockResolve({ importados: 0, duplicados: 0, errores: [] });
    }
    return api.post("/productos/importar-excel", payload).then((r) => r.data);
  },
};
