import InvoiceActions from "./InvoiceActions";
import InvoiceStatus from "./InvoiceStatus";

export default function InvoiceRow({ invoice }) {
  return (
    <tr className="transition-colors hover:bg-gray-50 dark:hover:bg-neutral-800/50">
      <td className="px-6 py-4 font-mono font-medium text-gray-900 dark:text-white">{invoice.id}</td>
      <td className="px-6 py-4">
        <div className="font-medium text-gray-900 dark:text-white">{invoice.client}</div>
        <div className="text-xs text-gray-500">{invoice.date}</div>
      </td>
      <td className="px-6 py-4 font-bold">${invoice.total.toFixed(2)}</td>
      <td className="px-6 py-4">
        <InvoiceStatus invoice={invoice} />
      </td>
      <td className="px-6 py-4 text-right">
        <InvoiceActions invoice={invoice} />
      </td>
    </tr>
  );
}
