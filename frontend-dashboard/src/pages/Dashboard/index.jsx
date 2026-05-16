import { useMemo, useRef, useState } from "react";
import { useProductos } from "../../hooks/useProductos";
import { useCategorias } from "../../hooks/useCategorias";
import { useTurnoActual } from "../../hooks/useCaja";
import CartPanel from "./components/CartPanel";
import PaymentModal from "./components/PaymentModal";
import ProductFilters from "./components/ProductFilters";
import ProductGrid from "./components/ProductGrid";
import SRIOverlay from "./components/SRIOverlay";
import { PageInfoNote, useToast } from "../../components/ui";
import { Link } from "react-router-dom";
import { useCreateFactura } from "../../hooks/useFacturas";

function mapProducto(p) {
  return {
    id: p.id,
    name: p.nombre,
    price: parseFloat(p.precio_venta || p.precio_sin_iva || 0),
    category: p.categoria_id ? String(p.categoria_id) : "General",
    stock: parseInt(p.stock_actual || 0),
    codigo: p.codigo_barras || p.codigo_interno || "",
    image: p.codigo_barras ? "🏷️" : "📦",
  };
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function DashboardPage() {
  const { pushToast } = useToast();
  const { data: apiProducts = [], isLoading } = useProductos();
  const { data: apiCategorias = [] } = useCategorias();
  const turnoActual = useTurnoActual();
  const createFactura = useCreateFactura();
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("Todas");
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [sriStatus, setSriStatus] = useState(null);
  const [drawerStatus, setDrawerStatus] = useState(null);
  const lastScanRef = useRef({ codigo: "", timestamp: 0 });
  const [prefs, setPrefs] = useState({
    viewMode: "grid",
    checkoutSpeed: "sri",
    showBarcode: true,
    autoPrint: true,
    sounds: true,
    openDrawer: true,
    scannerDelay: 1000,
    confirmDelete: false,
  });

  const handlePrefsChange = (key, value) => setPrefs((prev) => ({ ...prev, [key]: value }));

  const products = useMemo(() => apiProducts.map(mapProducto), [apiProducts]);

  const categories = useMemo(() => ["Todas", ...apiCategorias.map((c) => c.nombre)], [apiCategorias]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = activeCategory === "Todas" || product.category === activeCategory ||
        apiCategorias.find((c) => String(c.id) === product.category && c.nombre === activeCategory);
      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, activeCategory, apiCategorias]);

  const total = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.qty, 0), [cart]);

  if (isLoading) return <div className="flex h-full items-center justify-center text-slate-500">Cargando productos...</div>;

  const cajaAbierta = !!turnoActual.data?.id;
  const mostrarBloqueoCaja = !turnoActual.isLoading && !cajaAbierta;

  if (mostrarBloqueoCaja) {
    return (
      <div className="grid h-full place-items-center">
        <div className="max-w-xl rounded-2xl border border-amber-300 bg-amber-50 p-6 text-center dark:bg-amber-900/20">
          <h3 className="mb-2 text-xl font-bold text-amber-800 dark:text-amber-200">Caja no abierta</h3>
          <p className="mb-4 text-sm text-amber-700 dark:text-amber-300">
            No puedes usar Ventas POS hasta abrir caja. Esto asegura control por turno y por usuario.
          </p>
          <Link to="/facturas" className="inline-flex rounded-lg bg-amber-600 px-4 py-2 font-medium text-white hover:bg-amber-700">
            Ir a Caja
          </Link>
        </div>
      </div>
    );
  }

  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) return prev.map((item) => (item.id === product.id ? { ...item, qty: item.qty + 1 } : item));
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const updateQty = (id, delta) => {
    setCart((prev) => prev.map((item) => (item.id === id ? { ...item, qty: item.qty + delta } : item)).filter((item) => item.qty > 0));
  };

  const removeFromCart = (id) => setCart((prev) => prev.filter((item) => item.id !== id));

  const handleCheckout = () => {
    if (cart.length === 0) return;
    setIsPaymentOpen(true);
  };

  const handleVoidCart = () => { setCart([]); setIsPaymentOpen(false); setDrawerStatus(null); setSriStatus(null); };

  const handleFacturaSuccess = () => { setCart([]); setIsPaymentOpen(false); setSriStatus(null); setDrawerStatus(null); };

  const handlePay = async (recibido) => {
    try {
      if (prefs.checkoutSpeed === "sri") {
        setSriStatus("FIRMA");
        await wait(700);
        setSriStatus("ENVIANDO");
        await wait(850);
      }

      const detalles = cart.map((item) => ({
        producto_id: item.id,
        cantidad: item.qty,
        precio_unitario: item.price,
      }));
      await createFactura.mutateAsync({
        cliente_id: 1,
        forma_pago: "EFECTIVO",
        recibido,
        total,
        detalles,
      });

      if (prefs.checkoutSpeed === "turbo") {
        setSriStatus("AUTORIZADO_TURBO");
        await wait(600);
      }

      pushToast({ tone: "success", title: "Factura emitida" });
      handleFacturaSuccess();
    } catch {
      setSriStatus(null);
      pushToast({ tone: "error", title: "No se pudo emitir la factura" });
    }
  };

  const handleBarcodeSubmit = (rawValue) => {
    const codigo = String(rawValue || "").trim();
    if (!codigo) return;

    const now = Date.now();
    if (lastScanRef.current.codigo === codigo && now - lastScanRef.current.timestamp < prefs.scannerDelay) {
      return;
    }

    lastScanRef.current = { codigo, timestamp: now };
    const product = products.find((item) => item.codigo && item.codigo === codigo);
    if (!product) {
      pushToast({ tone: "error", title: "Codigo no encontrado", description: codigo });
      return;
    }
    addToCart(product);
    pushToast({ tone: "success", title: `Agregado: ${product.name}` });
  };

  return (
    <div className="flex h-full flex-col gap-6 lg:flex-row">
      <div className="flex flex-1 flex-col space-y-4 overflow-hidden">
        <PageInfoNote module="dashboard" />
        <ProductFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          categories={categories}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
          onBarcodeSubmit={handleBarcodeSubmit}
          prefs={prefs}
          onPrefsChange={handlePrefsChange}
        />
        <div className="flex-1 overflow-y-auto pr-2">
          <ProductGrid products={filteredProducts} onSelect={addToCart} viewMode={prefs.viewMode} />
        </div>
      </div>
      <CartPanel
        cart={cart}
        total={total}
        onIncrease={(id) => updateQty(id, 1)}
        onDecrease={(id) => updateQty(id, -1)}
        onRemove={removeFromCart}
        onCheckout={handleCheckout}
        checkoutSpeed={prefs.checkoutSpeed}
      />
      {isPaymentOpen && (
        <PaymentModal
          total={total}
          openDrawer={prefs.openDrawer}
          onClose={handleVoidCart}
          onPay={handlePay}
        />
      )}
      {sriStatus ? <SRIOverlay status={sriStatus} autoPrint={prefs.autoPrint} /> : null}
    </div>
  );
}
