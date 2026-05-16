export default function ProductGrid({ products, onSelect, viewMode }) {
  if (viewMode === "list") {
    return (
      <div className="flex flex-col gap-2 overflow-y-auto pb-4">
        {products.map((product) => (
          <div key={product.id} onClick={() => onSelect(product)} className="group flex cursor-pointer items-center gap-4 rounded-xl border border-gray-200 bg-white p-3 shadow-sm transition-all hover:border-blue-200 hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-blue-500">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-[#f8f9fa] text-2xl transition-colors group-hover:bg-blue-50 dark:bg-neutral-800">{product.image}</div>
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-sm font-medium text-gray-800 dark:text-gray-200">{product.name}</h3>
              <div className="mt-0.5 flex items-center gap-3">
                <span className="text-[11px] text-gray-400">Cod: <span className="font-mono text-gray-500">{product.codigo}</span></span>
              </div>
            </div>
            <div className="flex-shrink-0 text-right">
              <span className="block text-base font-bold text-blue-600 dark:text-blue-400">${product.price.toFixed(2)}</span>
              <span className="text-[11px] font-medium text-gray-400">Disp: {product.stock}</span>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 overflow-y-auto pb-4 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((product) => (
        <div key={product.id} onClick={() => onSelect(product)} className="flex cursor-pointer flex-col rounded-[1.25rem] border border-gray-200 bg-white p-4 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-blue-500">
          <div className="mb-3 flex h-20 items-center justify-center rounded-xl bg-[#f8f9fa] text-4xl dark:bg-neutral-800">{product.image}</div>
          <h3 className="mb-1 truncate text-sm font-medium text-gray-800 dark:text-gray-200">{product.name}</h3>
          <p className="mb-2 truncate text-[10px] text-gray-400">Cod: {product.codigo}</p>
          <div className="mt-auto flex items-center justify-between">
            <span className="font-bold text-blue-600 dark:text-blue-400">${product.price.toFixed(2)}</span>
            <span className="rounded-md bg-gray-50 px-2 py-1 text-[11px] font-medium text-gray-400 dark:bg-neutral-800">{product.stock} un</span>
          </div>
        </div>
      ))}
    </div>
  );
}
