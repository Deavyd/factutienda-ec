import ProductRow from "./ProductRow";
import { TableCard } from "../../../components/ui";

export default function ProductsTable({ products, onEdit, onDelete }) {
  return (
    <TableCard>
        <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
          <thead className="sticky top-0 border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-700 dark:border-neutral-800 dark:bg-neutral-800 dark:text-gray-400">
            <tr>
              <th className="px-6 py-4 font-semibold">Producto</th>
              <th className="px-6 py-4 font-semibold">Categoria</th>
              <th className="px-6 py-4 font-semibold">Precio</th>
              <th className="px-6 py-4 font-semibold">Stock</th>
              <th className="px-6 py-4 text-right font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-neutral-800">
            {products.map((product) => (
              <ProductRow key={product.id} product={product} onEdit={onEdit} onDelete={onDelete} />
            ))}
          </tbody>
        </table>
    </TableCard>
  );
}
