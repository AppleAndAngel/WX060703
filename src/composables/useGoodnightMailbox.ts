import { computed, reactive } from 'vue'
import type { NightMessage } from '@/types'
import { useLocalStorage, getUserId } from './useLocalStorage'
import { useEmotions } from './useEmotions'
import { useBubbles } from './useBubbles'

const userId = getUserId()
const { getEmotion } = useEmotions()
const { addBubble } = useBubbles()

const storedMessages = useLocalStorage<NightMessage[]>('goodnight-messages', [])
const messages = reactive<NightMessage[]>([...storedMessages.value])

const syncToStorage = () => {
  storedMessages.value = [...messages]
}

const getTomorrowStart = (): number => {
  const now = new Date()
  const tomorrow = new Date(now)
  tomorrow.setDate(now.getDate() + 1)
  tomorrow.setHours(0, 0, 0, 0)
  return tomorrow.getTime()
}

const getTodayStart = (): number => {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return today.getTime()
}

export function useGoodnightMailbox() {
  const availableMessages = computed(() =>
    messages
      .filter(m => m.ownerId === userId && m.availableAt <= Date.now())
      .sort((a, b) => a.createdAt - b.createdAt)
  )

  const pendingMessages = computed(() =>
    messages
      .filter(m => m.ownerId === userId && m.availableAt > Date.now())
      .sort((a, b) => a.createdAt - b.createdAt)
  )

  const unreadCount = computed(() =>
    messages.filter(m => m.ownerId === userId && m.availableAt <= Date.now() && !m.isRead).length
  )

  const pendingCount = computed(() => pendingMessages.value.length)

  const todayMessages = computed(() => {
    const todayStart = getTodayStart()
    return availableMessages.value.filter(m => m.createdAt >= todayStart - 86400000 && m.createdAt < todayStart)
  })

  const addNightMessage = (text: string, emotionId: string, createBubble = true): NightMessage => {
    const bubble = createBubble ? addBubble(emotionId, text) : null

    const message: NightMessage = {
      id: crypto.randomUUID(),
      text,
      emotionId,
      bubbleId: bubble?.id,
      createdAt: Date.now(),
      availableAt: getTomorrowStart(),
      isRead: false,
      ownerId: userId
    }

    messages.push(message)
    syncToStorage()
    return message
  }

  const markAsRead = (messageId: string) => {
    const message = messages.find(m => m.id === messageId)
    if (message && message.ownerId === userId) {
      message.isRead = true
      syncToStorage()
    }
  }

  const markAllAsRead = () => {
    messages.forEach(m => {
      if (m.ownerId === userId && m.availableAt <= Date.now()) {
        m.isRead = true
      }
    })
    syncToStorage()
  }

  const getMessageEmotion = (message: NightMessage) => {
    return getEmotion(message.emotionId)
  }

  const formatTimeAgo = (timestamp: number): string => {
    const now = Date.now()
    const diff = now - timestamp
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return '刚刚'
    if (minutes < 60) return `${minutes}分钟前`
    if (hours < 24) return `${hours}小时前`
    if (days < 7) return `${days}天前`

    const date = new Date(timestamp)
    return `${date.getMonth() + 1}/${date.getDate()}`
  }

  const formatAvailableTime = (timestamp: number): string => {
    const now = Date.now()
    const diff = timestamp - now
    const hours = Math.floor(diff / 3600000)
    const minutes = Math.floor((diff % 3600000) / 60000)

    if (diff <= 0) return '已解锁'
    if (hours < 1) return `${minutes}分钟后`
    return `${hours}小时${minutes}分钟后`
  }

  return {
    messages,
    availableMessages,
    pendingMessages,
    todayMessages,
    unreadCount,
    pendingCount,
    addNightMessage,
    markAsRead,
    markAllAsRead,
    getMessageEmotion,
    formatTimeAgo,
    formatAvailableTime
  }
}
