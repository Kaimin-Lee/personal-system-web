import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

// 版本检测：发布新版本后强制刷新
const currentVersion = __APP_VERSION__
const storedVersion = localStorage.getItem('app_version')
if (storedVersion && storedVersion !== currentVersion) {
  localStorage.setItem('app_version', currentVersion)
  location.reload()
} else {
  localStorage.setItem('app_version', currentVersion)
}

const app = createApp(App)

for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.use(router)
app.use(ElementPlus)
app.mount('#app')