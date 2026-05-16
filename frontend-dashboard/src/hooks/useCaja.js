import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { cajaApi } from "../api/cajaApi";

export function useTurnoActual() {
  return useQuery({
    queryKey: ["caja", "turno-actual"],
    queryFn: cajaApi.turnoActual,
    retry: false,
  });
}

export function useAbrirCaja() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: cajaApi.abrir, onSuccess: () => qc.invalidateQueries({ queryKey: ["caja"] }) });
}

export function useCerrarCaja() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: cajaApi.cerrar, onSuccess: () => qc.invalidateQueries({ queryKey: ["caja"] }) });
}

export function useMovimientoCaja() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: cajaApi.movimiento, onSuccess: () => qc.invalidateQueries({ queryKey: ["caja"] }) });
}

export function useHistorialCaja(params) {
  return useQuery({ queryKey: ["caja", "historial", params], queryFn: () => cajaApi.historial(params) });
}
