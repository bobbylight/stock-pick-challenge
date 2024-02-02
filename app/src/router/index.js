import { createRouter, createWebHashHistory } from 'vue-router'
import User from '../views/user.vue'
import HeadToHead from '../views/head-to-head.vue'

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
    component: () => import('../views/about.vue'),
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/head-to-head',
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

export default router
