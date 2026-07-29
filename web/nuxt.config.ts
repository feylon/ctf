// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2026-07-01',
  devtools: { enabled: true },

  // Platforma tokenlar bilan ishlaydigan dashboard bo'lgani uchun SPA rejimida
  ssr: false,

  modules: ['@nuxt/ui'],

  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    public: {
      // Backend manzili: NUXT_PUBLIC_API_BASE orqali o'zgartiriladi
      apiBase: 'http://localhost:3000/api/v1',
    },
  },

  app: {
    head: {
      title: 'CTF Platforma',
      htmlAttrs: { lang: 'uz' },
      meta: [
        { name: 'description', content: 'Capture The Flag musobaqalari va algoritmik masalalar platformasi' },
        { name: 'theme-color', content: '#09090b' },
      ],
      link: [{ rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
    },
  },

  colorMode: {
    preference: 'dark',
  },

  icon: {
    // Ikonkalar bundle ichiga olinadi (tashqi Iconify API ga murojaat qilinmaydi)
    clientBundle: { scan: true },
  },

  devServer: { port: 3001 },
})
