// Tailwind dinamik klasslarni ko'rmaydi, shuning uchun to'liq klass nomlari
const TEXT_CLASSES: Record<string, string> = {
  primary: 'text-primary',
  secondary: 'text-secondary',
  success: 'text-success',
  info: 'text-info',
  warning: 'text-warning',
  error: 'text-error',
  neutral: 'text-muted',
}

export function categoryTextClass(category: string) {
  return TEXT_CLASSES[categoryColor(category)] ?? 'text-primary'
}
