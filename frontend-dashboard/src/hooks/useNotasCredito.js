import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notasCreditoApi } from "../api/notasCreditoApi";

export function useNotasCredito() {
  return useQuery({ queryKey: ["notas-credito"], queryFn: notasCreditoApi.getAll });
}

export function useNotaCredito(id) {
  return useQuery({ queryKey: ["notas-credito", id], queryFn: () => notasCreditoApi.getById(id), enabled: !!id });
}

export function useCreateNotaCredito() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: notasCreditoApi.create, onSuccess: () => qc.invalidateQueries({ queryKey: ["notas-credito"] }) });
}
