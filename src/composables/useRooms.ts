import { ref, computed } from 'vue'
import type { Room } from '@/types'
import { useLocalStorage } from './useLocalStorage'

const defaultRooms: Room[] = [
  {
    id: 'late-night',
    name: '深夜emo',
    description: '失眠的夜晚，我们一起度过',
    icon: '🌙',
    color: { from: '#6366f1', to: '#8b5cf6' },
    onlineCount: 42,
    bubbleCount: 128
  },
  {
    id: 'work-rant',
    name: '打工吐槽',
    description: '打工人的树洞，今天又被谁气到了',
    icon: '💼',
    color: { from: '#f59e0b', to: '#ef4444' },
    onlineCount: 86,
    bubbleCount: 256
  },
  {
    id: 'love-trouble',
    name: '恋爱烦恼',
    description: '关于爱情的困惑，我们一起聊聊',
    icon: '💕',
    color: { from: '#ec4899', to: '#f43f5e' },
    onlineCount: 64,
    bubbleCount: 192
  },
  {
    id: 'study-hard',
    name: '学业压力',
    description: '考试、论文、考研...我们一起加油',
    icon: '📚',
    color: { from: '#10b981', to: '#06b6d4' },
    onlineCount: 38,
    bubbleCount: 96
  },
  {
    id: 'family-issue',
    name: '家庭琐事',
    description: '家里那些事，说出来会好受些',
    icon: '🏠',
    color: { from: '#8b5cf6', to: '#ec4899' },
    onlineCount: 29,
    bubbleCount: 72
  },
  {
    id: 'friendship',
    name: '友情岁月',
    description: '朋友的故事，温暖你我',
    icon: '🤝',
    color: { from: '#06b6d4', to: '#6366f1' },
    onlineCount: 21,
    bubbleCount: 54
  }
]

const rooms = ref<Room[]>([...defaultRooms])
const currentRoomId = useLocalStorage<string | null>('current-room-id', null)

export function useRooms() {
  const currentRoom = computed(() => {
    if (!currentRoomId.value) return null
    return rooms.value.find(r => r.id === currentRoomId.value) || null
  })

  const isInRoom = computed(() => currentRoomId.value !== null)

  const getRoom = (roomId: string): Room | undefined => {
    return rooms.value.find(r => r.id === roomId)
  }

  const enterRoom = (roomId: string) => {
    currentRoomId.value = roomId
    const room = rooms.value.find(r => r.id === roomId)
    if (room) {
      room.onlineCount++
    }
  }

  const leaveRoom = () => {
    const roomId = currentRoomId.value
    if (roomId) {
      const room = rooms.value.find(r => r.id === roomId)
      if (room) {
        room.onlineCount = Math.max(0, room.onlineCount - 1)
      }
    }
    currentRoomId.value = null
  }

  const updateRoomBubbleCount = (roomId: string, delta: number) => {
    const room = rooms.value.find(r => r.id === roomId)
    if (room) {
      room.bubbleCount = Math.max(0, room.bubbleCount + delta)
    }
  }

  return {
    rooms,
    currentRoom,
    currentRoomId,
    isInRoom,
    getRoom,
    enterRoom,
    leaveRoom,
    updateRoomBubbleCount
  }
}
