import InvoiceRow from "./InvoiceRow";
import { TableCard } from "../../../components/ui";

export default function InvoicesTable({ invoices }) {
  return (
    <TableCard>
        <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
          <thead className="sticky top-0 border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-700 dark:border-neutral-800 dark:bg-neutral-800 dark:text-gray-400">
            <tr>
              <th className="px-6 py-4 font-semibold">Secuencial</th>
              <th className="px-6 py-4 font-semibold">Fecha / Cliente</th>
              <th className="px-6 py-4 font-semibold">Total</th>
              <th className="px-6 py-4 font-semibold">Estado SRI</th>
              <th className="px-6 py-4 text-right font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-neutral-800">
            {invoices.map((invoice) => (
              <InvoiceRow key={invoice.id} invoice={invoice} />
            ))}
          </tbody>
        </table>
    </TableCard>
  );
}
