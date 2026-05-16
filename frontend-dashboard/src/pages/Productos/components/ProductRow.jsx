import { Edit, Trash2 } from "lucide-react";
import StockBadge from "./StockBadge";

export default function ProductRow({ product, onEdit, onDelete }) {
  return (
    <tr className="transition-colors hover:bg-gray-50 dark:hover:bg-neutral-800/50">
      <td className="flex items-center gap-3 px-6 py-4 font-medium text-gray-900 dark:text-white">
        <span className="text-2xl">{product.codigo_barras ? "🏷️" : "📦"}</span>
        {product.nombre}
      </td>
      <td className="px-6 py-4">
        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600 dark:bg-neutral-800 dark:text-gray-300">
          {product.categoria_id ? `Cat ${product.categoria_id}` : "General"}
        </span>
      </td>
      <td className="px-6 py-4">${parseFloat(product.precio_venta || product.precio_sin_iva || 0).toFixed(2)}</td>
      <td className="px-6 py-4">
        <StockBadge stock={parseInt(product.stock_actual || 0)} />
      </td>
      <td className="px-6 py-4 text-right">
        <button onClick={() => onEdit && onEdit(product)} className="mr-3 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300" type="button">
          <Edit size={18} />
        </button>
        <button onClick={() => onDelete && onDelete(product.id)} className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300" type="button">
          <Trash2 size={18} />
        </button>
      </td>
    </tr>
  );
}
