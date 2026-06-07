import type { Effect } from '@/types'
import type { SparkleParticle } from '@/types'

const effect: Effect = {
  id: 'sparkle',
  name: '碎光',
  trigger: (element: HTMLElement, options?: { onSparkleCreated?: (particles: SparkleParticle[]) => void }) => {
    const rect = element.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2

    const particleCount = 8 + Math.floor(Math.random() * 5)
    const colors = ['#ffffff', '#ffffaa', '#ffd700', '#88ccff', '#ff99cc', '#aaffaa']
    const particles: SparkleParticle[] = []

    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount + Math.random() * 0.3
      const speed = 3 + Math.random() * 5
      particles.push({
        id: `sparkle-${Date.now()}-${i}`,
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 3 + Math.random() * 4,
        life: 1
      })
    }

    if (options?.onSparkleCreated) {
      options.onSparkleCreated(particles)
    }

    return {
      cleanup: () => {}
    }
  }
}

export default effect
