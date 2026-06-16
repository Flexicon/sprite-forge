export default defineNuxtConfig({
  compatibilityDate: '2026-06-14',
  devtools: { enabled: true },
  app: {
    head: {
      title: 'Sprite Forge',
      link: [
        { rel: 'icon', href: 'https://fav.farm/%E2%9A%92%EF%B8%8F', type: 'image/svg+xml' }
      ]
    }
  },
  devServer: {
    host: '0.0.0.0',
    port: 3674, // FORG on a phone keypad
  },
  modules: ['@nuxt/eslint', '@nuxtjs/tailwindcss'],
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    openrouterApiKey: process.env.OPENROUTER_API_KEY || '',
    databaseUrl: process.env.DATABASE_URL || 'file:./data/sprite-forge.sqlite',
    storageDir: process.env.STORAGE_DIR || './data/storage',
    openrouterDefaultModel: process.env.OPENROUTER_DEFAULT_MODEL || 'google/gemini-2.5-flash-image',
    openrouterSiteUrl: process.env.OPENROUTER_SITE_URL || 'http://localhost:3674',
    openrouterAppName: process.env.OPENROUTER_APP_NAME || 'Sprite Forge',
    public: {
      appName: 'Sprite Forge'
    }
  },
  typescript: {
    strict: true,
    typeCheck: true
  },
  vite: {
    server: {
      allowedHosts: ['dev-forge-sprite.nerfthis.xyz'],
    },
  },
})
