import { ref, onMounted, onUnmounted } from 'vue'

/**
 * Listens for a Vue component or DOM node to be visible in the viewport. Exposes an
 * "isInView" boolean that can be used to toggle visibility of components based on the
 * original one scrolling into view. We use this to have our fancy animated charts only
 * animate when they are just scrolled into view.
 */
export function useInView(options = {}) {
  const target = ref(null)
  const isInView = ref(false)
  let observer = null

  onMounted(() => {
    const el = target.value?.$el || target.value
    if (!el) return

    observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        isInView.value = true
        observer.disconnect()
      }
    }, { threshold: 0.1, ...options })

    observer.observe(el)
  })

  onUnmounted(() => {
    observer?.disconnect()
  })

  return { target, isInView }
}
