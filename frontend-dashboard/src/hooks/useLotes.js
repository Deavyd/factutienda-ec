import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { lotesApi } from "../api/lotesApi";

export function useLotes(params) {
  return useQuery({ queryKey: ["lotes", params], queryFn: () => lotesApi.getAll(params) });
}
export function useCreateLote() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: lotesApi.create, onSuccess: () => qc.invalidateQueries({ queryKey: ["lotes"] }) });
}
export function useUpdateLote() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, data }) => lotesApi.update(id, data), onSuccess: () => qc.invalidateQueries({ queryKey: ["lotes"] }) });
}
export function useProximosVencer(dias = 30) {
  return useQuery({ queryKey: ["lotes", "proximos-vencer", dias], queryFn: () => lotesApi.proximosVencer(dias) });
}
export function useVencidos() {
  return useQuery({ queryKey: ["lotes", "vencidos"], queryFn: lotesApi.vencidos });
}
