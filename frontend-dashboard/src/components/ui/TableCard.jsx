export default function TableCard({ children }) {
  return (
    <div className="flex-1 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <div className="h-full overflow-x-auto">{children}</div>
    </div>
  );
}
