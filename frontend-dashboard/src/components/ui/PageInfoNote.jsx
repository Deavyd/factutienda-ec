import { Info } from "lucide-react";

const NOTES = {
  dashboard: {
    title: "POS y facturacion SRI",
    description: "Vende desde caja abierta, valida cliente/productos y deja trazabilidad del envio al SRI.",
    items: ["Consumidor final solo hasta USD 50.00", "Las facturas pendientes deben autorizarse o regularizarse", "El modo offline conserva ventas para sincronizar"],
  },
  productos: {
    title: "Productos listos para facturar",
    description: "Mantiene precios, stock e IVA correctos antes de emitir comprobantes.",
    items: ["Define tarifa IVA y codigos internos", "El stock alimenta reportes y alertas", "Importa cambios masivos desde plantilla validada"],
  },
  categorias: {
    title: "Categorias operativas",
    description: "Organiza el catalogo para busqueda rapida, reportes y control de inventario.",
    items: ["No afectan al SRI directamente", "Ayudan a clasificar ventas", "Evita duplicados para reportes limpios"],
  },
  clientes: {
    title: "Clientes y datos tributarios",
    description: "La identificacion y razon social se usan en facturas, notas de credito y reportes.",
    items: ["Cedula, RUC o consumidor final deben ser validos", "Datos completos reducen rechazos SRI", "Actualiza email para envio de comprobantes"],
  },
  facturasCaja: {
    title: "Caja antes de vender",
    description: "Abre caja para habilitar ventas, registrar ingresos/egresos y cerrar con cuadre real.",
    items: ["Base inicial obligatoria", "Ticket Z al cerrar turno", "Movimientos quedan separados de ventas"],
  },
  facturasHistorial: {
    title: "Historial y control SRI",
    description: "Revisa autorizaciones, pendientes, anulaciones y descarga XMLs para soporte contable.",
    items: ["Anulacion SRI en linea hasta 90 dias", "XML autorizado es respaldo tributario", "Pendientes requieren seguimiento"],
  },
  guias: {
    title: "Guias de remision",
    description: "Documentan el traslado de mercaderia con transportista, origen, destino y estado SRI.",
    items: ["Debe existir motivo y ruta del traslado", "Identifica transportista y RUC", "Puede relacionarse con factura"],
  },
  compras: {
    title: "Compras recibidas",
    description: "Registra comprobantes de proveedores para inventario, cuentas por pagar y retenciones.",
    items: ["Clave de acceso permite trazabilidad SRI", "Revisa bases e IVA antes de guardar", "Soporta control contable interno"],
  },
  proveedores: {
    title: "Proveedores tributarios",
    description: "Centraliza datos para compras, liquidaciones, retenciones y cuentas por pagar.",
    items: ["RUC o cedula debe coincidir con el comprobante", "Completa razon social y contacto", "Evita duplicados por identificacion"],
  },
  liquidaciones: {
    title: "Liquidaciones de compra",
    description: "Usalas cuando compras a proveedores no obligados a emitir comprobantes electronicos.",
    items: ["Identifica obligatoriamente al proveedor", "Separa base 0%, base 15% e IVA", "Debe autorizarse en SRI como comprobante electronico"],
  },
  notasCredito: {
    title: "Notas de credito",
    description: "Corrigen o devuelven valores de una factura autorizada sin perder trazabilidad tributaria.",
    items: ["Siempre referencian factura original", "Motivo obligatorio", "Pueden ser totales o parciales"],
  },
  proformas: {
    title: "Proformas sin efecto tributario",
    description: "Sirven como cotizacion; no declaran impuestos hasta convertirse en factura autorizada.",
    items: ["No reemplazan factura", "Mantienen items y precios propuestos", "Al convertir, aplica validaciones SRI"],
  },
  retenciones: {
    title: "Retenciones",
    description: "Registra valores retenidos vinculados a compras/proveedores segun porcentajes tributarios.",
    items: ["Revisa agente, RUC y fecha", "Total retenido debe cuadrar", "Anula solo cuando corresponda"],
  },
  cuentasCobrar: {
    title: "Cuentas por cobrar",
    description: "Da seguimiento financiero a facturas emitidas y saldos pendientes de clientes.",
    items: ["No emite SRI directamente", "Depende de ventas/facturas", "Controla vencimientos y pagos"],
  },
  cuentasPagar: {
    title: "Cuentas por pagar",
    description: "Controla obligaciones con proveedores derivadas de compras, liquidaciones o gastos.",
    items: ["No emite SRI directamente", "Relaciona comprobante y proveedor", "Ayuda a programar pagos"],
  },
  etiquetas: {
    title: "Etiquetas y precios",
    description: "Genera etiquetas operativas para tienda usando productos ya registrados.",
    items: ["No tiene impacto SRI directo", "Verifica precio antes de imprimir", "Util para gondola e inventario"],
  },
  usuarios: {
    title: "Usuarios y permisos",
    description: "Controla quien puede vender, anular, configurar SRI o administrar datos sensibles.",
    items: ["Permisos reducen errores operativos", "Acciones sensibles deben tener responsable", "No compartas credenciales"],
  },
  establecimientosGeneral: {
    title: "Configuracion general",
    description: "Datos comerciales visibles en documentos y en la operacion diaria del sistema.",
    items: ["Mantiene nombre, direccion y telefono", "Logo ayuda a identificar comprobantes", "Tema visual no afecta SRI"],
  },
  establecimientosSri: {
    title: "Configuracion SRI",
    description: "Define ambiente, RUC, establecimiento, punto de emision y firma electronica.",
    items: ["Pruebas no reemplaza produccion", "Firma y clave deben ser validas", "Endpoints SRI determinan autorizacion"],
  },
  establecimientosPrinters: {
    title: "Impresion y caja fisica",
    description: "Configura impresora, papel y cajon para tickets operativos y cierres de turno.",
    items: ["No autoriza comprobantes", "Debe coincidir con hardware instalado", "Prueba antes de operar caja"],
  },
  historialVentas: {
    title: "Ventas emitidas",
    description: "Consulta ventas, estados SRI, detalle del comprobante y anulaciones permitidas.",
    items: ["Autorizada significa aceptada por SRI", "Pendiente requiere seguimiento", "Anulacion en linea hasta 90 dias"],
  },
  importarProductos: {
    title: "Importacion segura",
    description: "Carga productos desde Excel validando columnas, precios, stock e impuestos antes de crear.",
    items: ["Usa plantilla oficial", "Corrige errores antes de confirmar", "Evita duplicados por codigo"],
  },
  reportesFacturas: {
    title: "Reportes SRI y contables",
    description: "Filtra comprobantes por fecha, exporta Excel para contador y descarga XMLs.",
    items: ["XML autorizado es respaldo fiscal", "Revisa pendientes antes de declarar", "El rango de fechas define exportacion"],
  },
  reportesStock: {
    title: "Reporte de stock",
    description: "Muestra existencias actuales y alertas para reabastecimiento operativo.",
    items: ["No se envia al SRI", "Depende de compras y ventas", "Stock bajo requiere revision"],
  },
  reportesGrafico: {
    title: "Grafico de ventas",
    description: "Resume comportamiento de ventas para decisiones comerciales rapidas.",
    items: ["Usa datos facturados", "Sirve para analisis interno", "No reemplaza reporte contable"],
  },
};

export default function PageInfoNote({ module, className = "" }) {
  const note = NOTES[module];
  if (!note) return null;

  return (
    <section className={`rounded-2xl border border-blue-200 bg-blue-50/80 p-4 text-blue-950 shadow-sm dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-blue-100 ${className}`}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm dark:bg-blue-900/60 dark:text-blue-200">
          <Info size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-black uppercase tracking-[0.16em] text-blue-700 dark:text-blue-300">Guia rapida</p>
          <h3 className="mt-1 text-base font-black text-slate-950 dark:text-white">{note.title}</h3>
          <p className="mt-1 text-sm leading-relaxed text-blue-900 dark:text-blue-100">{note.description}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {note.items.map((item) => (
              <span key={item} className="rounded-full border border-blue-200 bg-white/80 px-3 py-1 text-xs font-semibold text-blue-800 dark:border-blue-800 dark:bg-blue-900/50 dark:text-blue-100">
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
