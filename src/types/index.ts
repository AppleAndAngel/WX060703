export interface Emotion {
  id: string
  name: string
  emoji: string
  color: {
    from: string
    to: string
  }
}

export interface Effect {
  id: string
  name: string
  trigger: (element: HTMLElement, options?: any) => { cleanup?: () => void } | void
}

export interface Bubble {
  id: string
  emotionId: string
  text?: string
  x: number
  y: number
  empathyCount: number
  createdAt: number
  ownerId: string
  floatOffset: number
  floatDuration: number
}

export interface TapRecord {
  id: string
  bubbleId: string
  bubbleEmoji: string
  count: number
  timestamp: number
  fromAnonymous?: boolean
}

export interface SparkleParticle {
  id: string
  x: number
  y: number
  vx: number
  vy: number
  color: string
  size: number
  life: number
}
