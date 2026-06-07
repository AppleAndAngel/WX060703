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

export interface DayMood {
  dateKey: string
  emotionIds: string[]
  bubbleIds: string[]
  primaryEmotionId?: string
}

export interface MoodCalendarState {
  days: Record<string, DayMood>
}

export type TimeRange = 'today' | 'week' | 'all'

export interface RankingBubble extends Bubble {
  growthRate: number
  periodEmpathyCount: number
}

export interface DriftBottle {
  id: string
  emotionId: string
  text: string
  empathyCount: number
  createdAt: number
  ownerId: string
  isRead?: boolean
  readAt?: number
}

export interface BottleCatchRecord {
  id: string
  bottleId: string
  bottleEmoji: string
  action: 'empathy' | 'throw_back'
  timestamp: number
}

export interface NightMessage {
  id: string
  text: string
  emotionId: string
  bubbleId?: string
  createdAt: number
  availableAt: number
  isRead: boolean
  ownerId: string
  bubbleCreated: boolean
}
