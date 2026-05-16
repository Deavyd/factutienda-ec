import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { proformasApi } from "../api/proformasApi";

export function useProformas() {
  return useQuery({ queryKey: ["proformas"], queryFn: proformasApi.getAll });
}

export function useCreateProforma() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: proformasApi.create, onSuccess: () => qc.invalidateQueries({ queryKey: ["proformas"] }) });
}

export function useConvertirProforma() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => proformasApi.convertirAFactura(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["proformas"] });
      qc.invalidateQueries({ queryKey: ["facturas"] });
    },
  });
}
