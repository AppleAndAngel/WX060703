import { ref, computed, reactive } from 'vue'
import type { MoodCollage, CollageBubble, Bubble } from '@/types'
import { useLocalStorage } from './useLocalStorage'
import { useEmotions } from './useEmotions'

const storedCollages = useLocalStorage<MoodCollage[]>('mood-collages', [])

const collages = reactive<MoodCollage[]>([...storedCollages.value])

const syncToStorage = () => {
  storedCollages.value = [...collages]
}

export function useMoodCollage() {
  const { getEmotion } = useEmotions()

  const sortedCollages = computed(() =>
    [...collages].sort((a, b) => b.updatedAt - a.updatedAt)
  )

  const collageCount = computed(() => collages.length)

  const favoriteCollages = computed(() =>
    sortedCollages.value.filter(c => c.isFavorite)
  )

  const createCollage = (title: string, description?: string): MoodCollage => {
    const newCollage: MoodCollage = {
      id: crypto.randomUUID(),
      title,
      description,
      bubbles: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isFavorite: false
    }
    collages.unshift(newCollage)
    syncToStorage()
    return newCollage
  }

  const getCollage = (id: string): MoodCollage | undefined => {
    return collages.find(c => c.id === id)
  }

  const updateCollage = (id: string, updates: Partial<Omit<MoodCollage, 'id' | 'createdAt'>>) => {
    const index = collages.findIndex(c => c.id === id)
    if (index !== -1) {
      collages[index] = {
        ...collages[index],
        ...updates,
        updatedAt: Date.now()
      }
      syncToStorage()
      return collages[index]
    }
    return null
  }

  const deleteCollage = (id: string) => {
    const index = collages.findIndex(c => c.id === id)
    if (index !== -1) {
      collages.splice(index, 1)
      syncToStorage()
      return true
    }
    return false
  }

  const toggleFavorite = (id: string) => {
    const collage = getCollage(id)
    if (collage) {
      return updateCollage(id, { isFavorite: !collage.isFavorite })
    }
    return null
  }

  const addBubbleToCollage = (collageId: string, bubble: Bubble): CollageBubble | null => {
    const collage = getCollage(collageId)
    if (!collage) return null

    const emotion = getEmotion(bubble.emotionId)
    const collageBubble: CollageBubble = {
      id: crypto.randomUUID(),
      bubbleId: bubble.id,
      emotionId: bubble.emotionId,
      text: bubble.text,
      emoji: emotion?.emoji || '💭',
      x: 20 + Math.random() * 60,
      y: 20 + Math.random() * 60,
      rotation: (Math.random() - 0.5) * 20,
      scale: 0.8 + Math.random() * 0.4,
      addedAt: Date.now()
    }

    collage.bubbles.push(collageBubble)
    updateCollage(collageId, {})
    return collageBubble
  }

  const removeBubbleFromCollage = (collageId: string, collageBubbleId: string) => {
    const collage = getCollage(collageId)
    if (!collage) return false

    const index = collage.bubbles.findIndex(b => b.id === collageBubbleId)
    if (index !== -1) {
      collage.bubbles.splice(index, 1)
      updateCollage(collageId, {})
      return true
    }
    return false
  }

  const updateCollageBubble = (
    collageId: string,
    collageBubbleId: string,
    updates: Partial<Omit<CollageBubble, 'id' | 'bubbleId' | 'addedAt'>>
  ) => {
    const collage = getCollage(collageId)
    if (!collage) return null

    const bubble = collage.bubbles.find(b => b.id === collageBubbleId)
    if (bubble) {
      Object.assign(bubble, updates)
      updateCollage(collageId, {})
      return bubble
    }
    return null
  }

  const getCollageEmotionSummary = (collage: MoodCollage) => {
    const emotionCounts: Record<string, number> = {}
    collage.bubbles.forEach(b => {
      emotionCounts[b.emotionId] = (emotionCounts[b.emotionId] || 0) + 1
    })
    return emotionCounts
  }

  const formatCollageDate = (timestamp: number) => {
    const date = new Date(timestamp)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')

    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    const dateKey = `${year}-${month}-${day}`
    const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    const yesterdayKey = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`

    if (dateKey === todayKey) {
      return `今天 ${hours}:${minutes}`
    } else if (dateKey === yesterdayKey) {
      return `昨天 ${hours}:${minutes}`
    }
    return `${year}年${parseInt(month)}月${parseInt(day)}日 ${hours}:${minutes}`
  }

  return {
    collages,
    sortedCollages,
    collageCount,
    favoriteCollages,
    createCollage,
    getCollage,
    updateCollage,
    deleteCollage,
    toggleFavorite,
    addBubbleToCollage,
    removeBubbleFromCollage,
    updateCollageBubble,
    getCollageEmotionSummary,
    formatCollageDate
  }
}
