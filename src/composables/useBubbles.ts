import { ref, computed, reactive } from 'vue'
import type { Bubble, TapRecord, SparkleParticle } from '@/types'
import { useLocalStorage, getUserId } from './useLocalStorage'
import { useEmotions } from './useEmotions'

const userId = getUserId()
const { getEmotion } = useEmotions()

const initialBubbles: Bubble[] = [
  { id: 'demo-1', emotionId: 'happy', text: '今天天气真好！', x: 15, y: 25, empathyCount: 3, createdAt: Date.now() - 3600000, ownerId: 'demo', floatOffset: 0, floatDuration: 8 },
  { id: 'demo-2', emotionId: 'angry', text: '又加班，烦死了', x: 75, y: 35, empathyCount: 7, createdAt: Date.now() - 7200000, ownerId: 'demo', floatOffset: 1, floatDuration: 10 },
  { id: 'demo-3', emotionId: 'lonely', text: '一个人吃饭', x: 45, y: 45, empathyCount: 12, createdAt: Date.now() - 10800000, ownerId: 'demo', floatOffset: 2, floatDuration: 12 },
  { id: 'demo-4', emotionId: 'happy', text: '收到礼物啦🎁', x: 25, y: 60, empathyCount: 5, createdAt: Date.now() - 1800000, ownerId: 'demo', floatOffset: 3, floatDuration: 7 },
  { id: 'demo-5', emotionId: 'lonely', x: 65, y: 20, empathyCount: 8, createdAt: Date.now() - 5400000, ownerId: 'demo', floatOffset: 4, floatDuration: 9 },
  { id: 'demo-6', emotionId: 'angry', text: '地铁又晚点', x: 85, y: 65, empathyCount: 15, createdAt: Date.now() - 9000000, ownerId: 'demo', floatOffset: 5, floatDuration: 11 },
]

const storedBubbles = useLocalStorage<Bubble[]>('bubbles', initialBubbles)
const storedMyBubbleIds = useLocalStorage<string[]>('my-bubbles', [])
const storedTapRecords = useLocalStorage<TapRecord[]>('tap-records', [])

const bubbles = reactive<Bubble[]>([...storedBubbles.value])
const myBubbleIds = reactive<string[]>([...storedMyBubbleIds.value])
const tapRecords = reactive<TapRecord[]>([...storedTapRecords.value])
const sparkleParticles = ref<SparkleParticle[]>([])

const syncToStorage = () => {
  storedBubbles.value = [...bubbles]
  storedMyBubbleIds.value = [...myBubbleIds]
  storedTapRecords.value = [...tapRecords]
}

export function useBubbles() {
  const myBubbles = computed(() =>
    bubbles.filter(b => myBubbleIds.includes(b.id))
  )

  const myTapRecords = computed(() =>
    tapRecords
      .filter(r => myBubbleIds.includes(r.bubbleId))
      .sort((a, b) => b.timestamp - a.timestamp)
  )

  const addBubble = (emotionId: string, text?: string) => {
    const newBubble: Bubble = {
      id: crypto.randomUUID(),
      emotionId,
      text,
      x: 10 + Math.random() * 80,
      y: 10 + Math.random() * 60,
      empathyCount: 0,
      createdAt: Date.now(),
      ownerId: userId,
      floatOffset: Math.random() * 10,
      floatDuration: 6 + Math.random() * 8
    }
    bubbles.push(newBubble)
    myBubbleIds.push(newBubble.id)
    syncToStorage()
    return newBubble
  }

  const addEmpathy = (bubbleId: string) => {
    const bubble = bubbles.find(b => b.id === bubbleId)
    if (!bubble) return

    bubble.empathyCount++

    const emotion = getEmotion(bubble.emotionId)
    if (bubble.ownerId !== userId) {
      const existingRecord = tapRecords.find(
        r => r.bubbleId === bubbleId && Date.now() - r.timestamp < 60000
      )
      if (existingRecord) {
        existingRecord.count++
        existingRecord.timestamp = Date.now()
      } else {
        tapRecords.unshift({
          id: crypto.randomUUID(),
          bubbleId,
          bubbleEmoji: emotion?.emoji || '💭',
          count: 1,
          timestamp: Date.now()
        })
      }

      if (myBubbleIds.length > 0 && Math.random() < 0.6) {
        const randomMyBubbleId = myBubbleIds[Math.floor(Math.random() * myBubbleIds.length)]
        const myBubble = bubbles.find(b => b.id === randomMyBubbleId)
        if (myBubble) {
          myBubble.empathyCount++
          const myBubbleEmotion = getEmotion(myBubble.emotionId)
          
          const myExistingRecord = tapRecords.find(
            r => r.bubbleId === randomMyBubbleId && Date.now() - r.timestamp < 30000
          )
          if (myExistingRecord) {
            myExistingRecord.count++
            myExistingRecord.timestamp = Date.now()
          } else {
            tapRecords.unshift({
              id: crypto.randomUUID(),
              bubbleId: randomMyBubbleId,
              bubbleEmoji: myBubbleEmotion?.emoji || '💭',
              count: 1,
              timestamp: Date.now(),
              fromAnonymous: true
            })
          }
        }
      }
    }

    syncToStorage()
    return bubble
  }

  const addSparkleParticles = (particles: SparkleParticle[]) => {
    sparkleParticles.value.push(...particles)

    const animate = () => {
      const toRemove: number[] = []
      sparkleParticles.value.forEach((p, idx) => {
        p.x += p.vx
        p.y += p.vy
        p.vy += 0.15
        p.life -= 0.02
        if (p.life <= 0) {
          toRemove.push(idx)
        }
      })

      toRemove.reverse().forEach(idx => {
        sparkleParticles.value.splice(idx, 1)
      })

      if (sparkleParticles.value.length > 0) {
        requestAnimationFrame(animate)
      }
    }

    requestAnimationFrame(animate)
  }

  return {
    bubbles,
    myBubbles,
    myTapRecords,
    sparkleParticles,
    addBubble,
    addEmpathy,
    addSparkleParticles,
    userId
  }
}
