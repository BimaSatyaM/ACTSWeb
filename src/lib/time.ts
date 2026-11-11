export function formatUtcTime(isoString?: string | null): string {
  if (!isoString) return 'N/A'
  try {
    const d = new Date(isoString)
    if (isNaN(d.getTime())) return 'N/A'
    return d.toISOString().slice(11, 16) + ' UTC'
  } catch {
    return 'N/A'
  }
}

export function formatUtcDate(isoString?: string | null): string {
  if (!isoString) return 'N/A'
  try {
    const d = new Date(isoString)
    if (isNaN(d.getTime())) return 'N/A'
    return d.toISOString().slice(0, 10)
  } catch {
    return 'N/A'
  }
}
