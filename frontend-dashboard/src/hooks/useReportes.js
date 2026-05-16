import { useMutation, useQuery } from "@tanstack/react-query";
import { reportesApi } from "../api/reportesApi";

export function useVentasDia(fecha) {
  return useQuery({ queryKey: ["reportes", "ventas-dia", fecha], queryFn: () => reportesApi.ventasDia({ fecha }), enabled: !!fecha });
}

export function useStockActual() {
  return useQuery({ queryKey: ["reportes", "stock-actual"], queryFn: reportesApi.stockActual });
}

export function useFacturasSri() {
  return useQuery({ queryKey: ["reportes", "facturas-sri"], queryFn: reportesApi.facturasSri });
}

export function useExportarContador() {
  return useMutation({ mutationFn: reportesApi.exportarContador });
}

export function useExportarXmls() {
  return useMutation({ mutationFn: reportesApi.exportarXmls });
}
