import { computed } from 'vue'
import type { Bubble } from '@/types'
import { useBubbles } from './useBubbles'
import { useEmotions } from './useEmotions'

interface DayBill {
  dayIndex: number
  dayLabel: string
  dateKey: string
  bubbles: Bubble[]
  totalEmpathy: number
  totalTextLength: number
  emotionCounts: Record<string, number>
}

interface EmotionBill {
  emotionId: string
  count: number
  percentage: number
  totalEmpathy: number
}

interface TextLengthStat {
  total: number
  avg: number
  longest: number
  shortest: number
  distribution: {
    short: number
    medium: number
    long: number
  }
}

interface EmpathyTrend {
  dayIndex: number
  dayLabel: string
  total: number
  growth: number
}

const WEEK_LABELS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']

const getWeekStart = (): number => {
  const now = new Date()
  const dayOfWeek = now.getDay() || 7
  const monday = new Date(now)
  monday.setDate(now.getDate() - dayOfWeek + 1)
  monday.setHours(0, 0, 0, 0)
  return monday.getTime()
}

const getWeekEnd = (): number => {
  const weekStart = getWeekStart()
  return weekStart + 7 * 24 * 60 * 60 * 1000
}

const getDateKey = (timestamp: number): string => {
  const date = new Date(timestamp)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function useWeeklyMoodBill() {
  const { myBubbles, userId } = useBubbles()
  const { emotions, getEmotion } = useEmotions()

  const weekStart = getWeekStart()
  const weekEnd = getWeekEnd()

  const weeklyBubbles = computed(() =>
    myBubbles.value.filter(
      b => b.createdAt >= weekStart && b.createdAt < weekEnd && b.ownerId === userId
    )
  )

  const totalBubbles = computed(() => weeklyBubbles.value.length)

  const totalEmpathy = computed(() =>
    weeklyBubbles.value.reduce((sum, b) => sum + b.empathyCount, 0)
  )

  const dayBills = computed<DayBill[]>(() => {
    const days: DayBill[] = []

    for (let i = 0; i < 7; i++) {
      const dayStart = weekStart + i * 24 * 60 * 60 * 1000
      const dayEnd = dayStart + 24 * 60 * 60 * 1000

      const dayBubbles = weeklyBubbles.value.filter(
        b => b.createdAt >= dayStart && b.createdAt < dayEnd
      )

      const emotionCounts: Record<string, number> = {}
      emotions.value.forEach(e => {
        emotionCounts[e.id] = 0
      })
      dayBubbles.forEach(b => {
        emotionCounts[b.emotionId] = (emotionCounts[b.emotionId] || 0) + 1
      })

      days.push({
        dayIndex: i,
        dayLabel: WEEK_LABELS[i],
        dateKey: getDateKey(dayStart),
        bubbles: dayBubbles,
        totalEmpathy: dayBubbles.reduce((sum, b) => sum + b.empathyCount, 0),
        totalTextLength: dayBubbles.reduce((sum, b) => sum + (b.text?.length || 0), 0),
        emotionCounts
      })
    }

    return days
  })

  const emotionBills = computed<EmotionBill[]>(() => {
    const stats: Record<string, { count: number; totalEmpathy: number }> = {}

    emotions.value.forEach(e => {
      stats[e.id] = { count: 0, totalEmpathy: 0 }
    })

    weeklyBubbles.value.forEach(b => {
      if (!stats[b.emotionId]) {
        stats[b.emotionId] = { count: 0, totalEmpathy: 0 }
      }
      stats[b.emotionId].count++
      stats[b.emotionId].totalEmpathy += b.empathyCount
    })

    return emotions.value
      .map(e => ({
        emotionId: e.id,
        count: stats[e.id]?.count || 0,
        percentage: totalBubbles.value > 0
          ? Math.round(((stats[e.id]?.count || 0) / totalBubbles.value) * 100)
          : 0,
        totalEmpathy: stats[e.id]?.totalEmpathy || 0
      }))
      .filter(e => e.count > 0)
      .sort((a, b) => b.count - a.count)
  })

  const dominantEmotion = computed(() => {
    if (emotionBills.value.length === 0) return null
    return emotionBills.value[0]
  })

  const textLengthStat = computed<TextLengthStat>(() => {
    const lengths = weeklyBubbles.value
      .map(b => b.text?.length || 0)
      .filter(l => l > 0)

    if (lengths.length === 0) {
      return {
        total: 0,
        avg: 0,
        longest: 0,
        shortest: 0,
        distribution: { short: 0, medium: 0, long: 0 }
      }
    }

    const total = lengths.reduce((sum, l) => sum + l, 0)
    const avg = Math.round(total / lengths.length)
    const longest = Math.max(...lengths)
    const shortest = Math.min(...lengths)

    const distribution = {
      short: lengths.filter(l => l <= 10).length,
      medium: lengths.filter(l => l > 10 && l <= 30).length,
      long: lengths.filter(l => l > 30).length
    }

    return { total, avg, longest, shortest, distribution }
  })

  const empathyTrend = computed<EmpathyTrend[]>(() => {
    return dayBills.value.map((day, index) => {
      const prevTotal = index > 0 ? dayBills.value[index - 1].totalEmpathy : 0
      const growth = day.totalEmpathy - prevTotal
      return {
        dayIndex: day.dayIndex,
        dayLabel: day.dayLabel,
        total: day.totalEmpathy,
        growth
      }
    })
  })

  const mostEmpathicBubble = computed(() => {
    if (weeklyBubbles.value.length === 0) return null
    return [...weeklyBubbles.value].sort((a, b) => b.empathyCount - a.empathyCount)[0]
  })

  const longestTextBubble = computed(() => {
    const withText = weeklyBubbles.value.filter(b => b.text && b.text.length > 0)
    if (withText.length === 0) return null
    return [...withText].sort((a, b) => (b.text?.length || 0) - (a.text?.length || 0))[0]
  })

  const hasData = computed(() => totalBubbles.value > 0)

  return {
    weeklyBubbles,
    totalBubbles,
    totalEmpathy,
    dayBills,
    emotionBills,
    dominantEmotion,
    textLengthStat,
    empathyTrend,
    mostEmpathicBubble,
    longestTextBubble,
    hasData,
    getEmotion,
    emotions
  }
}
