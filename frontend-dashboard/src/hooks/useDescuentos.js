import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { descuentosApi } from "../api/descuentosApi";

export function useDescuentos() {
  return useQuery({ queryKey: ["descuentos"], queryFn: descuentosApi.getAll });
}
export function useCreateDescuento() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: descuentosApi.create, onSuccess: () => qc.invalidateQueries({ queryKey: ["descuentos"] }) });
}
export function useUpdateDescuento() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, data }) => descuentosApi.update(id, data), onSuccess: () => qc.invalidateQueries({ queryKey: ["descuentos"] }) });
}
export function useDeleteDescuento() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: descuentosApi.delete, onSuccess: () => qc.invalidateQueries({ queryKey: ["descuentos"] }) });
}
