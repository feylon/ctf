// Backend xatosidan foydalanuvchiga ko'rsatiladigan matnni ajratib oladi
export function apiErrorMessage(error: unknown, fallback = 'Kutilmagan xatolik yuz berdi'): string {
  const err = error as { data?: { message?: string | string[] }, statusCode?: number, message?: string }
  const message = err?.data?.message

  if (Array.isArray(message)) return message.join('. ')
  if (typeof message === 'string' && message) return message
  if (err?.statusCode === 429) return 'Juda ko‘p so‘rov yuborildi. Birozdan so‘ng qayta urinib ko‘ring'
  if (err?.message?.includes('fetch failed') || err?.message?.includes('Failed to fetch')) {
    return 'Server bilan aloqa yo‘q. Internet yoki server holatini tekshiring'
  }
  return fallback
}
