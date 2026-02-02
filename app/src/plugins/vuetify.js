import { createVuetify } from 'vuetify'
import 'vuetify/dist/vuetify.min.css'

const vuetify = createVuetify({
  theme: {
    themes: {
      light: {
        colors: {
          primary: '#2c3e50',
          secondary: '#42b983',
          success: '#1b5e20',
          error: '#bf360c',
        },
      },
    },
  },
})

export default vuetify
