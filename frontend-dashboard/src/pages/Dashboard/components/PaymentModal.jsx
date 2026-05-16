import { useState } from "react";
import { Banknote, CheckCircle2, Unlock, X } from "lucide-react";

export default function PaymentModal({ total, openDrawer, onClose, onPay }) {
  const [monto, setMonto] = useState("");
  const recibido = Number.parseFloat(monto) || 0;
  const vuelto = recibido >= total ? recibido - total : 0;
  const cubre = recibido >= total;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!cubre) return;
    onPay(recibido);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-xl dark:bg-neutral-900">
        <div className="flex items-center justify-between border-b border-gray-100 bg-slate-50 p-5 dark:border-neutral-800 dark:bg-neutral-800/50">
          <h3 className="flex items-center gap-2 text-lg font-bold text-gray-800 dark:text-white"><Banknote size={20} className="text-emerald-600" /> Cobro en Efectivo</h3>
          <button onClick={onClose} className="rounded-md border border-gray-200 bg-white p-1 text-gray-400 shadow-sm hover:text-gray-800 dark:border-neutral-700 dark:bg-neutral-800 dark:hover:text-white"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-5">
          <div className="mb-6 flex items-end justify-between rounded-xl border border-gray-100 bg-slate-50 p-4 dark:border-neutral-800 dark:bg-neutral-800/30">
            <div>
              <p className="mb-1 text-xs font-bold uppercase tracking-wider text-gray-400">Total a cobrar</p>
              <p className="text-3xl font-black text-slate-900 dark:text-white">${total.toFixed(2)}</p>
            </div>
            {openDrawer ? <div className="flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-100 px-2.5 py-1 text-[10px] font-bold text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"><Unlock size={12} strokeWidth={2.5} /> Caja</div> : null}
          </div>

          <div className="mb-6">
            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Monto Recibido</label>
              <button type="button" onClick={() => setMonto(total.toString())} className="rounded bg-blue-50 px-2 py-1 text-xs font-bold text-blue-600 transition-colors hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400">Monto Exacto</button>
            </div>
            <div className="mb-3 flex gap-2">
              {[5, 10, 20].map((billete) => (
                <button key={billete} type="button" onClick={() => setMonto(billete.toString())} className="flex-1 rounded-lg border border-emerald-200 bg-emerald-50 py-2 text-sm font-bold text-emerald-700 transition-colors hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">${billete}</button>
              ))}
            </div>
            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-gray-500">$</span>
              <input type="number" step="0.01" min={total} value={monto} onChange={(e) => setMonto(e.target.value)} placeholder="0.00" className="w-full rounded-xl border-2 border-gray-200 bg-white py-3 pl-8 pr-4 text-right text-xl font-bold text-gray-800 placeholder:text-gray-300 transition-all focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white" autoFocus />
            </div>
            {recibido > 0 && cubre ? (
              <div className="mt-4 flex items-center justify-between rounded-xl border border-blue-100 bg-blue-50 p-3.5 dark:border-blue-900/40 dark:bg-blue-900/20">
                <span className="text-sm font-bold uppercase tracking-wide text-blue-800 dark:text-blue-300">Vuelto a dar:</span>
                <span className="text-2xl font-black text-blue-600 dark:text-blue-400">${vuelto.toFixed(2)}</span>
              </div>
            ) : recibido > 0 ? (
              <div className="mt-4 rounded-xl border border-red-100 bg-red-50 p-3 text-center dark:border-red-900/40 dark:bg-red-900/20"><span className="text-xs font-bold uppercase text-red-500 dark:text-red-400">El monto no cubre el total</span></div>
            ) : null}
          </div>

          <button type="submit" disabled={!cubre} className={`flex w-full items-center justify-center gap-2 rounded-xl py-4 font-bold shadow-sm transition-all ${cubre ? "cursor-pointer bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-gray-200" : "cursor-not-allowed bg-gray-200 text-gray-400 dark:bg-neutral-800 dark:text-neutral-500"}`}>
            <CheckCircle2 size={20} /> Finalizar Venta
          </button>
        </form>
      </div>
    </div>
  );
}
