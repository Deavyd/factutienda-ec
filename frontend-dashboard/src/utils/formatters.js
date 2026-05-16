export function formatCurrency(value) {
  return new Intl.NumberFormat("es-EC", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

export function formatDate(dateValue) {
  return new Intl.DateTimeFormat("es-EC").format(new Date(dateValue));
}
