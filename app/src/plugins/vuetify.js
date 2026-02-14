import { createVuetify } from 'vuetify'
import { aliases, mdi } from 'vuetify/iconsets/mdi-svg'
import 'vuetify/dist/vuetify.min.css'

const savedTheme = localStorage.getItem('theme') || 'light'

const vuetify = createVuetify({
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: { mdi },
  },
  theme: {
    defaultTheme: savedTheme,
    themes: {
      light: {
        colors: {
          primary: '#1e293b',
          secondary: '#0ea5e9',
          success: '#16a34a',
          error: '#dc2626',
          surface: '#ffffff',
        },
      },
      dark: {
        dark: true,
        colors: {
          primary: '#e2e8f0',
          secondary: '#38bdf8',
          success: '#22c55e',
          error: '#f87171',
          surface: '#1e293b',
          background: '#0f172a',
        },
      },
    },
  },
})

export default vuetify
