import { useQuery } from "@tanstack/react-query";
import { auditoriaApi } from "../api/auditoriaApi";

export function useAuditoria(params) {
  return useQuery({ queryKey: ["auditoria", params], queryFn: () => auditoriaApi.getAll(params) });
}
