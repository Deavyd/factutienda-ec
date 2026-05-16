import { useEffect, useMemo, useRef, useState } from "react";

const DEFAULT_API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api/v1";

export default function StatusBar({ onToast }) {
  const [estado, setEstado] = useState({ internet: null, sri: null, modo_facturacion: "VERIFICANDO", facturas_pendientes_sync: 0 });
  const [apiUrl, setApiUrl] = useState(DEFAULT_API_URL);
  const prevModo = useRef("VERIFICANDO");

  const badge = useMemo(() => {
    if (estado.internet === null) return { color: "bg-slate-500", text: "Verificando conexión..." };
    if (!estado.internet) return { color: "bg-amber-500", text: "Sin internet - Modo contingencia activado" };
    if (estado.internet && !estado.sri) return { color: "bg-red-600", text: "SRI no disponible - Verificar conexión" };
    return { color: "bg-emerald-600", text: "En línea - SRI disponible" };
  }, [estado.internet, estado.sri]);

  useEffect(() => {
    let mounted = true;
    const syncPort = async () => {
      try {
        if (window.factuElectron?.getBackendPort) {
          const port = await window.factuElectron.getBackendPort();
          if (mounted && port) {
            setApiUrl(`http://127.0.0.1:${port}/api/v1`);
          }
        }
      } catch {
        // ignore and keep default URL
      }
    };
    syncPort();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    const fetchEstado = async () => {
      try {
        const res = await fetch(`${apiUrl}/sistema/estado-conexion`);
        if (!res.ok) return;
        const data = await res.json();
        if (!mounted) return;
        setEstado(data);

        if (prevModo.current !== data.modo_facturacion) {
          if (data.modo_facturacion === "CONTINGENCIA") {
            onToast?.({ tone: "warning", title: "Sin internet: contingencia activada" });
          }
          if (prevModo.current === "CONTINGENCIA" && data.modo_facturacion === "TIEMPO_REAL") {
            onToast?.({ tone: "success", title: `Conexión restablecida. Sincronizando ${data.facturas_pendientes_sync || 0} facturas...` });
          }
        }
        prevModo.current = data.modo_facturacion;
      } catch {
        if (mounted) setEstado((prev) => ({ ...prev, internet: false, sri: false, modo_facturacion: "CONTINGENCIA" }));
      }
    };

    fetchEstado();
    const id = setInterval(fetchEstado, 30000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, [apiUrl, onToast]);

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-2 text-sm text-white ${badge.color}`}>
      <span>{badge.text}</span>
      <span>Pendientes sync: {estado.facturas_pendientes_sync || 0}</span>
    </div>
  );
}
