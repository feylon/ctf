// Admin panel: faqat admin va moderatorlar uchun
export default defineNuxtRouteMiddleware((to) => {
  const { loggedIn, isStaff } = useAuth()
  if (!loggedIn.value) {
    return navigateTo({ path: '/login', query: { redirect: to.fullPath } })
  }
  if (!isStaff.value) {
    return abortNavigation(createError({ statusCode: 403, message: 'Bu sahifaga kirish uchun ruxsatingiz yo‘q' }))
  }
})
