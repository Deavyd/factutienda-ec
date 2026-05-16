import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { tarifasIvaApi } from "../api/tarifasIvaApi";

export function useTarifasIva() {
  return useQuery({ queryKey: ["tarifas-iva"], queryFn: tarifasIvaApi.getAll });
}
export function useCreateTarifaIva() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: tarifasIvaApi.create, onSuccess: () => qc.invalidateQueries({ queryKey: ["tarifas-iva"] }) });
}
export function useUpdateTarifaIva() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, data }) => tarifasIvaApi.update(id, data), onSuccess: () => qc.invalidateQueries({ queryKey: ["tarifas-iva"] }) });
}
