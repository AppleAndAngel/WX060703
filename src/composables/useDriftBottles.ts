import { ref, computed, reactive } from 'vue'
import type { DriftBottle, BottleCatchRecord } from '@/types'
import { useLocalStorage, getUserId } from './useLocalStorage'
import { useEmotions } from './useEmotions'
import { useMoodCalendar } from './useMoodCalendar'

const userId = getUserId()
const { getEmotion } = useEmotions()
const { recordMood } = useMoodCalendar()

const demoBottles: DriftBottle[] = [
  { id: 'demo-bottle-1', emotionId: 'lonely', text: '深夜睡不着，有人和我一样吗？', empathyCount: 2, createdAt: Date.now() - 86400000, ownerId: 'demo-bottle' },
  { id: 'demo-bottle-2', emotionId: 'happy', text: '今天收到了心仪公司的offer！努力没有白费！', empathyCount: 5, createdAt: Date.now() - 172800000, ownerId: 'demo-bottle' },
  { id: 'demo-bottle-3', emotionId: 'angry', text: '外卖又送错了，已经是这个第三次了...', empathyCount: 1, createdAt: Date.now() - 259200000, ownerId: 'demo-bottle' },
  { id: 'demo-bottle-4', emotionId: 'lonely', text: '搬家第一天，感觉整个城市都很陌生', empathyCount: 3, createdAt: Date.now() - 345600000, ownerId: 'demo-bottle' },
  { id: 'demo-bottle-5', emotionId: 'happy', text: '和很久没见的朋友视频了一晚上，笑得脸都酸了', empathyCount: 4, createdAt: Date.now() - 432000000, ownerId: 'demo-bottle' },
  { id: 'demo-bottle-6', emotionId: 'angry', text: '为什么总有人在电影院里大声说话？', empathyCount: 2, createdAt: Date.now() - 518400000, ownerId: 'demo-bottle' },
]

const storedBottles = useLocalStorage<DriftBottle[]>('drift-bottles', demoBottles)
const storedMyBottleIds = useLocalStorage<string[]>('my-drift-bottles', [])
const storedCaughtBottleIds = useLocalStorage<string[]>('caught-bottles', [])
const storedCatchRecords = useLocalStorage<BottleCatchRecord[]>('bottle-catch-records', [])

const bottles = reactive<DriftBottle[]>([...storedBottles.value])
const myBottleIds = reactive<string[]>([...storedMyBottleIds.value])
const caughtBottleIds = reactive<string[]>([...storedCaughtBottleIds.value])
const catchRecords = reactive<BottleCatchRecord[]>([...storedCatchRecords.value])
const currentBottle = ref<DriftBottle | null>(null)
const isFishing = ref(false)

const syncToStorage = () => {
  storedBottles.value = [...bottles]
  storedMyBottleIds.value = [...myBottleIds]
  storedCaughtBottleIds.value = [...caughtBottleIds]
  storedCatchRecords.value = [...catchRecords]
}

export function useDriftBottles() {
  const myBottles = computed(() =>
    bottles.filter(b => myBottleIds.includes(b.id))
  )

  const availableBottles = computed(() =>
    bottles.filter(b =>
      b.ownerId !== userId &&
      !caughtBottleIds.includes(b.id)
    )
  )

  const bottleStats = computed(() => ({
    total: bottles.length,
    myCount: myBottleIds.length,
    caughtCount: caughtBottleIds.length,
    availableCount: availableBottles.value.length
  }))

  const throwBottle = (emotionId: string, text: string): DriftBottle => {
    const newBottle: DriftBottle = {
      id: crypto.randomUUID(),
      emotionId,
      text: text.trim(),
      empathyCount: 0,
      createdAt: Date.now(),
      ownerId: userId,
    }

    bottles.push(newBottle)
    myBottleIds.push(newBottle.id)
    recordMood(newBottle)
    syncToStorage()

    return newBottle
  }

  const fishBottle = (): DriftBottle | null => {
    if (availableBottles.value.length === 0) {
      return null
    }

    const randomIndex = Math.floor(Math.random() * availableBottles.value.length)
    const bottle = availableBottles.value[randomIndex]

    caughtBottleIds.push(bottle.id)
    bottle.isRead = true
    bottle.readAt = Date.now()
    syncToStorage()

    return bottle
  }

  const empathizeBottle = (bottleId: string): DriftBottle | undefined => {
    const bottle = bottles.find(b => b.id === bottleId)
    if (!bottle) return undefined

    bottle.empathyCount++

    const emotion = getEmotion(bottle.emotionId)
    catchRecords.unshift({
      id: crypto.randomUUID(),
      bottleId,
      bottleEmoji: emotion?.emoji || '🍾',
      action: 'empathy',
      timestamp: Date.now()
    })

    if (bottle.ownerId !== userId && bottle.ownerId !== 'demo-bottle') {
      if (myBottleIds.length > 0 && Math.random() < 0.5) {
        const randomMyBottleId = myBottleIds[Math.floor(Math.random() * myBottleIds.length)]
        const myBottle = bottles.find(b => b.id === randomMyBottleId)
        if (myBottle) {
          myBottle.empathyCount++
        }
      }
    }

    syncToStorage()
    return bottle
  }

  const throwBackBottle = (bottleId: string) => {
    const index = caughtBottleIds.indexOf(bottleId)
    if (index > -1) {
      caughtBottleIds.splice(index, 1)
    }

    const bottle = bottles.find(b => b.id === bottleId)
    if (bottle) {
      bottle.isRead = false
      bottle.readAt = undefined
    }

    const emotion = getEmotion(bottle?.emotionId || '')
    catchRecords.unshift({
      id: crypto.randomUUID(),
      bottleId,
      bottleEmoji: emotion?.emoji || '🍾',
      action: 'throw_back',
      timestamp: Date.now()
    })

    syncToStorage()
  }

  const setCurrentBottle = (bottle: DriftBottle | null) => {
    currentBottle.value = bottle
  }

  const setIsFishing = (value: boolean) => {
    isFishing.value = value
  }

  return {
    bottles,
    myBottles,
    availableBottles,
    currentBottle,
    isFishing,
    bottleStats,
    catchRecords,
    throwBottle,
    fishBottle,
    empathizeBottle,
    throwBackBottle,
    setCurrentBottle,
    setIsFishing,
    userId
  }
}
