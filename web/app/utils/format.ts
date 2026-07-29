// Sana, hajm va boshqa qiymatlarni o'zbekcha formatlash

const pad = (n: number) => String(n).padStart(2, '0')

const MONTHS = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr']

export function formatDate(value?: string | Date | null) {
  if (!value) return '—'
  const d = new Date(value)
  return `${d.getDate()}-${MONTHS[d.getMonth()]}, ${d.getFullYear()}`
}

export function formatDateTime(value?: string | Date | null) {
  if (!value) return '—'
  const d = new Date(value)
  return `${formatDate(d)} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function timeAgo(value?: string | Date | null) {
  if (!value) return '—'
  const diff = Math.round((Date.now() - new Date(value).getTime()) / 1000)
  if (diff < 60) return 'hozirgina'
  if (diff < 3600) return `${Math.floor(diff / 60)} daqiqa oldin`
  if (diff < 86400) return `${Math.floor(diff / 3600)} soat oldin`
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)} kun oldin`
  return formatDate(value)
}

// <input type="datetime-local"> uchun lokal vaqt satri
export function toLocalInput(value?: string | Date | null) {
  if (!value) return ''
  const d = new Date(value)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function fromLocalInput(value?: string | null) {
  return value ? new Date(value).toISOString() : null
}

export function formatBytes(bytes: number) {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  return `${(bytes / 1024 ** i).toFixed(i === 0 ? 0 : 1)} ${units[i]}`
}

export function formatNumber(n: number) {
  return new Intl.NumberFormat('ru-RU').format(n)
}

type BadgeColor = 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error' | 'neutral'

export function difficultyMeta(difficulty: number): { label: string, color: BadgeColor } {
  if (difficulty < 25) return { label: 'Oson', color: 'success' }
  if (difficulty < 50) return { label: 'O‘rta', color: 'info' }
  if (difficulty < 75) return { label: 'Qiyin', color: 'warning' }
  return { label: 'Juda qiyin', color: 'error' }
}

export const ROLE_META: Record<string, { label: string, color: BadgeColor }> = {
  admin: { label: 'Admin', color: 'error' },
  moderator: { label: 'Moderator', color: 'warning' },
  user: { label: 'Foydalanuvchi', color: 'neutral' },
}

// Kategoriya nomiga qarab barqaror rang tanlash
const CATEGORY_COLORS: BadgeColor[] = ['primary', 'info', 'warning', 'error', 'secondary', 'success']
export function categoryColor(category: string): BadgeColor {
  let hash = 0
  for (const ch of category) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0
  return CATEGORY_COLORS[hash % CATEGORY_COLORS.length]!
}

export const CATEGORY_ICONS: Record<string, string> = {
  web: 'i-lucide-globe',
  crypto: 'i-lucide-key-round',
  pwn: 'i-lucide-bug',
  reverse: 'i-lucide-cpu',
  forensics: 'i-lucide-search',
  misc: 'i-lucide-puzzle',
  osint: 'i-lucide-eye',
  net: 'i-lucide-network',
  stego: 'i-lucide-image',
}

export function categoryIcon(category: string) {
  return CATEGORY_ICONS[category.toLowerCase()] ?? 'i-lucide-flag'
}
