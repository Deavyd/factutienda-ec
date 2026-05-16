import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { productosApi } from "../api/productosApi";

export function useProductos() {
  return useQuery({ queryKey: ["productos"], queryFn: productosApi.getAll });
}

export function useProducto(id) {
  return useQuery({ queryKey: ["productos", id], queryFn: () => productosApi.getById(id), enabled: !!id });
}

export function useCreateProducto() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: productosApi.create, onSuccess: () => qc.invalidateQueries({ queryKey: ["productos"] }) });
}

export function useUpdateProducto() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, data }) => productosApi.update(id, data), onSuccess: () => qc.invalidateQueries({ queryKey: ["productos"] }) });
}

export function useDeleteProducto() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id) => productosApi.delete(id), onSuccess: () => qc.invalidateQueries({ queryKey: ["productos"] }) });
}
