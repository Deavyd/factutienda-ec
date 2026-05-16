import { RefreshCw } from "lucide-react";
import { Button } from "../../../components/ui";

export default function ReportesHeader() {
  return (
    <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
      <div>
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">Comprobantes Electronicos</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">Monitor en tiempo real del estado en el SRI.</p>
      </div>
      <Button variant="secondary" className="w-full sm:w-auto">
        <RefreshCw size={18} /> Sincronizar SRI
      </Button>
    </div>
  );
}
