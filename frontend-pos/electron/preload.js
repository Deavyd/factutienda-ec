const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("factuElectron", {
  ipc: {
    invoke: (channel, payload) => ipcRenderer.invoke(channel, payload),
    onStatus: (callback) => {
      const handler = (_, payload) => callback(payload);
      ipcRenderer.on("startup-status", handler);
      return () => ipcRenderer.removeListener("startup-status", handler);
    },
  },
  getBackendPort: () => ipcRenderer.invoke("get-backend-port"),
  checkInternet: async () => {
    try {
      await fetch("https://www.google.com", { mode: "no-cors" });
      return true;
    } catch {
      return false;
    }
  },
});
