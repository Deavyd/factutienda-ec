import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { categoriasApi } from "../api/categoriasApi";

export function useCategorias() {
  return useQuery({ queryKey: ["categorias"], queryFn: categoriasApi.getAll });
}

export function useCreateCategoria() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: categoriasApi.create, onSuccess: () => qc.invalidateQueries({ queryKey: ["categorias"] }) });
}

export function useUpdateCategoria() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, data }) => categoriasApi.update(id, data), onSuccess: () => qc.invalidateQueries({ queryKey: ["categorias"] }) });
}

export function useDeleteCategoria() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id) => categoriasApi.delete(id), onSuccess: () => qc.invalidateQueries({ queryKey: ["categorias"] }) });
}
