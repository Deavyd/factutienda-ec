import { Navigate, Route, Routes } from "react-router-dom";
import MainLayout from "../components/layout/MainLayout";
import useAuth from "../hooks/useAuth";
import Login from "../pages/Login";
import DashboardPage from "../pages/Dashboard";
import ProductosPage from "../pages/Productos";
import ClientesPage from "../pages/Clientes";
import CategoriasPage from "../pages/Categorias";
import FacturasPage from "../pages/Facturas";
import GuiasRemisionPage from "../pages/GuiasRemision";
import ComprasPage from "../pages/Compras";
import ProveedoresPage from "../pages/Proveedores";
import LiquidacionesPage from "../pages/Liquidaciones";
import NotasCreditoPage from "../pages/NotasCredito";
import ProformasPage from "../pages/Proformas";
import RetencionesPage from "../pages/Retenciones";
import CuentasCobrarPage from "../pages/CuentasCobrar";
import CuentasPagarPage from "../pages/CuentasPagar";
import EtiquetasPage from "../pages/Etiquetas";
import UsuariosPage from "../pages/Usuarios";
import EstablecimientosPage from "../pages/Establecimientos";
import HistorialVentasPage from "../pages/HistorialVentas";
import ImportarProductosPage from "../pages/ImportarProductos";
import ReportesPage from "../pages/Reportes";

function PrivateRoute({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        element={
          <PrivateRoute>
            <MainLayout />
          </PrivateRoute>
        }
      >
        <Route path="/" element={<DashboardPage />} />
        <Route path="/productos" element={<ProductosPage />} />
        <Route path="/categorias" element={<CategoriasPage />} />
        <Route path="/clientes" element={<ClientesPage />} />
        <Route path="/facturas" element={<FacturasPage />} />
        <Route path="/guias-remision" element={<GuiasRemisionPage />} />
        <Route path="/compras" element={<ComprasPage />} />
        <Route path="/proveedores" element={<ProveedoresPage />} />
        <Route path="/liquidaciones" element={<LiquidacionesPage />} />
        <Route path="/notas-credito" element={<NotasCreditoPage />} />
        <Route path="/proformas" element={<ProformasPage />} />
        <Route path="/retenciones" element={<RetencionesPage />} />
        <Route path="/cuentas-cobrar" element={<CuentasCobrarPage />} />
        <Route path="/cuentas-pagar" element={<CuentasPagarPage />} />
        <Route path="/etiquetas" element={<EtiquetasPage />} />
        <Route path="/usuarios" element={<UsuariosPage />} />
        <Route path="/establecimientos" element={<EstablecimientosPage />} />
        <Route path="/historial-ventas" element={<HistorialVentasPage />} />
        <Route path="/importar-productos" element={<ImportarProductosPage />} />
        <Route path="/reportes" element={<ReportesPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
