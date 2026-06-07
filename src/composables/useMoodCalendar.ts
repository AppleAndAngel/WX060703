import { computed, reactive } from 'vue'
import type { DayMood, Bubble } from '@/types'
import { useLocalStorage } from './useLocalStorage'
import { useEmotions } from './useEmotions'

const { getEmotion } = useEmotions()

const storedMoodCalendar = useLocalStorage<Record<string, DayMood>>('mood-calendar', {})
const days = reactive<Record<string, DayMood>>({ ...storedMoodCalendar.value })

const syncToStorage = () => {
  storedMoodCalendar.value = { ...days }
}

const getDateKey = (timestamp: number): string => {
  const date = new Date(timestamp)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const getMonthKey = (year: number, month: number): string => {
  return `${year}-${String(month + 1).padStart(2, '0')}`
}

const findPrimaryEmotion = (emotionIds: string[]): string | undefined => {
  if (emotionIds.length === 0) return undefined
  const countMap: Record<string, number> = {}
  emotionIds.forEach(id => {
    countMap[id] = (countMap[id] || 0) + 1
  })
  let maxCount = 0
  let primaryId: string | undefined
  Object.entries(countMap).forEach(([id, count]) => {
    if (count > maxCount) {
      maxCount = count
      primaryId = id
    }
  })
  return primaryId
}

export function useMoodCalendar() {
  const recordMood = (bubble: Bubble) => {
    const dateKey = getDateKey(bubble.createdAt)

    if (!days[dateKey]) {
      days[dateKey] = {
        dateKey,
        emotionIds: [],
        bubbleIds: [],
        primaryEmotionId: undefined
      }
    }

    const dayMood = days[dateKey]
    if (dayMood.bubbleIds.includes(bubble.id)) {
      return
    }

    dayMood.emotionIds.push(bubble.emotionId)
    dayMood.bubbleIds.push(bubble.id)
    dayMood.primaryEmotionId = findPrimaryEmotion(dayMood.emotionIds)

    syncToStorage()
  }

  const recordMoodsFromBubbles = (bubblesList: Bubble[]) => {
    let hasChanges = false

    bubblesList.forEach(bubble => {
      const dateKey = getDateKey(bubble.createdAt)

      if (!days[dateKey]) {
        days[dateKey] = {
          dateKey,
          emotionIds: [],
          bubbleIds: [],
          primaryEmotionId: undefined
        }
      }

      const dayMood = days[dateKey]
      if (dayMood.bubbleIds.includes(bubble.id)) {
        return
      }

      dayMood.emotionIds.push(bubble.emotionId)
      dayMood.bubbleIds.push(bubble.id)
      hasChanges = true
    })

    Object.keys(days).forEach(dateKey => {
      const dayMood = days[dateKey]
      dayMood.primaryEmotionId = findPrimaryEmotion(dayMood.emotionIds)
    })

    if (hasChanges) {
      syncToStorage()
    }
  }

  const getDayMood = (dateKey: string): DayMood | undefined => {
    return days[dateKey]
  }

  const getMonthDays = (year: number, month: number): DayMood[] => {
    const monthKey = getMonthKey(year, month)
    return Object.values(days)
      .filter(day => day.dateKey.startsWith(monthKey))
      .sort((a, b) => a.dateKey.localeCompare(b.dateKey))
  }

  const getMonthCalendar = (year: number, month: number) => {
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDayOfWeek = firstDay.getDay()
    const totalDays = lastDay.getDate()

    const monthDays = getMonthDays(year, month)
    const dayMoodMap = new Map(monthDays.map(d => [d.dateKey, d]))

    const calendarDays: Array<{
      date: Date
      dateKey: string
      dayOfMonth: number
      isCurrentMonth: boolean
      dayMood?: DayMood
      primaryEmoji?: string
      primaryColor?: string
      emotionCount: number
    }> = []

    const prevMonthLastDay = new Date(year, month, 0).getDate()
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevMonthLastDay - i)
      const dateKey = getDateKey(date.getTime())
      const dayMood = dayMoodMap.get(dateKey)
      const emotion = dayMood?.primaryEmotionId ? getEmotion(dayMood.primaryEmotionId) : undefined

      calendarDays.push({
        date,
        dateKey,
        dayOfMonth: prevMonthLastDay - i,
        isCurrentMonth: false,
        dayMood,
        primaryEmoji: emotion?.emoji,
        primaryColor: emotion?.color.from,
        emotionCount: dayMood?.emotionIds.length || 0
      })
    }

    for (let i = 1; i <= totalDays; i++) {
      const date = new Date(year, month, i)
      const dateKey = getDateKey(date.getTime())
      const dayMood = dayMoodMap.get(dateKey)
      const emotion = dayMood?.primaryEmotionId ? getEmotion(dayMood.primaryEmotionId) : undefined

      calendarDays.push({
        date,
        dateKey,
        dayOfMonth: i,
        isCurrentMonth: true,
        dayMood,
        primaryEmoji: emotion?.emoji,
        primaryColor: emotion?.color.from,
        emotionCount: dayMood?.emotionIds.length || 0
      })
    }

    const remainingDays = 42 - calendarDays.length
    for (let i = 1; i <= remainingDays; i++) {
      const date = new Date(year, month + 1, i)
      const dateKey = getDateKey(date.getTime())
      const dayMood = dayMoodMap.get(dateKey)
      const emotion = dayMood?.primaryEmotionId ? getEmotion(dayMood.primaryEmotionId) : undefined

      calendarDays.push({
        date,
        dateKey,
        dayOfMonth: i,
        isCurrentMonth: false,
        dayMood,
        primaryEmoji: emotion?.emoji,
        primaryColor: emotion?.color.from,
        emotionCount: dayMood?.emotionIds.length || 0
      })
    }

    return calendarDays
  }

  const getEmotionFrequencyForMonth = (year: number, month: number) => {
    const monthDays = getMonthDays(year, month)
    const frequency: Record<string, number> = {}

    monthDays.forEach(day => {
      day.emotionIds.forEach(id => {
        frequency[id] = (frequency[id] || 0) + 1
      })
    })

    return frequency
  }

  const todayDateKey = computed(() => getDateKey(Date.now()))

  const hasTodayMood = computed(() => {
    return !!days[todayDateKey.value]
  })

  const totalMoodDays = computed(() => Object.keys(days).length)

  return {
    days,
    recordMood,
    recordMoodsFromBubbles,
    getDayMood,
    getMonthDays,
    getMonthCalendar,
    getEmotionFrequencyForMonth,
    getDateKey,
    todayDateKey,
    hasTodayMood,
    totalMoodDays
  }
}
