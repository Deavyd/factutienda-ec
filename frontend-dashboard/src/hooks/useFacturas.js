import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { facturasApi } from "../api/facturasApi";

export function useFacturas(params) {
  return useQuery({ queryKey: ["facturas", params], queryFn: () => facturasApi.getAll(params) });
}

export function useFactura(id) {
  return useQuery({ queryKey: ["facturas", id], queryFn: () => facturasApi.getById(id), enabled: !!id });
}

export function useCreateFactura() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: facturasApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["facturas"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
