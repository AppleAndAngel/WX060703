import type { Effect } from '@/types'

const effect: Effect = {
  id: 'shake',
  name: '颤抖',
  trigger: (element: HTMLElement) => {
    let animationId: number
    let startTime: number | null = null
    const originalTransform = element.style.transform || ''

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const elapsed = timestamp - startTime
      const intensity = Math.min(elapsed / 500, 1) * 8

      const offsetX = (Math.random() - 0.5) * intensity * 2
      const offsetY = (Math.random() - 0.5) * intensity * 2
      const rotate = (Math.random() - 0.5) * intensity * 0.5

      element.style.transform = `${originalTransform} translate3d(${offsetX}px, ${offsetY}px, 0) rotate(${rotate}deg)`

      animationId = requestAnimationFrame(animate)
    }

    animationId = requestAnimationFrame(animate)

    return {
      cleanup: () => {
        cancelAnimationFrame(animationId)
        element.style.transform = originalTransform
      }
    }
  }
}

export default effect
