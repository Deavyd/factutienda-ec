import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { clientesApi } from "../api/clientesApi";

export function useClientes() {
  return useQuery({ queryKey: ["clientes"], queryFn: clientesApi.getAll });
}

export function useCreateCliente() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: clientesApi.create, onSuccess: () => qc.invalidateQueries({ queryKey: ["clientes"] }) });
}

export function useUpdateCliente() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, data }) => clientesApi.update(id, data), onSuccess: () => qc.invalidateQueries({ queryKey: ["clientes"] }) });
}

export function useDeleteCliente() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id) => clientesApi.delete(id), onSuccess: () => qc.invalidateQueries({ queryKey: ["clientes"] }) });
}
