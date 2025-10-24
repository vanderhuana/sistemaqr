import './assets/main.css'
import './assets/responsive.css'
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

// Desactivar Vue DevTools en producción
if (import.meta.env.PROD) {
  window.__VUE_DEVTOOLS_GLOBAL_HOOK__ = {
    on: () => {},
    once: () => {},
    off: () => {},
    emit: () => {},
    Vue: undefined
  }
}

// Desactivar warnings de Vue en producción
const app = createApp(App)
app.config.warnHandler = () => null
app.config.errorHandler = (err, instance, info) => {
  console.error('Error en Vue:', err, info)
}

// Desactivar completamente devtools
app.config.devtools = false

app.use(router).mount('#app')
