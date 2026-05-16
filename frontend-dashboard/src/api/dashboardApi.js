import api from "./axios";
import { mockDashboard } from "./mockData";
import { isMockEnabled, mockResolve } from "./useMock";

export const dashboardApi = {
  resumen: () => (isMockEnabled() ? mockResolve(mockDashboard) : api.get("/dashboard/resumen").then((r) => r.data)),
};
