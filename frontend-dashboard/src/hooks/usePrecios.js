import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { preciosApi } from "../api/preciosApi";

export function useListasPrecio() {
  return useQuery({ queryKey: ["precios", "listas"], queryFn: preciosApi.getListas });
}
export function useCreateListaPrecio() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: preciosApi.createLista, onSuccess: () => qc.invalidateQueries({ queryKey: ["precios"] }) });
}
export function useUpdateListaPrecio() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, data }) => preciosApi.updateLista(id, data), onSuccess: () => qc.invalidateQueries({ queryKey: ["precios"] }) });
}
