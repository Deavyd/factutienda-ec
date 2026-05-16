import api from "./axios";
import { isMockEnabled, mockResolve } from "./useMock";

const mockSriSettings = {
  ambiente: "PRUEBAS",
  ruc: "0199999999001",
  establecimiento: "001",
  puntoEmision: "001",
  firmaNombre: "firma-demo.p12",
  smtpHost: "smtp.demo.ec",
  smtpPort: "587",
  smtpSecure: true,
  smtpFrom: "facturacion@demo.ec",
  smtpPassword: "",
};

const mockGeneralSettings = {
  businessName: "Tinmarket Demo",
  phone: "072200000",
  address: "Cuenca, Ecuador",
  defaultVat: "15",
  logoUrl: "",
};

export async function getSriSettings() {
  if (isMockEnabled()) return mockResolve(mockSriSettings);
  const { data } = await api.get("/sistema/info");
  return {
    ambiente: data.ambiente_sri === "1" || data.ambiente_sri === 1 ? "PRUEBAS" : "PRODUCCION",
    ruc: data.ruc || "",
    establecimiento: "001",
    puntoEmision: "001",
    firmaNombre: "",
    smtpHost: "",
    smtpPort: "587",
    smtpSecure: true,
    smtpFrom: "",
    smtpPassword: "",
  };
}

export async function pingSri() {
  if (isMockEnabled()) return mockResolve({ online: true });
  const { data } = await api.get("/setup/test-sri?ambiente=1");
  const online = Object.values(data || {}).some((v) => v === "ok");
  return { online };
}

export async function updateSriSettings(payload) {
  if (isMockEnabled()) return mockResolve({ ok: true });
  await api.post("/sistema/configuracion", payload);
  return { ok: true };
}

export async function validateSignature(payload) {
  if (isMockEnabled()) return mockResolve({ valida: true, razon: "Demo" });
  const { data } = await api.post("/setup/firma-electronica", payload);
  return data;
}

export async function uploadSignature(file) {
  if (isMockEnabled()) return mockResolve({ valida: true, nombre: file?.name || "firma-demo.p12" });
  const reader = new FileReader();
  const b64 = await new Promise((resolve) => {
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.readAsDataURL(file);
  });
  const { data } = await api.post("/setup/firma-electronica", { p12_base64: b64, password: "temp" });
  return data;
}

export async function getGeneralSettings() {
  if (isMockEnabled()) return mockResolve(mockGeneralSettings);
  const { data } = await api.get("/sistema/info");
  return {
    businessName: data.razon_social || "",
    phone: "",
    address: "",
    defaultVat: "15",
    logoUrl: "",
  };
}

export async function updateGeneralSettings(payload) {
  if (isMockEnabled()) return mockResolve({ ok: true });
  await api.post("/sistema/configuracion", payload);
  return { ok: true };
}

export async function uploadBusinessLogo(file) {
  if (isMockEnabled()) return mockResolve({ url: "" });
  return { url: "" };
}

export async function getHardwareSettings() {
  if (isMockEnabled()) {
    return mockResolve({
      printerName: "POS-80C (USB)",
      paperSize: "80mm",
      cashDrawerEnabled: true,
    });
  }
  return {
    printerName: "POS-80C (USB)",
    paperSize: "80mm",
    cashDrawerEnabled: true,
  };
}

export async function updateHardwareSettings(payload) {
  if (isMockEnabled()) return mockResolve({ ok: true });
  return { ok: true };
}
