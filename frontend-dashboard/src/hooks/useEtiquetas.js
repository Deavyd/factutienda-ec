import { useMutation, useQueryClient } from "@tanstack/react-query";
import { etiquetasApi } from "../api/etiquetasApi";

export function useGenerarEtiqueta() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: etiquetasApi.generar, onSuccess: () => qc.invalidateQueries({ queryKey: ["etiquetas"] }) });
}

export function useGenerarEtiquetasMasivo() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: etiquetasApi.masivo, onSuccess: () => qc.invalidateQueries({ queryKey: ["etiquetas"] }) });
}
