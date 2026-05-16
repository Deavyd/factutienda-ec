import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { liquidacionesApi } from "../api/liquidacionesApi";

export function useLiquidaciones() {
  return useQuery({ queryKey: ["liquidaciones"], queryFn: liquidacionesApi.getAll });
}

export function useLiquidacion(id) {
  return useQuery({ queryKey: ["liquidaciones", id], queryFn: () => liquidacionesApi.getById(id), enabled: !!id });
}

export function useCreateLiquidacion() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: liquidacionesApi.create, onSuccess: () => qc.invalidateQueries({ queryKey: ["liquidaciones"] }) });
}

export function useReenviarLiquidacion() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: liquidacionesApi.reenviar, onSuccess: () => qc.invalidateQueries({ queryKey: ["liquidaciones"] }) });
}
