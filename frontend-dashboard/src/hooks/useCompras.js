import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { comprasApi } from "../api/comprasApi";

export function useCompras() {
  return useQuery({ queryKey: ["compras"], queryFn: comprasApi.getAll });
}

export function useCreateCompra() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: comprasApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["compras"] });
      qc.invalidateQueries({ queryKey: ["productos"] });
    },
  });
}
