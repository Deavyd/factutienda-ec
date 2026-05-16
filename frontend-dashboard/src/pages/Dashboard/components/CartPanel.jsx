import { CheckCircle2, Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";

export default function CartPanel({ cart, total, onIncrease, onDecrease, onRemove, onCheckout, checkoutSpeed }) {
  const subtotal = total / 1.15;
  const iva = total - subtotal;

  const label = checkoutSpeed === "sri" ? "Cobrar y Enviar SRI" : checkoutSpeed === "turbo" ? "Cobrar (Modo Turbo)" : "Cobrar (Instantaneo)";

  return (
    <div className="flex w-full shrink-0 flex-col rounded-[1.25rem] border border-gray-200 bg-white p-5 shadow-sm md:h-[calc(100vh-4rem)] md:sticky md:top-8 md:w-[340px] dark:border-neutral-800 dark:bg-neutral-900">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-800 dark:text-white">Carrito Actual</h2>
        <span className="rounded-md bg-blue-50 px-2 py-1 text-xs font-bold text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">{cart.length} items</span>
      </div>

      <div className="mb-4 flex-1 overflow-y-auto rounded-xl border border-gray-50 bg-gray-50/50 p-2 dark:border-neutral-800 dark:bg-neutral-800/30">
        {cart.length === 0 ? (
          <div className="flex min-h-[200px] flex-col items-center justify-center gap-3 text-gray-400">
            <ShoppingCart size={48} className="opacity-30" strokeWidth={1.5} />
            <p className="text-sm font-medium">El carrito esta vacio</p>
            <p className="max-w-[200px] text-center text-xs opacity-70">Toca productos en la pantalla o usa el lector de codigo.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {cart.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-xl border border-gray-100 bg-white p-2.5 shadow-sm dark:border-neutral-800 dark:bg-neutral-800">
                <div className="min-w-0 flex-1 pr-2">
                  <p className="truncate text-sm font-medium text-gray-800 dark:text-gray-200">{item.name}</p>
                  <p className="text-xs font-semibold text-blue-600 dark:text-blue-400">${(item.price * item.qty).toFixed(2)} <span className="text-[10px] font-normal text-gray-400">(${item.price.toFixed(2)} c/u)</span></p>
                </div>
                <div className="flex items-center gap-2 rounded-lg border border-gray-100 bg-gray-50 p-1 dark:border-neutral-700 dark:bg-neutral-700">
                  <button onClick={() => onDecrease(item.id)} className="flex h-7 w-7 items-center justify-center rounded-md bg-white text-gray-600 shadow-sm transition-colors hover:bg-red-50 hover:text-red-500 dark:bg-neutral-600 dark:text-gray-200" type="button">
                    {item.qty === 1 ? <Trash2 size={14} /> : <Minus size={14} />}
                  </button>
                  <span className="w-5 text-center text-sm font-bold text-gray-700 dark:text-white">{item.qty}</span>
                  <button onClick={() => onIncrease(item.id)} className="flex h-7 w-7 items-center justify-center rounded-md bg-white text-gray-600 shadow-sm transition-colors hover:bg-blue-50 hover:text-blue-500 dark:bg-neutral-600 dark:text-gray-200" type="button">
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-auto border-t border-gray-100 pt-4 dark:border-neutral-800">
        <div className="mb-4 space-y-2">
          <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400"><span>Subtotal:</span><span>${subtotal.toFixed(2)}</span></div>
          <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400"><span>IVA (15%):</span><span>${iva.toFixed(2)}</span></div>
          <div className="mt-2 flex items-center justify-between border-t border-gray-100 pt-2 dark:border-neutral-800"><span className="text-lg font-bold text-gray-800 dark:text-white">Total:</span><span className="text-2xl font-black text-slate-900 dark:text-white">${total.toFixed(2)}</span></div>
        </div>
        <button onClick={onCheckout} disabled={cart.length === 0} className={`flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold transition-all ${cart.length > 0 ? "bg-blue-600 text-white shadow-[0_4px_14px_0_rgba(37,99,235,0.39)] hover:bg-blue-700" : "cursor-not-allowed bg-slate-200 text-slate-400 dark:bg-neutral-800 dark:text-neutral-500"}`} type="button">
          <CheckCircle2 size={20} /> {label}
        </button>
      </div>
    </div>
  );
}
