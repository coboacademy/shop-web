// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { 'enabled': true },
  css: ['~/assets/css/main.css'],

  vite: {
    plugins: [tailwindcss()],
  },

  modules: ['@pinia/nuxt'],

  runtimeConfig: {
    public: {
      apiBase: 'http://127.0.0.1:8000/api',
      //apiBase: 'https://cobo-api.laravel.cloud/api',
    },
  },
  ssr: false,
  components: [{ path: '~/components', pathPrefix: false }],
})
