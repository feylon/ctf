// Ilova ishga tushganda saqlangan token bo'yicha foydalanuvchini yuklaymiz
export default defineNuxtPlugin(async () => {
  await useAuth().init()
})
