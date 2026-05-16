import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { proveedoresApi } from "../api/proveedoresApi";

export function useProveedores() {
  return useQuery({ queryKey: ["proveedores"], queryFn: proveedoresApi.getAll });
}

export function useCreateProveedor() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: proveedoresApi.create, onSuccess: () => qc.invalidateQueries({ queryKey: ["proveedores"] }) });
}

export function useUpdateProveedor() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, data }) => proveedoresApi.update(id, data), onSuccess: () => qc.invalidateQueries({ queryKey: ["proveedores"] }) });
}

export function useDeleteProveedor() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id) => proveedoresApi.delete(id), onSuccess: () => qc.invalidateQueries({ queryKey: ["proveedores"] }) });
}
