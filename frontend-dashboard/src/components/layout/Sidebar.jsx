import { BarChart3, BadgeDollarSign, Box, Building2, FileMinus, FileOutput, FileSpreadsheet, FileText, LayoutDashboard, MapPinned, Package, Percent, Printer, ReceiptText, Shield, Tags, Truck, UploadCloud, Users, Store, Wallet } from "lucide-react";
import { NavLink } from "react-router-dom";

const MENU_GROUPS = [
  {
    title: "Operaciones",
    items: [
      { name: "Ventas (POS)", icon: LayoutDashboard, path: "/" },
      { name: "Caja", icon: FileText, path: "/facturas" },
      { name: "Historial Ventas", icon: ReceiptText, path: "/historial-ventas" },
    ],
  },
  {
    title: "Comercial",
    items: [
      { name: "Productos", icon: Package, path: "/productos" },
      { name: "Categorias", icon: Tags, path: "/categorias" },
      { name: "Importar Productos", icon: UploadCloud, path: "/importar-productos" },
      { name: "Etiquetas", icon: Printer, path: "/etiquetas" },
      { name: "Clientes", icon: Users, path: "/clientes" },
      { name: "Proveedores", icon: Building2, path: "/proveedores" },
    ],
  },
  {
    title: "Documentos",
    items: [
      { name: "Notas Credito", icon: FileMinus, path: "/notas-credito" },
      { name: "Proformas", icon: FileOutput, path: "/proformas" },
      { name: "Liquidaciones", icon: FileSpreadsheet, path: "/liquidaciones" },
      { name: "Guias Remision", icon: Truck, path: "/guias-remision" },
      { name: "Retenciones", icon: Percent, path: "/retenciones" },
      { name: "Ctas. Cobrar", icon: BadgeDollarSign, path: "/cuentas-cobrar" },
      { name: "Ctas. Pagar", icon: Wallet, path: "/cuentas-pagar" },
      { name: "Inventario", icon: Box, path: "/compras" },
    ],
  },
  {
    title: "Sistema",
    items: [
      { name: "Usuarios", icon: Shield, path: "/usuarios" },
      { name: "Configuracion", icon: MapPinned, path: "/establecimientos" },
      { name: "Comprobantes SRI", icon: BarChart3, path: "/reportes" },
    ],
  },
];

export default function Sidebar({ isOpen, closeSidebar }) {
  return (
    <>
      <div
        className={`fixed inset-0 z-30 bg-black/40 transition-opacity lg:hidden ${isOpen ? "opacity-100" : "pointer-events-none opacity-0"}`}
        onClick={closeSidebar}
      />
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 transform border-r border-gray-200 bg-gray-50 transition-transform duration-300 dark:border-neutral-800 dark:bg-neutral-950 lg:static lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } flex flex-col overflow-hidden`}
      >
        <div className="flex h-16 items-center gap-3 px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
            <Store size={18} />
          </div>
          <span className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">FactuTienda</span>
        </div>

        <nav className="flex flex-1 flex-col gap-4 overflow-y-auto p-4 pb-8">
          {MENU_GROUPS.map((group) => (
            <div key={group.title}>
              <p className="mb-1 px-2 text-xs font-bold uppercase tracking-wider text-slate-400">{group.title}</p>
              <div className="flex flex-col gap-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={closeSidebar}
                      className={({ isActive }) =>
                        `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                          isActive
                            ? "bg-white text-blue-600 shadow-sm dark:bg-neutral-900 dark:text-blue-400"
                            : "text-gray-600 hover:bg-gray-200/60 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-neutral-800 dark:hover:text-white"
                        }`
                      }
                    >
                      <Icon size={18} className="flex-shrink-0" />
                      {item.name}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}
