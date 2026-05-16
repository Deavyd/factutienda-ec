export default function Badge({ children, tone = "neutral", className = "", ...props }) {
  const tones = {
    neutral: "bg-gray-100 text-gray-700 dark:bg-neutral-800 dark:text-gray-300",
    success: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    warning: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    danger: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    info: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  };

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-medium ${tones[tone] || tones.neutral} ${className}`} {...props}>
      {children}
    </span>
  );
}
