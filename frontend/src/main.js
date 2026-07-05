import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import Login from './views/Login.vue'
import Register from './views/Register.vue'
import Dashboard from './views/Dashboard.vue'
import BotDetail from './views/BotDetail.vue'
import ChatView from './views/ChatView.vue'
import ApiDocs from './views/ApiDocs.vue'
import './style.css'

const router = createRouter({
    history: createWebHistory(),
    routes: [
        { path: '/', redirect: '/dashboard' },
        { path: '/login', component: Login },
        // { path: '/register', component: Register },
        { path: '/dashboard', component: Dashboard, meta: { auth: true } },
        { path: '/bot/:credkey', component: BotDetail, meta: { auth: true } },
        { path: '/chat/:credkey', component: ChatView, meta: { auth: true } },
        { path: '/docs', component: ApiDocs, meta: { auth: true } },
    ]
})

router.beforeEach((to, _, next) => {
    const token = localStorage.getItem('token')
    if (to.meta.auth && !token) return next('/login')
    if ((to.path === '/login' || to.path === '/register') && token) return next('/dashboard')
    next()
})

createApp(App).use(router).mount('#app')
