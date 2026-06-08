<script setup lang="ts">
import { computed } from 'vue'
import { useWeeklyMoodBill } from '@/composables/useWeeklyMoodBill'

const emit = defineEmits<{
  (e: 'close'): void
}>()

const {
  totalBubbles,
  totalEmpathy,
  dayBills,
  emotionBills,
  dominantEmotion,
  textLengthStat,
  empathyTrend,
  mostEmpathicBubble,
  longestTextBubble,
  hasData,
  getEmotion
} = useWeeklyMoodBill()

const avgEmpathyPerBubble = computed(() =>
  totalBubbles.value > 0 ? Math.round(totalEmpathy.value / totalBubbles.value) : 0
)

const maxEmpathyTrend = computed(() =>
  Math.max(1, ...empathyTrend.value.map(t => t.total))
)

const getEmotionGradient = (emotionId: string) => {
  const emotion = getEmotion(emotionId)
  if (!emotion) return ''
  return `linear-gradient(135deg, ${emotion.color.from}40, ${emotion.color.to}20)`
}

const getEmotionColor = (emotionId: string) => {
  const emotion = getEmotion(emotionId)
  return emotion?.color.from || '#888'
}

const getTextLengthLabel = (type: 'short' | 'medium' | 'long') => {
  switch (type) {
    case 'short': return '短句 (≤10字)'
    case 'medium': return '中句 (11-30字)'
    case 'long': return '长句 (>30字)'
  }
}

const getTextLengthCount = (type: 'short' | 'medium' | 'long') => {
  return textLengthStat.value.distribution[type]
}

const getTextLengthPercentage = (type: 'short' | 'medium' | 'long') => {
  const total = textLengthStat.value.distribution.short +
    textLengthStat.value.distribution.medium +
    textLengthStat.value.distribution.long
  if (total === 0) return 0
  return Math.round((textLengthStat.value.distribution[type] / total) * 100)
}

const formatDate = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  return `${year}年${month}月`
}
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4" @click.self="emit('close')">
    <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="emit('close')"></div>

    <div class="relative w-full max-w-2xl max-h-[90vh] bg-wall-surface/95 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
      <div class="p-6 border-b border-white/10">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-white text-xl font-medium font-display flex items-center gap-2">
              <span class="text-2xl">📊</span>
              本周情绪账单
            </h2>
            <p class="text-white/40 text-sm mt-1">{{ formatDate() }} · 你的心情数据总结</p>
          </div>
          <button
            class="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/60 hover:text-white transition-colors"
            @click="emit('close')"
          >
            ✕
          </button>
        </div>
      </div>

      <div class="overflow-y-auto max-h-[calc(90vh-100px)]">
        <div v-if="!hasData" class="p-12 text-center">
          <div class="text-5xl mb-4">📝</div>
          <p class="text-white/40 text-sm">这周还没有投放心情哦</p>
          <p class="text-white/20 text-xs mt-2">投放一个心情，下周来查看账单吧</p>
        </div>

        <div v-else class="p-6 space-y-6">
          <div class="grid grid-cols-3 gap-4">
            <div class="stat-card p-4 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-400/30 text-center">
              <div class="text-3xl font-bold font-display text-purple-300">{{ totalBubbles }}</div>
              <div class="text-white/50 text-xs mt-1">心情条数</div>
            </div>
            <div class="stat-card p-4 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-400/30 text-center">
              <div class="text-3xl font-bold font-display text-blue-300">{{ totalEmpathy }}</div>
              <div class="text-white/50 text-xs mt-1">收到共情</div>
            </div>
            <div class="stat-card p-4 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-400/30 text-center">
              <div class="text-3xl font-bold font-display text-green-300">{{ avgEmpathyPerBubble }}</div>
              <div class="text-white/50 text-xs mt-1">平均共情</div>
            </div>
          </div>

          <div v-if="dominantEmotion" class="summary-card p-5 rounded-2xl border border-white/10"
            :style="{ background: getEmotionGradient(dominantEmotion.emotionId) }">
            <div class="flex items-center gap-4">
              <div class="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl backdrop-blur-sm border border-white/20"
                :style="{ background: getEmotionGradient(dominantEmotion.emotionId) }">
                {{ getEmotion(dominantEmotion.emotionId)?.emoji }}
              </div>
              <div class="flex-1">
                <div class="text-white/60 text-xs">本周主导心情</div>
                <div class="text-white text-xl font-medium font-display mt-1">
                  {{ getEmotion(dominantEmotion.emotionId)?.name }}
                </div>
                <div class="text-white/40 text-sm mt-1">
                  出现 {{ dominantEmotion.count }} 次 · 占 {{ dominantEmotion.percentage }}% · 收获 {{ dominantEmotion.totalEmpathy }} 次共情
                </div>
              </div>
            </div>
          </div>

          <div class="section-card p-5 rounded-2xl bg-white/5 border border-white/10">
            <h3 class="text-white text-sm font-medium flex items-center gap-2 mb-4">
              <span class="text-lg">🎭</span>
              心情类型分布
            </h3>
            <div class="space-y-3">
              <div v-for="item in emotionBills" :key="item.emotionId" class="emotion-item">
                <div class="flex items-center gap-3 mb-1">
                  <span class="text-xl">{{ getEmotion(item.emotionId)?.emoji }}</span>
                  <span class="text-white/80 text-sm flex-1">{{ getEmotion(item.emotionId)?.name }}</span>
                  <span class="text-white/50 text-xs">{{ item.count }} 条</span>
                  <span class="text-white/60 text-sm font-mono w-12 text-right">{{ item.percentage }}%</span>
                </div>
                <div class="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    class="h-full rounded-full transition-all duration-500"
                    :style="{
                      width: `${item.percentage}%`,
                      background: `linear-gradient(90deg, ${getEmotionColor(item.emotionId)}, ${getEmotionColor(item.emotionId)}80)`
                    }"
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <div class="section-card p-5 rounded-2xl bg-white/5 border border-white/10">
            <h3 class="text-white text-sm font-medium flex items-center gap-2 mb-4">
              <span class="text-lg">📝</span>
              文字长度统计
            </h3>
            <div class="grid grid-cols-3 gap-4 mb-4">
              <div class="text-center">
                <div class="text-2xl font-bold font-display text-amber-300">{{ textLengthStat.total }}</div>
                <div class="text-white/40 text-xs mt-1">总字数</div>
              </div>
              <div class="text-center">
                <div class="text-2xl font-bold font-display text-amber-300">{{ textLengthStat.avg }}</div>
                <div class="text-white/40 text-xs mt-1">平均字数</div>
              </div>
              <div class="text-center">
                <div class="text-2xl font-bold font-display text-amber-300">{{ textLengthStat.longest }}</div>
                <div class="text-white/40 text-xs mt-1">最长字数</div>
              </div>
            </div>
            <div class="space-y-2">
              <div v-for="type in (['short', 'medium', 'long'] as const)" :key="type" class="length-item">
                <div class="flex items-center gap-2 text-xs">
                  <span class="text-white/60 w-24">{{ getTextLengthLabel(type) }}</span>
                  <div class="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                      class="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500"
                      :style="{ width: `${getTextLengthPercentage(type)}%` }"
                    ></div>
                  </div>
                  <span class="text-white/50 w-8 text-right">{{ getTextLengthCount(type) }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="section-card p-5 rounded-2xl bg-white/5 border border-white/10">
            <h3 class="text-white text-sm font-medium flex items-center gap-2 mb-4">
              <span class="text-lg">📈</span>
              共情变化趋势
            </h3>
            <div class="flex items-end justify-between gap-2 h-32">
              <div
                v-for="trend in empathyTrend"
                :key="trend.dayIndex"
                class="flex-1 flex flex-col items-center gap-2"
              >
                <div class="w-full flex-1 flex items-end justify-center">
                  <div
                    class="w-full max-w-[30px] rounded-t-lg transition-all duration-500 relative group"
                    :class="trend.growth >= 0 ? 'bg-gradient-to-t from-green-500 to-emerald-400' : 'bg-gradient-to-t from-red-500 to-rose-400'"
                    :style="{ height: `${Math.max(8, (trend.total / maxEmpathyTrend) * 100)}%` }"
                  >
                    <div class="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      <div class="text-white text-[10px] bg-black/60 px-2 py-1 rounded">
                        {{ trend.total }} 次共情
                      </div>
                    </div>
                  </div>
                </div>
                <div class="text-white/50 text-[10px]">{{ trend.dayLabel }}</div>
                <div
                  class="text-[10px] font-mono"
                  :class="trend.growth >= 0 ? 'text-green-400' : 'text-red-400'"
                >
                  {{ trend.growth >= 0 ? '+' : '' }}{{ trend.growth }}
                </div>
              </div>
            </div>
          </div>

          <div class="section-card p-5 rounded-2xl bg-white/5 border border-white/10">
            <h3 class="text-white text-sm font-medium flex items-center gap-2 mb-4">
              <span class="text-lg">📅</span>
              每日账单
            </h3>
            <div class="space-y-2">
              <div
                v-for="day in dayBills"
                :key="day.dayIndex"
                class="day-item flex items-center gap-3 p-3 rounded-xl transition-all duration-200"
                :class="day.bubbles.length > 0 ? 'bg-white/5' : ''"
              >
                <div class="w-12 text-white/60 text-sm font-medium">{{ day.dayLabel }}</div>
                <div class="flex-1 flex items-center gap-1 flex-wrap">
                  <template v-if="day.bubbles.length > 0">
                    <div
                      v-for="(count, emotionId) in day.emotionCounts"
                      :key="emotionId"
                      v-show="count > 0"
                      class="flex items-center gap-1 px-2 py-1 rounded-full text-xs"
                      :style="{ background: getEmotionGradient(emotionId as string) }"
                    >
                      <span>{{ getEmotion(emotionId as string)?.emoji }}</span>
                      <span class="text-white/80">×{{ count }}</span>
                    </div>
                  </template>
                  <div v-else class="text-white/20 text-xs">
                    这天没有投放心情
                  </div>
                </div>
                <div v-if="day.bubbles.length > 0" class="text-right">
                  <div class="text-white/80 text-sm font-mono">{{ day.totalEmpathy }}</div>
                  <div class="text-white/30 text-[10px]">共情</div>
                </div>
              </div>
            </div>
          </div>

          <div v-if="mostEmpathicBubble || longestTextBubble" class="grid grid-cols-2 gap-4">
            <div v-if="mostEmpathicBubble" class="highlight-card p-4 rounded-2xl bg-gradient-to-br from-pink-500/20 to-rose-500/20 border border-pink-400/30">
              <div class="flex items-center gap-2 mb-2">
                <span class="text-lg">🏆</span>
                <span class="text-white/80 text-xs font-medium">最具共鸣</span>
              </div>
              <div class="flex items-center gap-2 mb-2">
                <span class="text-lg">{{ getEmotion(mostEmpathicBubble.emotionId)?.emoji }}</span>
                <span class="text-pink-300 font-bold font-mono text-lg">{{ mostEmpathicBubble.empathyCount }}</span>
                <span class="text-white/40 text-xs">次共情</span>
              </div>
              <p class="text-white/70 text-sm line-clamp-2">
                {{ mostEmpathicBubble.text || '一个心情气泡' }}
              </p>
            </div>
            <div v-if="longestTextBubble" class="highlight-card p-4 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-400/30">
              <div class="flex items-center gap-2 mb-2">
                <span class="text-lg">✍️</span>
                <span class="text-white/80 text-xs font-medium">最长文字</span>
              </div>
              <div class="flex items-center gap-2 mb-2">
                <span class="text-lg">{{ getEmotion(longestTextBubble.emotionId)?.emoji }}</span>
                <span class="text-amber-300 font-bold font-mono text-lg">{{ longestTextBubble.text?.length || 0 }}</span>
                <span class="text-white/40 text-xs">字</span>
              </div>
              <p class="text-white/70 text-sm line-clamp-2">
                {{ longestTextBubble.text || '一个心情气泡' }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div class="p-4 border-t border-white/10">
        <p class="text-white/30 text-xs text-center">
          账单周期：本周一至周日 · 数据实时更新
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.stat-card,
.highlight-card {
  will-change: transform;
  transition: transform 0.2s ease;
}

.stat-card:hover,
.highlight-card:hover {
  transform: translateY(-2px);
}

.day-item:hover {
  background: rgba(255, 255, 255, 0.08);
}

.emotion-item {
  transition: all 0.2s ease;
}

.emotion-item:hover {
  transform: translateX(4px);
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
