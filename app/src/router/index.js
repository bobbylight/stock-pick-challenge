import Vue from 'vue'
import VueRouter from 'vue-router'
import User from '../views/user.vue'

Vue.use(VueRouter)

const routes = [
    {
        path: '/users/:user',
        name: 'user',
        component: User
    },
    {
        path: '/about',
        name: 'About',
        // route level code-splitting
        // this generates a separate chunk (about.[hash].js) for this route
        // which is lazy-loaded when the route is visited.
        component: () => import(/* webpackChunkName: "about" */ '../views/about.vue')
    },
    {
        path: '*',
        redirect: '/users/robert',
    },
]

const router = new VueRouter({
    mode: 'history',
    base: process.env.BASE_URL,
    routes
})

export default router
