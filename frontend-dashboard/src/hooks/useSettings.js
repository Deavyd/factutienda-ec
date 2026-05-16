import { useMutation, useQuery } from "@tanstack/react-query";
import {
  getGeneralSettings,
  getHardwareSettings,
  getSriSettings,
  pingSri,
  updateGeneralSettings,
  updateHardwareSettings,
  updateSriSettings,
  uploadBusinessLogo,
  uploadSignature,
  validateSignature,
} from "../api/settingsApi";

export function useGeneralSettings() {
  return useQuery({ queryKey: ["settings", "general"], queryFn: getGeneralSettings });
}

export function useSriSettings() {
  return useQuery({ queryKey: ["settings", "sri"], queryFn: getSriSettings });
}

export function useHardwareSettings() {
  return useQuery({ queryKey: ["settings", "hardware"], queryFn: getHardwareSettings });
}

export function usePingSri() {
  return useMutation({ mutationFn: pingSri });
}

export function useUpdateGeneralSettings() {
  return useMutation({ mutationFn: updateGeneralSettings });
}

export function useUpdateSriSettings() {
  return useMutation({ mutationFn: updateSriSettings });
}

export function useUpdateHardwareSettings() {
  return useMutation({ mutationFn: updateHardwareSettings });
}

export function useUploadBusinessLogo() {
  return useMutation({ mutationFn: uploadBusinessLogo });
}

export function useUploadSignature() {
  return useMutation({ mutationFn: uploadSignature });
}

export function useValidateSignature() {
  return useMutation({ mutationFn: validateSignature });
}
