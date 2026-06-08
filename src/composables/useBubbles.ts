import { ref, computed, reactive } from 'vue'
import type { Bubble, TapRecord, SparkleParticle, RankingBubble, TimeRange } from '@/types'
import { useLocalStorage, getUserId } from './useLocalStorage'
import { useEmotions } from './useEmotions'
import { useMoodCalendar } from './useMoodCalendar'
import { useRooms } from './useRooms'

const userId = getUserId()
const { emotions, getEmotion } = useEmotions()
const { recordMood, recordMoodsFromBubbles } = useMoodCalendar()

const initialBubbles: Bubble[] = [
  { id: 'demo-1', emotionId: 'happy', text: '今天天气真好！', x: 15, y: 25, empathyCount: 3, createdAt: Date.now() - 3600000, ownerId: 'demo', floatOffset: 0, floatDuration: 8 },
  { id: 'demo-2', emotionId: 'angry', text: '又加班，烦死了', x: 75, y: 35, empathyCount: 7, createdAt: Date.now() - 7200000, ownerId: 'demo', floatOffset: 1, floatDuration: 10 },
  { id: 'demo-3', emotionId: 'lonely', text: '一个人吃饭', x: 45, y: 45, empathyCount: 12, createdAt: Date.now() - 10800000, ownerId: 'demo', floatOffset: 2, floatDuration: 12 },
  { id: 'demo-4', emotionId: 'happy', text: '收到礼物啦🎁', x: 25, y: 60, empathyCount: 5, createdAt: Date.now() - 1800000, ownerId: 'demo', floatOffset: 3, floatDuration: 7 },
  { id: 'demo-5', emotionId: 'lonely', text: '好想有人陪我说话', x: 65, y: 20, empathyCount: 8, createdAt: Date.now() - 5400000, ownerId: 'demo', floatOffset: 4, floatDuration: 9 },
  { id: 'demo-6', emotionId: 'angry', text: '地铁又晚点', x: 85, y: 65, empathyCount: 15, createdAt: Date.now() - 9000000, ownerId: 'demo', floatOffset: 5, floatDuration: 11 },
  { id: 'demo-7', emotionId: 'happy', text: '终于学会了那首歌！', x: 10, y: 15, empathyCount: 9, createdAt: Date.now() - 4500000, ownerId: 'demo', floatOffset: 6, floatDuration: 8 },
  { id: 'demo-8', emotionId: 'happy', text: '今天的咖啡特别香', x: 55, y: 75, empathyCount: 4, createdAt: Date.now() - 2700000, ownerId: 'demo', floatOffset: 7, floatDuration: 9 },
  { id: 'demo-9', emotionId: 'happy', text: '和老朋友通了电话', x: 35, y: 30, empathyCount: 11, createdAt: Date.now() - 6300000, ownerId: 'demo', floatOffset: 8, floatDuration: 10 },
  { id: 'demo-10', emotionId: 'angry', text: '外卖又送错了', x: 80, y: 50, empathyCount: 6, createdAt: Date.now() - 8100000, ownerId: 'demo', floatOffset: 9, floatDuration: 7 },
  { id: 'demo-11', emotionId: 'angry', text: '电脑又死机了', x: 20, y: 70, empathyCount: 8, createdAt: Date.now() - 3600000, ownerId: 'demo', floatOffset: 10, floatDuration: 11 },
  { id: 'demo-12', emotionId: 'angry', text: '邻居装修太吵了', x: 60, y: 40, empathyCount: 13, createdAt: Date.now() - 5400000, ownerId: 'demo', floatOffset: 0, floatDuration: 8 },
  { id: 'demo-13', emotionId: 'lonely', text: '朋友圈都是聚会，只有我在家', x: 5, y: 55, empathyCount: 16, createdAt: Date.now() - 7200000, ownerId: 'demo', floatOffset: 1, floatDuration: 12 },
  { id: 'demo-14', emotionId: 'lonely', text: '深夜了，还没睡着', x: 70, y: 15, empathyCount: 10, createdAt: Date.now() - 900000, ownerId: 'demo', floatOffset: 2, floatDuration: 9 },
  { id: 'demo-15', emotionId: 'lonely', text: '生日快乐，对自己说', x: 40, y: 65, empathyCount: 20, createdAt: Date.now() - 1800000, ownerId: 'demo', floatOffset: 3, floatDuration: 10 },
  { id: 'demo-16', emotionId: 'happy', text: '路边的花开得好美', x: 50, y: 10, empathyCount: 7, createdAt: Date.now() - 4500000, ownerId: 'demo', floatOffset: 4, floatDuration: 7 },
  { id: 'demo-17', emotionId: 'angry', text: '被人插队了，好气', x: 90, y: 30, empathyCount: 5, createdAt: Date.now() - 6300000, ownerId: 'demo', floatOffset: 5, floatDuration: 11 },
  { id: 'demo-18', emotionId: 'lonely', text: '看了场电影，却没人分享', x: 30, y: 50, empathyCount: 14, createdAt: Date.now() - 8100000, ownerId: 'demo', floatOffset: 6, floatDuration: 8 },
  { id: 'room-late-1', emotionId: 'lonely', text: '凌晨3点，还是睡不着', x: 20, y: 30, empathyCount: 8, createdAt: Date.now() - 1800000, ownerId: 'demo', floatOffset: 0, floatDuration: 8, roomId: 'late-night' },
  { id: 'room-late-2', emotionId: 'lonely', text: '失眠的夜晚，想起了很多事', x: 70, y: 40, empathyCount: 12, createdAt: Date.now() - 3600000, ownerId: 'demo', floatOffset: 1, floatDuration: 10, roomId: 'late-night' },
  { id: 'room-late-3', emotionId: 'lonely', text: '今晚的月亮好圆，但只有我一个人看', x: 40, y: 60, empathyCount: 15, createdAt: Date.now() - 5400000, ownerId: 'demo', floatOffset: 2, floatDuration: 9, roomId: 'late-night' },
  { id: 'room-late-4', emotionId: 'happy', text: '深夜写完了论文，感觉如释重负', x: 60, y: 25, empathyCount: 6, createdAt: Date.now() - 7200000, ownerId: 'demo', floatOffset: 3, floatDuration: 11, roomId: 'late-night' },
  { id: 'room-late-5', emotionId: 'lonely', text: '听着老歌曲，回忆涌上心头', x: 30, y: 70, empathyCount: 9, createdAt: Date.now() - 900000, ownerId: 'demo', floatOffset: 4, floatDuration: 8, roomId: 'late-night' },
  { id: 'room-work-1', emotionId: 'angry', text: '今天又被甲方改了第8版方案', x: 15, y: 35, empathyCount: 25, createdAt: Date.now() - 3600000, ownerId: 'demo', floatOffset: 0, floatDuration: 8, roomId: 'work-rant' },
  { id: 'room-work-2', emotionId: 'angry', text: '加班到10点，领导还在群里@我', x: 75, y: 45, empathyCount: 32, createdAt: Date.now() - 5400000, ownerId: 'demo', floatOffset: 1, floatDuration: 10, roomId: 'work-rant' },
  { id: 'room-work-3', emotionId: 'angry', text: '同事甩锅，我背了黑锅', x: 45, y: 25, empathyCount: 18, createdAt: Date.now() - 7200000, ownerId: 'demo', floatOffset: 2, floatDuration: 9, roomId: 'work-rant' },
  { id: 'room-work-4', emotionId: 'lonely', text: '工作3年了，工资一分没涨', x: 55, y: 65, empathyCount: 40, createdAt: Date.now() - 1800000, ownerId: 'demo', floatOffset: 3, floatDuration: 11, roomId: 'work-rant' },
  { id: 'room-work-5', emotionId: 'happy', text: '今天摸鱼了一天，爽', x: 25, y: 50, empathyCount: 45, createdAt: Date.now() - 900000, ownerId: 'demo', floatOffset: 4, floatDuration: 8, roomId: 'work-rant' },
  { id: 'room-love-1', emotionId: 'lonely', text: '暗恋的人今天好像不开心', x: 30, y: 30, empathyCount: 15, createdAt: Date.now() - 3600000, ownerId: 'demo', floatOffset: 0, floatDuration: 9, roomId: 'love-trouble' },
  { id: 'room-love-2', emotionId: 'lonely', text: '分手第7天，还是会想TA', x: 65, y: 50, empathyCount: 22, createdAt: Date.now() - 5400000, ownerId: 'demo', floatOffset: 1, floatDuration: 10, roomId: 'love-trouble' },
  { id: 'room-love-3', emotionId: 'happy', text: '今天和crush表白成功了！', x: 20, y: 60, empathyCount: 35, createdAt: Date.now() - 7200000, ownerId: 'demo', floatOffset: 2, floatDuration: 8, roomId: 'love-trouble' },
  { id: 'room-love-4', emotionId: 'angry', text: '对象又忘记纪念日了', x: 70, y: 25, empathyCount: 19, createdAt: Date.now() - 1800000, ownerId: 'demo', floatOffset: 3, floatDuration: 11, roomId: 'love-trouble' },
  { id: 'room-love-5', emotionId: 'lonely', text: '单身25年，还有救吗', x: 45, y: 45, empathyCount: 28, createdAt: Date.now() - 900000, ownerId: 'demo', floatOffset: 4, floatDuration: 9, roomId: 'love-trouble' },
  { id: 'room-study-1', emotionId: 'angry', text: '考研还有30天，我还没开始复习', x: 25, y: 35, empathyCount: 50, createdAt: Date.now() - 3600000, ownerId: 'demo', floatOffset: 0, floatDuration: 10, roomId: 'study-hard' },
  { id: 'room-study-2', emotionId: 'lonely', text: '论文改到第10版，导师还不满意', x: 60, y: 55, empathyCount: 33, createdAt: Date.now() - 5400000, ownerId: 'demo', floatOffset: 1, floatDuration: 8, roomId: 'study-hard' },
  { id: 'room-study-3', emotionId: 'happy', text: '终于过了！答辩通过啦', x: 40, y: 25, empathyCount: 60, createdAt: Date.now() - 7200000, ownerId: 'demo', floatOffset: 2, floatDuration: 9, roomId: 'study-hard' },
  { id: 'room-study-4', emotionId: 'angry', text: '考试周，图书馆抢不到位置', x: 70, y: 65, empathyCount: 22, createdAt: Date.now() - 1800000, ownerId: 'demo', floatOffset: 3, floatDuration: 11, roomId: 'study-hard' },
  { id: 'room-study-5', emotionId: 'lonely', text: '一个人在图书馆学到深夜', x: 15, y: 50, empathyCount: 18, createdAt: Date.now() - 900000, ownerId: 'demo', floatOffset: 4, floatDuration: 10, roomId: 'study-hard' },
  { id: 'room-family-1', emotionId: 'angry', text: '又被催婚了，烦死了', x: 35, y: 30, empathyCount: 28, createdAt: Date.now() - 3600000, ownerId: 'demo', floatOffset: 0, floatDuration: 9, roomId: 'family-issue' },
  { id: 'room-family-2', emotionId: 'lonely', text: '和父母代沟太深，无话可说', x: 65, y: 55, empathyCount: 20, createdAt: Date.now() - 5400000, ownerId: 'demo', floatOffset: 1, floatDuration: 8, roomId: 'family-issue' },
  { id: 'room-family-3', emotionId: 'happy', text: '今天和爸妈好好聊了很久', x: 25, y: 65, empathyCount: 12, createdAt: Date.now() - 7200000, ownerId: 'demo', floatOffset: 2, floatDuration: 10, roomId: 'family-issue' },
  { id: 'room-family-4', emotionId: 'angry', text: '亲戚又来问工资了', x: 55, y: 40, empathyCount: 35, createdAt: Date.now() - 1800000, ownerId: 'demo', floatOffset: 3, floatDuration: 11, roomId: 'family-issue' },
  { id: 'room-family-5', emotionId: 'lonely', text: '今年过年不想回家', x: 45, y: 25, empathyCount: 25, createdAt: Date.now() - 900000, ownerId: 'demo', floatOffset: 4, floatDuration: 9, roomId: 'family-issue' },
  { id: 'room-friend-1', emotionId: 'lonely', text: '好朋友结婚了，我们渐行渐远', x: 20, y: 40, empathyCount: 18, createdAt: Date.now() - 3600000, ownerId: 'demo', floatOffset: 0, floatDuration: 8, roomId: 'friendship' },
  { id: 'room-friend-2', emotionId: 'happy', text: '和十年的朋友，终于见面了！', x: 60, y: 30, empathyCount: 25, createdAt: Date.now() - 5400000, ownerId: 'demo', floatOffset: 1, floatDuration: 10, roomId: 'friendship' },
  { id: 'room-friend-3', emotionId: 'lonely', text: '朋友聚会，我却融不进去', x: 40, y: 60, empathyCount: 15, createdAt: Date.now() - 7200000, ownerId: 'demo', floatOffset: 2, floatDuration: 9, roomId: 'friendship' },
  { id: 'room-friend-4', emotionId: 'angry', text: '被最好的朋友背叛了', x: 75, y: 50, empathyCount: 30, createdAt: Date.now() - 1800000, ownerId: 'demo', floatOffset: 3, floatDuration: 11, roomId: 'friendship' },
  { id: 'room-friend-5', emotionId: 'happy', text: '感谢有你们这些朋友真好', x: 30, y: 25, empathyCount: 22, createdAt: Date.now() - 900000, ownerId: 'demo', floatOffset: 4, floatDuration: 8, roomId: 'friendship' },
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

const initializeMoodCalendar = () => {
  const bubblesToRecord = bubbles.filter(b =>
    b.ownerId === userId || b.ownerId === 'demo'
  )
  recordMoodsFromBubbles(bubblesToRecord)
}

initializeMoodCalendar()

export function useBubbles() {
  const myBubbles = computed(() =>
    bubbles.filter(b => myBubbleIds.includes(b.id))
  )

  const myBubblesChronological = computed(() =>
    [...myBubbles.value].sort((a, b) => b.createdAt - a.createdAt)
  )

  const myBubblesGroupedByDate = computed(() => {
    const groups: Record<string, {
      dateKey: string
      dateLabel: string
      bubbles: Bubble[]
      totalEmpathy: number
    }> = {}

    myBubblesChronological.value.forEach(bubble => {
      const date = new Date(bubble.createdAt)
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const dateKey = `${year}-${month}-${day}`

      const today = new Date()
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)

      let dateLabel = `${year}年${parseInt(month)}月${parseInt(day)}日`
      if (dateKey === `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`) {
        dateLabel = '今天'
      } else if (dateKey === `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`) {
        dateLabel = '昨天'
      }

      if (!groups[dateKey]) {
        groups[dateKey] = {
          dateKey,
          dateLabel,
          bubbles: [],
          totalEmpathy: 0
        }
      }
      groups[dateKey].bubbles.push(bubble)
      groups[dateKey].totalEmpathy += bubble.empathyCount
    })

    return Object.values(groups)
  })

  const myBubblesStats = computed(() => {
    const total = myBubbles.value.length
    const totalEmpathy = myBubbles.value.reduce((sum, b) => sum + b.empathyCount, 0)
    const earliestDate = total > 0 ? Math.min(...myBubbles.value.map(b => b.createdAt)) : Date.now()
    const daysSinceFirst = Math.max(1, Math.ceil((Date.now() - earliestDate) / 86400000))

    return {
      totalBubbles: total,
      totalEmpathy,
      avgEmpathyPerBubble: total > 0 ? Math.round(totalEmpathy / total) : 0,
      daysSinceFirst,
      avgBubblesPerDay: Math.round((total / daysSinceFirst) * 10) / 10
    }
  })

  const emotionStats = computed(() => {
    const stats: Record<string, { count: number; empathyCount: number; bubbles: Bubble[] }> = {}

    emotions.value.forEach(emotion => {
      stats[emotion.id] = {
        count: 0,
        empathyCount: 0,
        bubbles: []
      }
    })

    bubbles.forEach(bubble => {
      if (!stats[bubble.emotionId]) {
        stats[bubble.emotionId] = {
          count: 0,
          empathyCount: 0,
          bubbles: []
        }
      }
      stats[bubble.emotionId].count++
      stats[bubble.emotionId].empathyCount += bubble.empathyCount
      stats[bubble.emotionId].bubbles.push(bubble)
    })

    return stats
  })

  const tonightEmotionStats = computed(() => {
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
    const tonightStart = todayStart + 18 * 60 * 60 * 1000

    const stats: Record<string, { count: number; empathyCount: number; bubbles: Bubble[] }> = {}

    emotions.value.forEach(emotion => {
      stats[emotion.id] = {
        count: 0,
        empathyCount: 0,
        bubbles: []
      }
    })

    bubbles.forEach(bubble => {
      if (bubble.createdAt >= tonightStart) {
        if (!stats[bubble.emotionId]) {
          stats[bubble.emotionId] = {
            count: 0,
            empathyCount: 0,
            bubbles: []
          }
        }
        stats[bubble.emotionId].count++
        stats[bubble.emotionId].empathyCount += bubble.empathyCount
        stats[bubble.emotionId].bubbles.push(bubble)
      }
    })

    return stats
  })

  const emotionPercentages = computed(() => {
    const total = bubbles.length
    const percentages: Record<string, number> = {}

    emotions.value.forEach(emotion => {
      const count = emotionStats.value[emotion.id]?.count || 0
      percentages[emotion.id] = total > 0 ? Math.round((count / total) * 100) : 0
    })

    return percentages
  })

  const tonightEmotionPercentages = computed(() => {
    const tonightBubbles = bubbles.filter(b => {
      const now = new Date()
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
      const tonightStart = todayStart + 18 * 60 * 60 * 1000
      return b.createdAt >= tonightStart
    })
    const total = tonightBubbles.length
    const percentages: Record<string, number> = {}

    emotions.value.forEach(emotion => {
      const count = tonightEmotionStats.value[emotion.id]?.count || 0
      percentages[emotion.id] = total > 0 ? Math.round((count / total) * 100) : 0
    })

    return percentages
  })

  const dominantEmotion = computed(() => {
    let maxCount = 0
    let dominant: string | null = null

    emotions.value.forEach(emotion => {
      const count = emotionStats.value[emotion.id]?.count || 0
      if (count > maxCount) {
        maxCount = count
        dominant = emotion.id
      }
    })

    return dominant
  })

  const tonightDominantEmotion = computed(() => {
    let maxCount = 0
    let dominant: string | null = null

    emotions.value.forEach(emotion => {
      const count = tonightEmotionStats.value[emotion.id]?.count || 0
      if (count > maxCount) {
        maxCount = count
        dominant = emotion.id
      }
    })

    return dominant
  })

  const myTapRecords = computed(() =>
    tapRecords
      .filter(r => myBubbleIds.includes(r.bubbleId))
      .sort((a, b) => b.timestamp - a.timestamp)
  )

  const { currentRoomId, updateRoomBubbleCount } = useRooms()

  const bubblesWithoutRoom = computed(() =>
    bubbles.filter(b => !b.roomId)
  )

  const bubblesByRoom = computed(() => {
    const groups: Record<string, Bubble[]> = {}
    bubbles.forEach(bubble => {
      if (bubble.roomId) {
        if (!groups[bubble.roomId]) {
          groups[bubble.roomId] = []
        }
        groups[bubble.roomId].push(bubble)
      }
    })
    return groups
  })

  const getBubblesForRoom = (roomId: string) => {
    return bubbles.filter(b => b.roomId === roomId)
  }

  const addBubble = (emotionId: string, text?: string, roomId?: string) => {
    const targetRoomId = roomId || currentRoomId.value || undefined
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
      floatDuration: 6 + Math.random() * 8,
      roomId: targetRoomId
    }
    bubbles.push(newBubble)
    myBubbleIds.push(newBubble.id)
    recordMood(newBubble)
    if (targetRoomId) {
      updateRoomBubbleCount(targetRoomId, 1)
    }
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

  const getTimeRangeStart = (range: TimeRange): number => {
    const now = new Date()
    switch (range) {
      case 'today':
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        return today.getTime()
      case 'week':
        const dayOfWeek = now.getDay() || 7
        const monday = new Date(now)
        monday.setDate(now.getDate() - dayOfWeek + 1)
        monday.setHours(0, 0, 0, 0)
        return monday.getTime()
      case 'all':
      default:
        return 0
    }
  }

  const getBubblesWithStats = (range: TimeRange) => {
    const startTime = getTimeRangeStart(range)
    const now = Date.now()

    const periodTapCounts: Record<string, number> = {}
    tapRecords.forEach(record => {
      if (record.timestamp >= startTime) {
        periodTapCounts[record.bubbleId] = (periodTapCounts[record.bubbleId] || 0) + record.count
      }
    })

    return bubbles.map(bubble => {
      const periodCount = periodTapCounts[bubble.id] || 0
      const ageInHours = Math.max((now - Math.max(bubble.createdAt, startTime)) / 3600000, 0.01)
      const growthRate = periodCount / ageInHours

      return {
        ...bubble,
        growthRate,
        periodEmpathyCount: periodCount
      } as RankingBubble
    })
  }

  const getTopEmpathy = (range: TimeRange, limit = 10) => {
    return getBubblesWithStats(range)
      .sort((a, b) => b.periodEmpathyCount - a.periodEmpathyCount)
      .filter(b => b.periodEmpathyCount > 0)
      .slice(0, limit)
  }

  const getFastestGrowing = (range: TimeRange, limit = 10) => {
    return getBubblesWithStats(range)
      .sort((a, b) => b.growthRate - a.growthRate)
      .filter(b => b.growthRate > 0)
      .slice(0, limit)
  }

  return {
    bubbles,
    myBubbles,
    myBubblesChronological,
    myBubblesGroupedByDate,
    myBubblesStats,
    myTapRecords,
    sparkleParticles,
    emotionStats,
    tonightEmotionStats,
    emotionPercentages,
    tonightEmotionPercentages,
    dominantEmotion,
    tonightDominantEmotion,
    bubblesWithoutRoom,
    bubblesByRoom,
    getBubblesForRoom,
    addBubble,
    addEmpathy,
    addSparkleParticles,
    getTopEmpathy,
    getFastestGrowing,
    userId
  }
}
