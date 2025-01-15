import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'

export default defineNuxtPlugin((nuxtApp) => {
  const vuetify = createVuetify({
    ssr: true,
    components,
    directives,
    theme: {
      defaultTheme: 'myPremiumTheme',
      themes: {
        myPremiumTheme: {
          dark: false,
          colors: {
            primary: '#673AB7',   // a “premium” purple
            secondary: '#512DA8',
            error: '#E53935',
            info: '#2196F3',
            success: '#4CAF50',
            warning: '#FB8C00',
          },
        },
      },
    },
  })
  nuxtApp.vueApp.use(vuetify)
})
