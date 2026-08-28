export function formatBRL(v) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);
}

export function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export function monthKey(dateStr) {
  return dateStr ? dateStr.slice(0, 7) : "";
}
