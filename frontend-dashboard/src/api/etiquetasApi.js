import api from "./axios";
import { isMockEnabled, mockResolve } from "./useMock";

export const etiquetasApi = {
  generar: (data) => (
    isMockEnabled()
      ? mockResolve({
          ok: true,
          lote: "ETQ-DEMO",
          filename: `etiqueta-${data?.producto_id || "demo"}.pdf`,
          content_base64: "JVBERi0xLjQKJcTl8uXrCjEgMCBvYmoKPDw+PgplbmRvYmoKdHJhaWxlcgo8PD4+CiUlRU9G",
          ...data,
        })
      : api.post("/etiquetas/generar", data).then((r) => r.data)
  ),
  masivo: (data) => (isMockEnabled() ? mockResolve({ ok: true, total: (data?.items || []).length }) : api.post("/etiquetas/masivo", data).then((r) => r.data)),
};
