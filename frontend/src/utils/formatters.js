export function formatRuntime(minutes) {
  if (!minutes || minutes <= 0) {
    return 'N/A';
  }
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) {
    return `${m} min`;
  }
  return `${h}h ${m}min`;
}

export function formatMoney(amount) {
  if (!amount || amount <= 0) {
    return 'N/A';
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}
