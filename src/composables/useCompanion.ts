import { ref, computed, reactive } from 'vue'
import type { Bubble, CompanionRecord } from '@/types'
import { useLocalStorage, getUserId } from './useLocalStorage'
import { useEmotions } from './useEmotions'

const userId = getUserId()
const { getEmotion } = useEmotions()

const initialCompanionRecords: CompanionRecord[] = [
  {
    id: 'demo-companion-1',
    bubbleId: 'demo-received-1',
    bubbleEmoji: '😔',
    bubbleText: '今天工作很不顺心，感觉自己什么都做不好...',
    bubbleEmotionId: 'lonely',
    responseText: '你已经很棒了，明天会更好的！',
    timestamp: Date.now() - 7200000,
    direction: 'received',
    isRead: false
  }
]

const storedCompanionRecords = useLocalStorage<CompanionRecord[]>('companion-records', initialCompanionRecords)
const storedViewedBubbleIds = useLocalStorage<string[]>('companion-viewed-bubbles', [])

const companionRecords = reactive<CompanionRecord[]>([...storedCompanionRecords.value])
const viewedBubbleIds = reactive<string[]>([...storedViewedBubbleIds.value])
const currentBubble = ref<Bubble | null>(null)
const isLoading = ref(false)

const syncToStorage = () => {
  storedCompanionRecords.value = [...companionRecords]
  storedViewedBubbleIds.value = [...viewedBubbleIds]
}

const warmResponses = [
  '你不是一个人，我陪着你 💛',
  '一切都会好起来的，相信自己 ✨',
  '抱抱你，今天也辛苦了 🤗',
  '你的感受是被理解的 🌙',
  '谢谢你愿意分享，我在听 💭',
  '风雨过后会有彩虹的 🌈',
  '你已经做得很好了 🌟',
  '今晚好好休息，明天又是新的一天 🌃',
  '你的存在本身就很有意义 💫',
  '我也有过类似的经历，你不是孤单的 🤝',
]

export function useCompanion() {
  const receivedRecords = computed(() =>
    companionRecords
      .filter(r => r.direction === 'received')
      .sort((a, b) => b.timestamp - a.timestamp)
  )

  const sentRecords = computed(() =>
    companionRecords
      .filter(r => r.direction === 'sent')
      .sort((a, b) => b.timestamp - a.timestamp)
  )

  const unreadCount = computed(() =>
    companionRecords.filter(r => r.direction === 'received' && !r.isRead).length
  )

  const getRandomBubble = (allBubbles: Bubble[]): Bubble | null => {
    const strangerBubbles = allBubbles.filter(b =>
      b.ownerId !== userId &&
      b.ownerId !== 'demo' &&
      b.text &&
      b.text.trim().length > 0 &&
      !viewedBubbleIds.includes(b.id)
    )

    if (strangerBubbles.length === 0) {
      const demoBubbles = allBubbles.filter(b =>
        b.ownerId === 'demo' &&
        b.text &&
        b.text.trim().length > 0 &&
        !viewedBubbleIds.includes(b.id)
      )

      if (demoBubbles.length === 0) {
        viewedBubbleIds.length = 0
        syncToStorage()
        return getRandomBubble(allBubbles)
      }

      const randomIndex = Math.floor(Math.random() * demoBubbles.length)
      return demoBubbles[randomIndex]
    }

    const randomIndex = Math.floor(Math.random() * strangerBubbles.length)
    return strangerBubbles[randomIndex]
  }

  const startCompanion = (allBubbles: Bubble[]): Bubble | null => {
    isLoading.value = true

    setTimeout(() => {
      const bubble = getRandomBubble(allBubbles)
      if (bubble) {
        viewedBubbleIds.push(bubble.id)
        syncToStorage()
      }
      currentBubble.value = bubble
      isLoading.value = false
    }, 1200)

    return currentBubble.value
  }

  const getRandomWarmResponse = (): string => {
    return warmResponses[Math.floor(Math.random() * warmResponses.length)]
  }

  const sendResponse = (bubble: Bubble, responseText: string, allBubbles: Bubble[]) => {
    const emotion = getEmotion(bubble.emotionId)

    const sentRecord: CompanionRecord = {
      id: crypto.randomUUID(),
      bubbleId: bubble.id,
      bubbleEmoji: emotion?.emoji || '💭',
      bubbleText: bubble.text || '',
      bubbleEmotionId: bubble.emotionId,
      responseText: responseText.trim(),
      timestamp: Date.now(),
      direction: 'sent',
      isRead: true
    }
    companionRecords.unshift(sentRecord)

    if (bubble.ownerId !== userId && bubble.ownerId !== 'demo') {
      const receivedRecord: CompanionRecord = {
        id: crypto.randomUUID(),
        bubbleId: bubble.id,
        bubbleEmoji: emotion?.emoji || '💭',
        bubbleText: bubble.text || '',
        bubbleEmotionId: bubble.emotionId,
        responseText: responseText.trim(),
        timestamp: Date.now(),
        direction: 'received',
        isRead: false
      }
      companionRecords.unshift(receivedRecord)
    } else {
      if (Math.random() < 0.7) {
        const myBubbles = allBubbles.filter(b => b.ownerId === userId && b.text && b.text.trim().length > 0)
        if (myBubbles.length > 0) {
          const randomMyBubble = myBubbles[Math.floor(Math.random() * myBubbles.length)]
          const myEmotion = getEmotion(randomMyBubble.emotionId)

          const receivedRecord: CompanionRecord = {
            id: crypto.randomUUID(),
            bubbleId: randomMyBubble.id,
            bubbleEmoji: myEmotion?.emoji || '💭',
            bubbleText: randomMyBubble.text || '',
            bubbleEmotionId: randomMyBubble.emotionId,
            responseText: getRandomWarmResponse(),
            timestamp: Date.now() + 5000,
            direction: 'received',
            isRead: false
          }
          companionRecords.unshift(receivedRecord)
        }
      }
    }

    syncToStorage()
    currentBubble.value = null
  }

  const skipBubble = () => {
    currentBubble.value = null
  }

  const markAsRead = (recordId: string) => {
    const record = companionRecords.find(r => r.id === recordId)
    if (record) {
      record.isRead = true
      syncToStorage()
    }
  }

  const markAllAsRead = () => {
    companionRecords.forEach(r => {
      if (r.direction === 'received') {
        r.isRead = true
      }
    })
    syncToStorage()
  }

  const formatTimeAgo = (timestamp: number): string => {
    const diff = Date.now() - timestamp
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(hours / 24)

    if (minutes < 1) return '刚刚'
    if (minutes < 60) return `${minutes} 分钟前`
    if (hours < 24) return `${hours} 小时前`
    return `${days} 天前`
  }

  const setCurrentBubble = (bubble: Bubble | null) => {
    currentBubble.value = bubble
  }

  return {
    currentBubble,
    isLoading,
    receivedRecords,
    sentRecords,
    unreadCount,
    warmResponses,
    startCompanion,
    getRandomWarmResponse,
    sendResponse,
    skipBubble,
    markAsRead,
    markAllAsRead,
    formatTimeAgo,
    setCurrentBubble
  }
}
