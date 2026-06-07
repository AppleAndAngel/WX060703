import { computed, reactive } from 'vue'
import type { DrawerBubble } from '@/types'
import { useLocalStorage, getUserId } from './useLocalStorage'
import { useBubbles } from './useBubbles'

const userId = getUserId()
const { addBubble } = useBubbles()

const storedDrawerBubbles = useLocalStorage<DrawerBubble[]>('mood-drawer', [])
const drawerBubbles = reactive<DrawerBubble[]>([...storedDrawerBubbles.value])

const syncToStorage = () => {
  storedDrawerBubbles.value = [...drawerBubbles]
}

export function useMoodDrawer() {
  const drawerCount = computed(() => drawerBubbles.length)

  const hasItems = computed(() => drawerBubbles.length > 0)

  const drawerBubblesChronological = computed(() =>
    [...drawerBubbles].sort((a, b) => b.storedAt - a.storedAt)
  )

  const saveToDrawer = (emotionId: string, text?: string) => {
    const newDrawerBubble: DrawerBubble = {
      id: crypto.randomUUID(),
      emotionId,
      text,
      createdAt: Date.now(),
      ownerId: userId,
      storedAt: Date.now()
    }
    drawerBubbles.unshift(newDrawerBubble)
    syncToStorage()
    return newDrawerBubble
  }

  const publishToWall = (drawerBubbleId: string) => {
    const index = drawerBubbles.findIndex(b => b.id === drawerBubbleId)
    if (index === -1) return null

    const drawerBubble = drawerBubbles[index]
    const newBubble = addBubble(drawerBubble.emotionId, drawerBubble.text)

    drawerBubbles.splice(index, 1)
    syncToStorage()

    return newBubble
  }

  const deleteFromDrawer = (drawerBubbleId: string) => {
    const index = drawerBubbles.findIndex(b => b.id === drawerBubbleId)
    if (index === -1) return false

    drawerBubbles.splice(index, 1)
    syncToStorage()
    return true
  }

  const clearDrawer = () => {
    drawerBubbles.length = 0
    syncToStorage()
  }

  return {
    drawerBubbles,
    drawerCount,
    hasItems,
    drawerBubblesChronological,
    saveToDrawer,
    publishToWall,
    deleteFromDrawer,
    clearDrawer,
    userId
  }
}
