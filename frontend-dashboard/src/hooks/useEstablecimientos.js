import { useQuery } from "@tanstack/react-query";
import { establecimientosApi } from "../api/establecimientosApi";

export function useEstablecimientos() {
  return useQuery({ queryKey: ["establecimientos"], queryFn: establecimientosApi.getAll });
}

export function usePuntosEmision(estId) {
  return useQuery({ queryKey: ["puntos-emision", estId], queryFn: () => establecimientosApi.getPuntosEmision(estId), enabled: !!estId });
}
