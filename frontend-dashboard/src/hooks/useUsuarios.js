import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usuariosApi } from "../api/usuariosApi";

export function useUsuarios() {
  return useQuery({ queryKey: ["usuarios"], queryFn: usuariosApi.getAll });
}

export function useCreateUsuario() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: usuariosApi.create, onSuccess: () => qc.invalidateQueries({ queryKey: ["usuarios"] }) });
}

export function useUpdateUsuario() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, data }) => usuariosApi.update(id, data), onSuccess: () => qc.invalidateQueries({ queryKey: ["usuarios"] }) });
}

export function useDeleteUsuario() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id) => usuariosApi.delete(id), onSuccess: () => qc.invalidateQueries({ queryKey: ["usuarios"] }) });
}
