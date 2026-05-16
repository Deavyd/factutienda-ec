import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notificacionesApi } from "../api/notificacionesApi";

export function useNotificaciones(params) {
  return useQuery({ queryKey: ["notificaciones", params], queryFn: () => notificacionesApi.getAll(params) });
}
export function useCountNoLeidas() {
  return useQuery({ queryKey: ["notificaciones", "no-leidas"], queryFn: notificacionesApi.countNoLeidas });
}
export function useMarcarLeida() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: notificacionesApi.marcarLeida, onSuccess: () => qc.invalidateQueries({ queryKey: ["notificaciones"] }) });
}
export function useMarcarTodasLeidas() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: notificacionesApi.marcarTodasLeidas, onSuccess: () => qc.invalidateQueries({ queryKey: ["notificaciones"] }) });
}
