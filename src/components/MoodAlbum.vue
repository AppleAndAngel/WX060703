<script setup lang="ts">
import { ref, computed } from 'vue'
import { useBubbles } from '@/composables/useBubbles'
import { useEmotions } from '@/composables/useEmotions'

const emit = defineEmits<{
  (e: 'close'): void
}>()

const { myBubblesGroupedByDate, myBubblesStats } = useBubbles()
const { getEmotion } = useEmotions()

const scrollContainer = ref<HTMLElement | null>(null)
const showScrollHint = ref(true)

const hasBubbles = computed(() => myBubblesGroupedByDate.value.length > 0)

const formatTime = (timestamp: number) => {
  const date = new Date(timestamp)
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
}

const getBubbleGradient = (emotionId: string) => {
  const emotion = getEmotion(emotionId)
  if (!emotion) return 'linear-gradient(135deg, #66666666, #44444444)'
  return `linear-gradient(135deg, ${emotion.color.from}cc, ${emotion.color.to}88)`
}

const getEmotionBorder = (emotionId: string) => {
  const emotion = getEmotion(emotionId)
  if (!emotion) return 'rgba(255, 255, 255, 0.1)'
  return `${emotion.color.from}44`
}

const handleScroll = () => {
  if (scrollContainer.value && scrollContainer.value.scrollLeft > 10) {
    showScrollHint.value = false
  }
}

const scrollToLeft = () => {
  if (scrollContainer.value) {
    scrollContainer.value.scrollBy({ left: -300, behavior: 'smooth' })
  }
}

const scrollToRight = () => {
  if (scrollContainer.value) {
    scrollContainer.value.scrollBy({ left: 300, behavior: 'smooth' })
  }
}
</script>

<template>
  <div class="mood-album fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" @click.self="emit('close')">
    <div class="album-container w-full max-w-5xl rounded-3xl bg-wall-surface/95 backdrop-blur-xl border border-white/10 shadow-2xl overflow-hidden animate-scale-in">
      <div class="header p-6 border-b border-white/10">
        <div class="flex items-center justify-between mb-6">
          <button
            class="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors"
            @click="emit('close')"
          >
            ✕
          </button>
          <h2 class="text-white text-xl font-medium font-display flex items-center gap-2">
            <span class="text-2xl">📸</span>
            心情相册
          </h2>
          <div class="w-10"></div>
        </div>

        <div class="stats-grid grid grid-cols-2 md:grid-cols-4 gap-3">
          <div class="stat-card p-4 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/10 border border-white/10">
            <div class="text-white/40 text-xs mb-1">投出气泡</div>
            <div class="text-white text-2xl font-mono font-medium">{{ myBubblesStats.totalBubbles }}</div>
            <div class="text-white/30 text-xs">个</div>
          </div>
          <div class="stat-card p-4 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/10 border border-white/10">
            <div class="text-white/40 text-xs mb-1">收获共情</div>
            <div class="text-white text-2xl font-mono font-medium flex items-center gap-1">
              <span class="text-lg">✨</span>
              {{ myBubblesStats.totalEmpathy }}
            </div>
            <div class="text-white/30 text-xs">次</div>
          </div>
          <div class="stat-card p-4 rounded-2xl bg-gradient-to-br from-orange-500/20 to-yellow-500/10 border border-white/10">
            <div class="text-white/40 text-xs mb-1">平均共情</div>
            <div class="text-white text-2xl font-mono font-medium">{{ myBubblesStats.avgEmpathyPerBubble }}</div>
            <div class="text-white/30 text-xs">次/个</div>
          </div>
          <div class="stat-card p-4 rounded-2xl bg-gradient-to-br from-rose-500/20 to-pink-500/10 border border-white/10">
            <div class="text-white/40 text-xs mb-1">记录天数</div>
            <div class="text-white text-2xl font-mono font-medium">{{ myBubblesStats.daysSinceFirst }}</div>
            <div class="text-white/30 text-xs">天</div>
          </div>
        </div>
      </div>

      <div class="timeline-section relative p-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-white/80 text-sm font-display flex items-center gap-2">
            <span class="text-lg">⏳</span>
            回忆时光轴
          </h3>
          <div class="flex items-center gap-2">
            <button
              class="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors"
              @click="scrollToLeft"
            >
              ‹
            </button>
            <button
              class="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors"
              @click="scrollToRight"
            >
              ›
            </button>
          </div>
        </div>

        <div
          v-if="!hasBubbles"
          class="empty-state text-center py-16"
        >
          <div class="text-6xl mb-4 animate-float">🌫️</div>
          <p class="text-white/60 text-base font-display mb-2">还没有心情记录</p>
          <p class="text-white/30 text-sm">投出你的第一个气泡，开启心情相册吧</p>
        </div>

        <div v-else class="timeline-wrapper relative">
          <Transition name="fade">
            <div
              v-if="showScrollHint"
              class="scroll-hint absolute right-4 top-1/2 -translate-y-1/2 z-10 pointer-events-none"
            >
              <div class="flex items-center gap-2 px-3 py-2 rounded-full bg-black/50 backdrop-blur-sm text-white/60 text-xs animate-pulse">
                <span>← 滑动查看更多</span>
              </div>
            </div>
          </Transition>

          <div
            ref="scrollContainer"
            class="timeline-container overflow-x-auto overflow-y-hidden pb-4"
            @scroll="handleScroll"
          >
            <div class="timeline-content flex items-stretch gap-6 min-w-max px-2">
              <div
                v-for="(group, groupIndex) in myBubblesGroupedByDate"
                :key="group.dateKey"
                class="date-group flex-shrink-0"
              >
                <div class="date-header mb-4 flex items-center gap-3">
                  <div class="date-badge px-4 py-2 rounded-full bg-white/5 border border-white/10">
                    <span class="text-white/80 text-sm font-display">{{ group.dateLabel }}</span>
                    <span class="text-white/40 text-xs ml-2 font-mono">{{ group.bubbles.length }} 个心情</span>
                    <span class="text-white/40 text-xs ml-2 flex items-center gap-1">
                      <span class="text-xs">✨</span>
                      {{ group.totalEmpathy }}
                    </span>
                  </div>
                  <div
                    v-if="groupIndex < myBubblesGroupedByDate.length - 1"
                    class="timeline-dots flex-1 h-px bg-gradient-to-r from-white/20 to-transparent min-w-[40px]"
                  ></div>
                </div>

                <div class="bubbles-row flex gap-4">
                  <div
                    v-for="(bubble, bubbleIndex) in group.bubbles"
                    :key="bubble.id"
                    class="bubble-card flex-shrink-0 w-64 p-4 rounded-2xl border transition-all duration-300 hover:scale-[1.02] hover:shadow-xl cursor-default"
                    :style="{
                      background: getBubbleGradient(bubble.emotionId),
                      borderColor: getEmotionBorder(bubble.emotionId),
                      boxShadow: `0 4px 20px ${getEmotionBorder(bubble.emotionId).replace('44', '22')}`,
                      animationDelay: `${(groupIndex * group.bubbles.length + bubbleIndex) * 0.05}s`
                    }"
                  >
                    <div class="flex items-start gap-3 mb-3">
                      <div class="emoji-wrapper w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                        <span class="text-2xl animate-float-slow" :style="{ animationDelay: `${bubbleIndex * 0.2}s` }">
                          {{ getEmotion(bubble.emotionId)?.emoji || '💭' }}
                        </span>
                      </div>
                      <div class="flex-1 min-w-0">
                        <div class="flex items-center justify-between mb-1">
                          <span class="text-white/60 text-xs font-mono">{{ formatTime(bubble.createdAt) }}</span>
                          <div class="empathy-badge flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/10 backdrop-blur-sm">
                            <span class="text-xs">✨</span>
                            <span class="text-white/80 text-xs font-mono">{{ bubble.empathyCount }}</span>
                          </div>
                        </div>
                        <div class="text-white/60 text-xs">
                          {{ getEmotion(bubble.emotionId)?.name || '心情' }}
                        </div>
                      </div>
                    </div>

                    <div class="bubble-text">
                      <p
                        v-if="bubble.text"
                        class="text-white text-sm font-display leading-relaxed line-clamp-3"
                      >
                        {{ bubble.text }}
                      </p>
                      <p v-else class="text-white/40 text-sm italic">
                        （无声的心情）
                      </p>
                    </div>

                    <div class="mt-3 pt-3 border-t border-white/10">
                      <div class="flex items-center justify-between">
                        <div class="text-white/30 text-xs">
                          #{{ group.bubbles.length - bubbleIndex }} 当日
                        </div>
                        <div class="text-white/30 text-xs font-mono">
                          ID: {{ bubble.id.slice(0, 6) }}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="timeline-track mt-6 h-1 bg-white/5 rounded-full overflow-hidden">
            <div class="timeline-progress h-full bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 rounded-full" style="width: 30%"></div>
          </div>
          <div class="flex justify-between mt-2 text-white/30 text-xs font-mono">
            <span>过去</span>
            <span>现在</span>
          </div>
        </div>
      </div>

      <div class="footer p-6 border-t border-white/10">
        <div class="text-center text-white/30 text-xs">
          每一个气泡都是一段珍贵的回忆 · 所有数据存储在你的浏览器本地
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

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.timeline-container::-webkit-scrollbar {
  height: 4px;
}

.timeline-container::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 2px;
}

.timeline-container::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
}

.timeline-container::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}

.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.bubble-card {
  animation: cardFloatIn 0.5s cubic-bezier(0.4, 0, 0.2, 1) backwards;
}

@keyframes cardFloatIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-float-slow {
  animation: floatSlow 4s ease-in-out infinite;
}

@keyframes floatSlow {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}

.timeline-progress {
  animation: progressGlow 3s ease-in-out infinite;
}

@keyframes progressGlow {
  0%, 100% { opacity: 0.8; }
  50% { opacity: 1; }
}
</style>
