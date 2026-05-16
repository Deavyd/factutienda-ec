import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { guiasApi } from "../api/guiasApi";

export function useGuias() {
  return useQuery({ queryKey: ["guias"], queryFn: guiasApi.getAll });
}

export function useGuia(id) {
  return useQuery({ queryKey: ["guias", id], queryFn: () => guiasApi.getById(id), enabled: !!id });
}

export function useCreateGuia() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: guiasApi.create, onSuccess: () => qc.invalidateQueries({ queryKey: ["guias"] }) });
}

export function useReenviarGuia() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: guiasApi.reenviar, onSuccess: () => qc.invalidateQueries({ queryKey: ["guias"] }) });
}
