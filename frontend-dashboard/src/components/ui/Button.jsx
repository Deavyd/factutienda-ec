export default function Button({ children, className = "", variant = "primary", ...props }) {
  const base = "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors";

  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700",
    secondary:
      "border border-gray-200 bg-white text-gray-700 shadow-sm hover:bg-gray-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-gray-200 dark:hover:bg-neutral-700",
    ghost: "text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-neutral-800",
  };

  return (
    <button className={`${base} ${variants[variant] || variants.primary} ${className}`} type="button" {...props}>
      {children}
    </button>
  );
}
