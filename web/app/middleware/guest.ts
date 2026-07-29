// Login/ro'yxatdan o'tish sahifalari tizimga kirganlarga ko'rsatilmaydi
export default defineNuxtRouteMiddleware(() => {
  const { loggedIn } = useAuth()
  if (loggedIn.value) {
    return navigateTo('/')
  }
})
