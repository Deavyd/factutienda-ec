import { useMutation, useQueryClient } from "@tanstack/react-query";
import { importarProductosApi } from "../api/importarProductosApi";

export function useDescargarPlantillaProductos() {
  return useMutation({ mutationFn: importarProductosApi.descargarPlantilla });
}

export function usePreviewImportacionProductos() {
  return useMutation({ mutationFn: importarProductosApi.preview });
}

export function useImportarProductosExcel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: importarProductosApi.importar,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["productos"] }),
  });
}
