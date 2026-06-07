<script setup lang="ts">
import { ref, computed } from 'vue'
import type { TimeRange, RankingBubble } from '@/types'
import { useBubbles } from '@/composables/useBubbles'
import { useEmotions } from '@/composables/useEmotions'

const emit = defineEmits<{
  (e: 'close'): void
}>()

const { getTopEmpathy, getFastestGrowing, userId } = useBubbles()
const { getEmotion } = useEmotions()

const activeTab = ref<'empathy' | 'growing'>('empathy')
const timeRange = ref<TimeRange>('today')

const timeRangeOptions: { value: TimeRange; label: string }[] = [
  { value: 'today', label: '今日' },
  { value: 'week', label: '本周' },
  { value: 'all', label: '全部' }
]

const topEmpathyList = computed(() => getTopEmpathy(timeRange.value))
const fastestGrowingList = computed(() => getFastestGrowing(timeRange.value))

const currentList = computed(() =>
  activeTab.value === 'empathy' ? topEmpathyList.value : fastestGrowingList.value
)

const formatTime = (timestamp: number) => {
  const diff = Date.now() - timestamp
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (mins < 1) return '刚刚'
  if (mins < 60) return `${mins}分钟前`
  if (hours < 24) return `${hours}小时前`
  return `${days}天前`
}

const getRankBadgeColor = (index: number) => {
  switch (index) {
    case 0:
      return 'bg-gradient-to-br from-yellow-400 to-amber-500'
    case 1:
      return 'bg-gradient-to-br from-gray-300 to-gray-400'
    case 2:
      return 'bg-gradient-to-br from-amber-600 to-amber-700'
    default:
      return 'bg-white/10'
  }
}

const getEmotionGradient = (bubble: RankingBubble) => {
  const emotion = getEmotion(bubble.emotionId)
  if (!emotion) return ''
  return `linear-gradient(135deg, ${emotion.color.from}40, ${emotion.color.to}20)`
}

const getEmotionBorderColor = (bubble: RankingBubble) => {
  const emotion = getEmotion(bubble.emotionId)
  if (!emotion) return 'border-white/20'
  return `border-[${emotion.color.from}]/40`
}

const formatGrowthRate = (rate: number) => {
  if (rate >= 1) return `${rate.toFixed(1)}次/时`
  if (rate * 60 >= 1) return `${(rate * 60).toFixed(1)}次/时`
  return `${(rate * 24).toFixed(1)}次/天`
}
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4" @click.self="emit('close')">
    <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="emit('close')"></div>

    <div class="relative w-full max-w-lg bg-wall-surface/95 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
      <div class="p-6 border-b border-white/10">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-white text-xl font-medium font-display flex items-center gap-2">
              <span class="text-2xl">🔊</span>
              共鸣回声
            </h2>
            <p class="text-white/40 text-sm mt-1">墙上最具共鸣的声音</p>
          </div>
          <button
            class="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/60 hover:text-white transition-colors"
            @click="emit('close')"
          >
            ✕
          </button>
        </div>

        <div class="flex gap-1 mt-4 p-1 bg-white/5 rounded-xl">
          <button
            v-for="opt in timeRangeOptions"
            :key="opt.value"
            class="flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200"
            :class="[
              timeRange === opt.value
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                : 'text-white/50 hover:text-white/80'
            ]"
            @click="timeRange = opt.value"
          >
            {{ opt.label }}
          </button>
        </div>

        <div class="flex gap-4 mt-4">
          <button
            class="flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all duration-200 border"
            :class="[
              activeTab === 'empathy'
                ? 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border-blue-400/40 text-blue-300'
                : 'bg-white/5 border-white/10 text-white/50 hover:text-white/80'
            ]"
            @click="activeTab = 'empathy'"
          >
            <div class="flex items-center justify-center gap-2">
              <span>❤️</span>
              <span>最高共情</span>
            </div>
          </button>
          <button
            class="flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all duration-200 border"
            :class="[
              activeTab === 'growing'
                ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-400/40 text-green-300'
                : 'bg-white/5 border-white/10 text-white/50 hover:text-white/80'
            ]"
            @click="activeTab = 'growing'"
          >
            <div class="flex items-center justify-center gap-2">
              <span>📈</span>
              <span>涨得最快</span>
            </div>
          </button>
        </div>
      </div>

      <div class="max-h-[50vh] overflow-y-auto">
        <div v-if="currentList.length === 0" class="p-12 text-center">
          <div class="text-5xl mb-4">🌙</div>
          <p class="text-white/40 text-sm">
            {{ activeTab === 'empathy' ? '还没有气泡被共情' : '还没有快速上涨的气泡' }}
          </p>
          <p class="text-white/20 text-xs mt-2">投放心情，等待共鸣</p>
        </div>

        <div v-else class="p-3 space-y-2">
          <div
            v-for="(bubble, index) in currentList"
            :key="bubble.id"
            class="ranking-item flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 hover:scale-[1.02]"
            :class="[
              bubble.ownerId === userId ? 'bg-green-500/10' : 'bg-white/5',
              bubble.ownerId === userId ? 'border-green-400/30' : getEmotionBorderColor(bubble)
            ]"
            :style="{ background: bubble.ownerId === userId ? undefined : getEmotionGradient(bubble) }"
          >
            <div
              class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
              :class="getRankBadgeColor(index)"
            >
              {{ index + 1 }}
            </div>

            <div class="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 backdrop-blur-sm border border-white/20"
              :style="{ background: getEmotionGradient(bubble) }">
              <span class="text-2xl">
                {{ getEmotion(bubble.emotionId)?.emoji || '💭' }}
              </span>
            </div>

            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <p class="text-white text-sm font-medium truncate">
                  {{ bubble.text || '一个心情气泡' }}
                </p>
                <span
                  v-if="bubble.ownerId === userId"
                  class="px-1.5 py-0.5 rounded bg-green-500/30 text-green-300 text-[10px] font-medium flex-shrink-0"
                >
                  我的
                </span>
              </div>
              <p class="text-white/40 text-xs mt-1">
                {{ formatTime(bubble.createdAt) }}
              </p>
            </div>

            <div class="text-right flex-shrink-0">
              <div
                class="text-lg font-bold font-mono"
                :class="activeTab === 'empathy' ? 'text-blue-300' : 'text-green-300'"
              >
                {{ activeTab === 'empathy' ? bubble.periodEmpathyCount : formatGrowthRate(bubble.growthRate) }}
              </div>
              <div class="text-[10px] text-white/40">
                {{ activeTab === 'empathy' ? '次共情' : '增长速度' }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="p-4 border-t border-white/10">
        <p class="text-white/30 text-xs text-center">
          榜单数据实时更新 · 排序基于「{{ timeRange === 'today' ? '今日' : timeRange === 'week' ? '本周' : '全部' }}」统计
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ranking-item {
  will-change: transform;
}
</style>
