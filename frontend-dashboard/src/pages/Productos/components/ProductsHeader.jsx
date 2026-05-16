import { Plus } from "lucide-react";
import { Button } from "../../../components/ui";

export default function ProductsHeader({ section, onChangeSection, onCreate }) {
  const goCreate = () => {
    if (onCreate) {
      onCreate();
      return;
    }
    onChangeSection("create");
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">Inventario de Productos</h2>
        <Button onClick={goCreate}>
          <Plus size={18} /> Nuevo Producto
        </Button>
      </div>
      <div className="inline-flex gap-1 rounded-xl border border-gray-200 bg-white p-1 dark:border-neutral-700 dark:bg-neutral-900">
        <button type="button" onClick={() => onChangeSection("list")} className={`rounded-lg px-3 py-1.5 text-sm ${section === "list" ? "bg-blue-600 text-white" : "text-gray-600 dark:text-gray-300"}`}>
          Productos
        </button>
        <button type="button" onClick={goCreate} className={`rounded-lg px-3 py-1.5 text-sm ${section === "create" ? "bg-blue-600 text-white" : "text-gray-600 dark:text-gray-300"}`}>
          Creacion de productos
        </button>
      </div>
    </div>
  );
}
