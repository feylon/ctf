// Toast xabarlari uchun qisqa yordamchilar
export function useNotify() {
  const toast = useToast()

  return {
    success: (title: string, description?: string) =>
      toast.add({ title, description, color: 'success', icon: 'i-lucide-circle-check' }),
    error: (error: unknown, fallback?: string) =>
      toast.add({ title: 'Xatolik', description: apiErrorMessage(error, fallback), color: 'error', icon: 'i-lucide-circle-alert' }),
    info: (title: string, description?: string) =>
      toast.add({ title, description, color: 'info', icon: 'i-lucide-info' }),
  }
}
