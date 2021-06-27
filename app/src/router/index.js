import Vue from 'vue'
import VueRouter from 'vue-router'
import User from '../views/user.vue'
import HeadToHead from '../views/head-to-head'

Vue.use(VueRouter)

const routes = [
    {
        path: '/head-to-head',
        name: 'head2head',
        component: HeadToHead,
    },
    {
        path: '/users/:user',
        name: 'user',
        component: User,
    },
    {
        path: '/about',
        name: 'About',
        // route level code-splitting
        // this generates a separate chunk (about.[hash].js) for this route
        // which is lazy-loaded when the route is visited.
        component: () => import(/* webpackChunkName: "about" */ '../views/about.vue'),
    },
    {
        path: '*',
        redirect: '/head-to-head',
    },
]

const router = new VueRouter({
    mode: 'history',
    base: process.env.BASE_URL,
    routes,
})

export default router
