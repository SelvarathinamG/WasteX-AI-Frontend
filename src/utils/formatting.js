export function formatKg(value = 0) {
  return `${Number(value).toFixed(1)} kg`
}

export function formatPercent(value = 0) {
  return `${Math.round(value)}%`
}

export function formatTimestamp(ts) {
  if (!ts) return '—'
  return new Date(ts).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function timeAgo(ts) {
  if (!ts) return '—'
  const diffMs = Date.now() - ts
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

export function capitalize(word = '') {
  return word.charAt(0).toUpperCase() + word.slice(1)
}
