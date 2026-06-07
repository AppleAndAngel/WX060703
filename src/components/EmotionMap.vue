<script setup lang="ts">
import { ref, computed } from 'vue'
import { useBubbles } from '@/composables/useBubbles'
import { useEmotions } from '@/composables/useEmotions'
import type { Bubble } from '@/types'

const emit = defineEmits<{
  (e: 'close'): void
}>()

const { tonightEmotionStats, tonightEmotionPercentages, tonightDominantEmotion } = useBubbles()
const { emotions } = useEmotions()

const selectedEmotion = ref<string | null>(null)

const sortedEmotions = computed(() => {
  return [...emotions.value].sort((a, b) => {
    const countA = tonightEmotionStats.value[a.id]?.count || 0
    const countB = tonightEmotionStats.value[b.id]?.count || 0
    return countB - countA
  })
})

const tonightTotal = computed(() => {
  return emotions.value.reduce((sum, emotion) => {
    return sum + (tonightEmotionStats.value[emotion.id]?.count || 0)
  }, 0)
})

const getEmotionBubbles = (emotionId: string): Bubble[] => {
  return tonightEmotionStats.value[emotionId]?.bubbles || []
}

const getEmotionPosition = (index: number) => {
  const positions = [
    { top: '25%', left: '25%' },
    { top: '25%', left: '75%' },
    { top: '70%', left: '50%' }
  ]
  return positions[index] || { top: '50%', left: '50%' }
}

const getBubblePositionInRegion = (bubble: Bubble, index: number) => {
  const seed = bubble.id.charCodeAt(0) + bubble.id.charCodeAt(bubble.id.length - 1)
  const offsetX = (seed % 20 - 10) + (index % 5 - 2) * 8
  const offsetY = ((seed * 7) % 20 - 10) + (Math.floor(index / 5) % 5 - 2) * 8

  return {
    transform: `translate(${offsetX}px, ${offsetY}px)`,
    animationDelay: `${(index * 0.1) % 2}s`,
    zIndex: index
  }
}

const getBubbleSize = (empathyCount: number) => {
  const baseSize = 50
  const sizeIncrement = Math.min(empathyCount * 2, 30)
  return baseSize + sizeIncrement
}

const closeMap = () => {
  emit('close')
}

const selectEmotion = (emotionId: string) => {
  selectedEmotion.value = selectedEmotion.value === emotionId ? null : emotionId
}

const dominantEmotionData = computed(() => {
  if (!tonightDominantEmotion.value) return null
  return emotions.value.find(e => e.id === tonightDominantEmotion.value)
})

const selectedEmotionData = computed(() => {
  if (!selectedEmotion.value) return null
  return emotions.value.find(e => e.id === selectedEmotion.value)
})

const selectedEmotionBubbles = computed((): Bubble[] => {
  if (!selectedEmotion.value) return []
  return tonightEmotionStats.value[selectedEmotion.value]?.bubbles || []
})

const selectedEmotionCount = computed(() => {
  if (!selectedEmotion.value) return 0
  return tonightEmotionStats.value[selectedEmotion.value]?.count || 0
})

const getStats = (emotionId: string) => {
  return tonightEmotionStats.value[emotionId] || { count: 0, empathyCount: 0, bubbles: [] }
}

const getPercentage = (emotionId: string) => {
  return tonightEmotionPercentages.value[emotionId] || 0
}
</script>

<template>
  <div class="emotion-map fixed inset-0 z-50 bg-wall-bg overflow-hidden">
    <div class="bg-layer absolute inset-0">
      <div class="stars absolute inset-0 opacity-30"></div>
      <div class="noise absolute inset-0 opacity-[0.015]"></div>
    </div>

    <div class="absolute top-0 left-0 right-0 z-20 p-6">
      <div class="flex items-center justify-between max-w-7xl mx-auto">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-xl">
            🗺️
          </div>
          <div>
            <h1 class="text-white text-xl font-medium">情绪地图</h1>
            <p class="text-white/40 text-xs">今晚大家的心情分布</p>
          </div>
        </div>
        <div class="flex items-center gap-4">
          <div v-if="dominantEmotionData" class="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/20">
            <span class="text-2xl">{{ dominantEmotionData.emoji }}</span>
            <div>
              <p class="text-white/60 text-xs">今夜主导情绪</p>
              <p class="text-white font-medium">{{ dominantEmotionData.name }}</p>
            </div>
          </div>
          <div class="text-right">
            <div class="text-white text-lg font-mono">{{ tonightTotal }}</div>
            <div class="text-white/40 text-xs">今夜心情</div>
          </div>
          <button
            class="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all duration-300"
            @click="closeMap"
          >
            ✕
          </button>
        </div>
      </div>
    </div>

    <div class="map-container absolute inset-0 pt-24 pb-32 px-6">
      <div class="regions-grid relative w-full h-full max-w-7xl mx-auto">
        <svg class="connections absolute inset-0 w-full h-full pointer-events-none" style="opacity: 0.3;">
          <defs>
            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" style="stop-color:rgba(255,255,255,0)" />
              <stop offset="50%" style="stop-color:rgba(255,255,255,0.5)" />
              <stop offset="100%" style="stop-color:rgba(255,255,255,0)" />
            </linearGradient>
          </defs>
          <line v-if="sortedEmotions.length > 1" x1="25%" y1="25%" x2="75%" y2="25%" stroke="url(#lineGradient)" stroke-width="2" stroke-dasharray="8,8" />
          <line v-if="sortedEmotions.length > 2" x1="25%" y1="25%" x2="50%" y2="70%" stroke="url(#lineGradient)" stroke-width="2" stroke-dasharray="8,8" />
          <line v-if="sortedEmotions.length > 2" x1="75%" y1="25%" x2="50%" y2="70%" stroke="url(#lineGradient)" stroke-width="2" stroke-dasharray="8,8" />
        </svg>

        <div
          v-for="(emotion, index) in sortedEmotions"
          :key="emotion.id"
          class="emotion-region absolute transition-all duration-500 cursor-pointer"
          :style="{
            ...getEmotionPosition(index),
            transform: 'translate(-50%, -50%)'
          }"
          @click="selectEmotion(emotion.id)"
        >
          <div
            class="region-background absolute rounded-full transition-all duration-500"
            :style="{
              width: `${200 + getStats(emotion.id).count * 15}px`,
              height: `${200 + getStats(emotion.id).count * 15}px`,
              background: `radial-gradient(circle, ${emotion.color.from}40 0%, ${emotion.color.to}10 50%, transparent 70%)`,
              transform: 'translate(-50%, -50%)',
              left: '50%',
              top: '50%',
              filter: 'blur(20px)',
              opacity: selectedEmotion === emotion.id ? 0.8 : 0.5
            }"
          />

          <div class="region-content relative flex flex-col items-center">
            <div
              class="emotion-icon w-20 h-20 rounded-full flex items-center justify-center text-4xl mb-3 transition-all duration-300 border-2"
              :style="{
                background: `linear-gradient(135deg, ${emotion.color.from}, ${emotion.color.to})`,
                borderColor: selectedEmotion === emotion.id ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.3)',
                boxShadow: selectedEmotion === emotion.id
                  ? `0 0 40px ${emotion.color.from}, 0 0 80px ${emotion.color.to}66`
                  : `0 0 20px ${emotion.color.from}66`
              }"
            >
              {{ emotion.emoji }}
            </div>

            <div class="text-center">
              <h3 class="text-white text-lg font-medium mb-1">{{ emotion.name }}</h3>
              <div class="flex items-center justify-center gap-2">
                <span class="text-2xl font-bold text-white">{{ getStats(emotion.id).count }}</span>
                <span class="text-white/50 text-sm">个心情</span>
              </div>
              <div class="mt-2 w-32 h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  class="h-full rounded-full transition-all duration-700"
                  :style="{
                    width: `${getPercentage(emotion.id)}%`,
                    background: `linear-gradient(90deg, ${emotion.color.from}, ${emotion.color.to})`
                  }"
                />
              </div>
              <p class="text-white/50 text-xs mt-1">{{ getPercentage(emotion.id) }}%</p>
            </div>

            <div
              v-if="getStats(emotion.id).count > 0"
              class="bubbles-cluster absolute top-1/2 left-1/2 pointer-events-none"
              style="width: 300px; height: 300px;"
            >
              <div
                v-for="(bubble, bubbleIndex) in getEmotionBubbles(emotion.id).slice(0, 12)"
                :key="bubble.id"
                class="mini-bubble absolute rounded-full flex items-center justify-center animate-float"
                :style="{
                  width: `${getBubbleSize(bubble.empathyCount)}px`,
                  height: `${getBubbleSize(bubble.empathyCount)}px`,
                  background: `radial-gradient(circle at 30% 30%, ${emotion.color.from}cc, ${emotion.color.to}88 60%, ${emotion.color.to}44)`,
                  boxShadow: `0 0 ${10 + bubble.empathyCount}px ${emotion.color.from}88`,
                  opacity: selectedEmotion === emotion.id ? 1 : 0.6,
                  ...getBubblePositionInRegion(bubble, bubbleIndex)
                }"
              >
                <span class="text-lg">{{ emotion.emoji }}</span>
                <div
                  v-if="bubble.empathyCount > 0"
                  class="absolute -bottom-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-white/30 backdrop-blur-md flex items-center justify-center"
                >
                  <span class="text-[10px] font-mono text-white">{{ bubble.empathyCount }}</span>
                </div>
              </div>
            </div>

            <div
              v-if="getStats(emotion.id).count > 12"
              class="mt-3 text-white/50 text-xs"
            >
              还有 {{ getStats(emotion.id).count - 12 }} 个...
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="absolute bottom-0 left-0 right-0 z-20 p-6">
      <div class="flex items-center justify-center gap-8 max-w-7xl mx-auto">
        <div
          v-for="emotion in sortedEmotions"
          :key="emotion.id"
          class="flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 cursor-pointer"
          :class="{
            'bg-white/20': selectedEmotion === emotion.id,
            'bg-white/5': selectedEmotion !== emotion.id
          }"
          @click="selectEmotion(emotion.id)"
        >
          <span class="text-xl">{{ emotion.emoji }}</span>
          <span class="text-white text-sm">{{ emotion.name }}</span>
          <span class="text-white/60 text-sm font-mono">{{ getPercentage(emotion.id) }}%</span>
        </div>
      </div>
    </div>

    <Transition name="fade">
      <div
        v-if="selectedEmotion && selectedEmotionData"
        class="emotion-detail fixed inset-0 z-30 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        @click="selectEmotion('')"
      >
        <div
          class="detail-panel max-w-lg w-full mx-6 p-6 rounded-2xl bg-wall-surface/95 backdrop-blur-xl border border-white/10 shadow-2xl"
          @click.stop
        >
          <div class="flex items-center justify-between mb-6">
            <div class="flex items-center gap-3">
              <div
                class="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                :style="{
                  background: `linear-gradient(135deg, ${selectedEmotionData.color.from}, ${selectedEmotionData.color.to})`
                }"
              >
                {{ selectedEmotionData.emoji }}
              </div>
              <div>
                <h3 class="text-white text-lg font-medium">{{ selectedEmotionData.name }}</h3>
                <p class="text-white/50 text-sm">{{ selectedEmotionCount }} 个心情</p>
              </div>
            </div>
            <button
              class="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white/70 hover:bg-white/20 transition-colors"
              @click="selectEmotion('')"
            >
              ✕
            </button>
          </div>

          <div class="bubbles-list space-y-3 max-h-96 overflow-y-auto">
            <div
              v-for="bubble in selectedEmotionBubbles"
              :key="bubble.id"
              class="bubble-item flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
            >
              <div
                class="w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0"
                :style="{
                  background: `radial-gradient(circle at 30% 30%, ${selectedEmotionData.color.from}cc, ${selectedEmotionData.color.to}88)`
                }"
              >
                {{ selectedEmotionData.emoji }}
              </div>
              <div class="flex-1 min-w-0">
                <p v-if="bubble.text" class="text-white text-sm truncate">{{ bubble.text }}</p>
                <p v-else class="text-white/50 text-sm italic">（无文字）</p>
                <p class="text-white/30 text-xs mt-1">
                  {{ new Date(bubble.createdAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) }}
                </p>
              </div>
              <div class="flex items-center gap-1 text-white/70">
                <span>💗</span>
                <span class="text-sm font-mono">{{ bubble.empathyCount }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.emotion-region {
  transform-origin: center center;
}

.emotion-region:hover {
  transform: translate(-50%, -50%) scale(1.05);
}

.mini-bubble {
  will-change: transform;
  animation: float 4s ease-in-out infinite;
}

.mini-bubble::before {
  content: '';
  position: absolute;
  top: 15%;
  left: 20%;
  width: 25%;
  height: 15%;
  background: rgba(255, 255, 255, 0.4);
  border-radius: 50%;
  filter: blur(1px);
  pointer-events: none;
}

@keyframes float {
  0%, 100% { transform: translate(var(--tx, 0), var(--ty, 0)) translateY(0); }
  50% { transform: translate(var(--tx, 0), var(--ty, 0)) translateY(-8px); }
}

.bubbles-list::-webkit-scrollbar {
  width: 4px;
}

.bubbles-list::-webkit-scrollbar-track {
  background: transparent;
}

.bubbles-list::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
}

.bubbles-list::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.4);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.stars {
  background-image:
    radial-gradient(1px 1px at 20% 30%, white, transparent),
    radial-gradient(1px 1px at 60% 70%, white, transparent),
    radial-gradient(1px 1px at 80% 20%, white, transparent),
    radial-gradient(1px 1px at 40% 80%, white, transparent),
    radial-gradient(1px 1px at 10% 50%, white, transparent),
    radial-gradient(1px 1px at 90% 60%, white, transparent),
    radial-gradient(2px 2px at 30% 10%, white, transparent),
    radial-gradient(2px 2px at 70% 90%, white, transparent);
  background-size: 300px 300px;
  animation: twinkle 4s ease-in-out infinite;
}

@keyframes twinkle {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 0.5; }
}

.noise {
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
}
</style>
