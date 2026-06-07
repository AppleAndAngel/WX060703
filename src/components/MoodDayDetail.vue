<script setup lang="ts">
import { computed } from 'vue'
import { useMoodCalendar } from '@/composables/useMoodCalendar'
import { useBubbles } from '@/composables/useBubbles'
import { useEmotions } from '@/composables/useEmotions'

const props = defineProps<{
  dateKey: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const { getDayMood } = useMoodCalendar()
const { bubbles } = useBubbles()
const { getEmotion } = useEmotions()

const dayMood = computed(() => getDayMood(props.dateKey))

const dayBubbles = computed(() => {
  if (!dayMood.value) return []
  return bubbles
    .filter(b => dayMood.value!.bubbleIds.includes(b.id))
    .sort((a, b) => a.createdAt - b.createdAt)
})

const formattedDate = computed(() => {
  const [year, month, day] = props.dateKey.split('-')
  return `${year}年${parseInt(month)}月${parseInt(day)}日`
})

const emotionSummary = computed(() => {
  if (!dayMood.value) return []
  const countMap: Record<string, number> = {}
  dayMood.value.emotionIds.forEach(id => {
    countMap[id] = (countMap[id] || 0) + 1
  })
  return Object.entries(countMap)
    .map(([id, count]) => ({
      emotion: getEmotion(id),
      count
    }))
    .filter(item => item.emotion)
    .sort((a, b) => b.count - a.count)
})

const formatTime = (timestamp: number) => {
  const date = new Date(timestamp)
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
}

const getBubbleGradient = (emotionId: string) => {
  const emotion = getEmotion(emotionId)
  if (!emotion) return ''
  return `linear-gradient(135deg, ${emotion.color.from}cc, ${emotion.color.to}88)`
}
</script>

<template>
  <div class="mood-day-detail fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" @click.self="emit('close')">
    <div class="detail-container w-full max-w-md rounded-3xl bg-wall-surface/95 backdrop-blur-xl border border-white/10 shadow-2xl overflow-hidden animate-scale-in">
      <div class="header p-6 border-b border-white/10">
        <div class="flex items-center justify-between mb-4">
          <button
            class="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors"
            @click="emit('close')"
          >
            ←
          </button>
          <h2 class="text-white text-lg font-medium font-display">{{ formattedDate }}</h2>
          <div class="w-10"></div>
        </div>

        <div class="flex items-center justify-center gap-3">
          <div
            v-for="item in emotionSummary"
            :key="item.emotion!.id"
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
            :style="{ background: `${item.emotion!.color.from}33` }"
          >
            <span class="text-lg">{{ item.emotion!.emoji }}</span>
            <span class="text-white/80 text-sm font-mono">×{{ item.count }}</span>
          </div>
        </div>
      </div>

      <div class="body p-6 max-h-96 overflow-y-auto">
        <div v-if="dayBubbles.length === 0" class="text-center py-12">
          <div class="text-5xl mb-4">🌫️</div>
          <p class="text-white/40 text-sm">这一天没有记录心情</p>
        </div>

        <div v-else class="space-y-4">
          <div
            v-for="bubble in dayBubbles"
            :key="bubble.id"
            class="bubble-item p-4 rounded-2xl border border-white/10"
            :style="{ background: getBubbleGradient(bubble.emotionId) }"
          >
            <div class="flex items-start gap-3">
              <div class="bubble-emoji text-3xl flex-shrink-0">
                {{ getEmotion(bubble.emotionId)?.emoji || '💭' }}
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between mb-2">
                  <span class="text-white/60 text-xs font-mono">{{ formatTime(bubble.createdAt) }}</span>
                  <div class="flex items-center gap-1 text-white/60 text-xs">
                    <span>✨</span>
                    <span class="font-mono">{{ bubble.empathyCount }}</span>
                  </div>
                </div>
                <p v-if="bubble.text" class="text-white text-sm font-display leading-relaxed">
                  {{ bubble.text }}
                </p>
                <p v-else class="text-white/40 text-sm italic">（没有文字）</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="footer p-6 border-t border-white/10">
        <div class="text-center text-white/30 text-xs">
          共记录 {{ dayBubbles.length }} 个心情
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.animate-scale-in {
  animation: scaleIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.body::-webkit-scrollbar {
  width: 4px;
}

.body::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
}

.body::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
}
</style>
