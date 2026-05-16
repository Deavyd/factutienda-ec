import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { unidadesApi } from "../api/unidadesApi";

export function useUnidades() {
  return useQuery({ queryKey: ["unidades"], queryFn: unidadesApi.getAll });
}
export function useCreateUnidad() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: unidadesApi.create, onSuccess: () => qc.invalidateQueries({ queryKey: ["unidades"] }) });
}
export function useUpdateUnidad() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, data }) => unidadesApi.update(id, data), onSuccess: () => qc.invalidateQueries({ queryKey: ["unidades"] }) });
}
export function useDeleteUnidad() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: unidadesApi.delete, onSuccess: () => qc.invalidateQueries({ queryKey: ["unidades"] }) });
}
