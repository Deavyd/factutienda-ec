import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { retencionesApi } from "../api/retencionesApi";

export function useRetenciones(params) {
  return useQuery({ queryKey: ["retenciones", params], queryFn: () => retencionesApi.getAll(params) });
}

export function useRetencion(id) {
  return useQuery({ queryKey: ["retenciones", id], queryFn: () => retencionesApi.getById(id), enabled: !!id });
}

export function useCreateRetencion() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: retencionesApi.create, onSuccess: () => qc.invalidateQueries({ queryKey: ["retenciones"] }) });
}

export function useAnularRetencion() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: retencionesApi.anular, onSuccess: () => qc.invalidateQueries({ queryKey: ["retenciones"] }) });
}
