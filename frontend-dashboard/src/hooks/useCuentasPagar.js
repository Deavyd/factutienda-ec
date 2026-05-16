import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { cuentasApi } from "../api/cuentasApi";

export function useCuentasPagar(params) {
  return useQuery({ queryKey: ["cuentas", "pagar", params], queryFn: () => cuentasApi.getPagar(params) });
}

export function usePagarCuenta() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, data }) => cuentasApi.pagarPagar(id, data), onSuccess: () => qc.invalidateQueries({ queryKey: ["cuentas"] }) });
}
