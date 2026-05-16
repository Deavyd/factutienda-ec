import api from "./axios";
import { isMockEnabled, mockResolve } from "./useMock";

const MOCK_AUTH_USER = {
  id: 1,
  nombres: "Admin",
  apellidos: "FactuTienda",
  email: "admin@factutienda.ec",
  rol: "ADMIN",
};

export async function loginApi(payload) {
  if (isMockEnabled()) {
    return mockResolve({
      access_token: "mock_access_token",
      refresh_token: "mock_refresh_token",
      user: MOCK_AUTH_USER,
    });
  }
  const { data } = await api.post("/auth/login", payload);
  return data;
}

export async function meApi() {
  if (isMockEnabled()) {
    return mockResolve(MOCK_AUTH_USER);
  }
  const { data } = await api.get("/auth/me");
  return data;
}
