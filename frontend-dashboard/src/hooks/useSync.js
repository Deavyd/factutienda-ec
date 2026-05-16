import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { syncApi } from "../api/syncApi";

export function useSyncEstado() {
  return useQuery({ queryKey: ["sync", "estado"], queryFn: syncApi.getEstado });
}
export function useSyncCola() {
  return useQuery({ queryKey: ["sync", "cola"], queryFn: syncApi.getCola });
}
export function useProcesarSync() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: syncApi.procesar, onSuccess: () => qc.invalidateQueries({ queryKey: ["sync"] }) });
}
