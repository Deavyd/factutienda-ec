import { useState } from "react";
import StatusBar from "./components/StatusBar";

function Toast({ item }) {
  return (
    <div
      style={{
        background: item.tone === "success" ? "#166534" : item.tone === "warning" ? "#92400e" : "#1e293b",
        color: "#fff",
        padding: "10px 12px",
        borderRadius: 8,
        marginBottom: 8,
        fontSize: 14,
      }}
    >
      {item.title}
    </div>
  );
}

export default function App() {
  const [toasts, setToasts] = useState([]);

  const pushToast = ({ tone, title }) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, tone, title }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg, #f8fafc, #e2e8f0)", paddingBottom: 48 }}>
      <div style={{ maxWidth: 960, margin: "0 auto", padding: 24 }}>
        <h1 style={{ margin: 0, fontSize: 32 }}>FactuTienda POS</h1>
        <p style={{ color: "#475569" }}>
          Base local lista. Esta pantalla es scaffold para validar estado de conexion y contingencia.
        </p>
      </div>

      <div style={{ position: "fixed", top: 16, right: 16, width: 320, zIndex: 60 }}>
        {toasts.map((t) => (
          <Toast key={t.id} item={t} />
        ))}
      </div>

      <StatusBar onToast={pushToast} />
    </div>
  );
}
