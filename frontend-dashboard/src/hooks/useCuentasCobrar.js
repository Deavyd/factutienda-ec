import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { cuentasApi } from "../api/cuentasApi";

export function useCuentasCobrar(params) {
  return useQuery({ queryKey: ["cuentas", "cobrar", params], queryFn: () => cuentasApi.getCobrar(params) });
}

export function useCuentasResumen() {
  return useQuery({ queryKey: ["cuentas", "resumen"], queryFn: cuentasApi.resumen });
}

export function usePagarCuentaCobrar() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, data }) => cuentasApi.pagarCobrar(id, data), onSuccess: () => qc.invalidateQueries({ queryKey: ["cuentas"] }) });
}
