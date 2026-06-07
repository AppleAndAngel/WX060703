import { ref, computed } from 'vue'
import type { Emotion } from '@/types'

const emotionModules = import.meta.glob('@/emotions/*.ts', { eager: true })
const emotionsMap = ref<Map<string, Emotion>>(new Map())

for (const path in emotionModules) {
  const module = emotionModules[path] as { default: Emotion }
  const emotion = module.default
  if (emotion && emotion.id) {
    emotionsMap.value.set(emotion.id, emotion)
  }
}

export function useEmotions() {
  const emotions = computed(() => Array.from(emotionsMap.value.values()))

  const getEmotion = (id: string): Emotion | undefined => {
    return emotionsMap.value.get(id)
  }

  return {
    emotions,
    getEmotion
  }
}
