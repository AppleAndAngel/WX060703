<script setup lang="ts">
import { ref, computed } from 'vue'
import { useMoodDrawer } from '@/composables/useMoodDrawer'
import { useEmotions } from '@/composables/useEmotions'
import { useEffects } from '@/composables/useEffects'

const emit = defineEmits<{
  (e: 'close'): void
}>()

const {
  drawerBubblesChronological,
  hasItems,
  drawerCount,
  publishToWall,
  deleteFromDrawer,
  clearDrawer
} = useMoodDrawer()
const { getEmotion } = useEmotions()
const { triggerEffect } = useEffects()

const publishingId = ref<string | null>(null)
const deletingId = ref<string | null>(null)
const showClearConfirm = ref(false)
const drawerRef = ref<HTMLElement | null>(null)

const formatTime = (timestamp: number) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return '刚刚'
  if (diffMins < 60) return `${diffMins}分钟前`
  if (diffHours < 24) return `${diffHours}小时前`
  if (diffDays < 7) return `${diffDays}天前`

  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${month}-${day} ${hours}:${minutes}`
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

const handlePublish = async (drawerBubbleId: string) => {
  if (publishingId.value) return

  publishingId.value = drawerBubbleId

  if (drawerRef.value) {
    triggerEffect('sparkle', drawerRef.value, {})
  }

  setTimeout(() => {
    publishToWall(drawerBubbleId)
    publishingId.value = null
  }, 600)
}

const handleDelete = (drawerBubbleId: string) => {
  deletingId.value = drawerBubbleId
}

const confirmDelete = (drawerBubbleId: string) => {
  deleteFromDrawer(drawerBubbleId)
  deletingId.value = null
}

const cancelDelete = () => {
  deletingId.value = null
}

const handleClearAll = () => {
  showClearConfirm.value = true
}

const confirmClearAll = () => {
  clearDrawer()
  showClearConfirm.value = false
}

const cancelClearAll = () => {
  showClearConfirm.value = false
}

const groupedByDate = computed(() => {
  const groups: Record<string, {
    dateKey: string
    dateLabel: string
    bubbles: typeof drawerBubblesChronological.value
  }> = {}

  drawerBubblesChronological.value.forEach(bubble => {
    const date = new Date(bubble.storedAt)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const dateKey = `${year}-${month}-${day}`

    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    let dateLabel = `${year}年${parseInt(month)}月${parseInt(day)}日`
    if (dateKey === `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`) {
      dateLabel = '今天'
    } else if (dateKey === `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`) {
      dateLabel = '昨天'
    }

    if (!groups[dateKey]) {
      groups[dateKey] = {
        dateKey,
        dateLabel,
        bubbles: []
      }
    }
    groups[dateKey].bubbles.push(bubble)
  })

  return Object.values(groups)
})
</script>

<template>
  <div class="mood-drawer fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" @click.self="emit('close')">
    <div ref="drawerRef" class="drawer-container w-full max-w-2xl h-[85vh] max-h-[700px] rounded-3xl bg-wall-surface/95 backdrop-blur-xl border border-white/10 shadow-2xl flex flex-col overflow-hidden animate-scale-in">
      <div class="header p-6 border-b border-white/10">
        <div class="flex items-center justify-between mb-4">
          <button
            class="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors"
            @click="emit('close')"
          >
            ✕
          </button>
          <h2 class="text-white text-xl font-medium font-display flex items-center gap-2">
            <span class="text-2xl">🗄️</span>
            心情抽屉
          </h2>
          <div class="w-10"></div>
        </div>

        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="px-4 py-2 rounded-xl bg-gradient-to-br from-slate-500/20 to-slate-600/20 border border-white/10">
              <span class="text-white/60 text-sm">暂存的心情</span>
              <span class="text-white text-lg font-mono font-medium ml-2">{{ drawerCount }}</span>
            </div>
          </div>
          <button
            v-if="hasItems"
            class="px-3 py-2 rounded-lg text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
            @click="handleClearAll"
          >
            清空抽屉
          </button>
        </div>
      </div>

      <div class="content flex-1 overflow-y-auto p-6">
        <div v-if="!hasItems" class="empty-state text-center py-16">
          <div class="text-6xl mb-4 animate-float">🗄️</div>
          <p class="text-white/60 text-base font-display mb-2">抽屉空空的</p>
          <p class="text-white/30 text-sm">投心情时选择「存进抽屉」，把犹豫的心情先放一放</p>
        </div>

        <div v-else class="space-y-6">
          <div v-for="group in groupedByDate" :key="group.dateKey">
            <div class="flex items-center gap-2 mb-3">
              <span class="text-white/60 text-sm font-medium font-display">{{ group.dateLabel }}</span>
              <span class="text-white/30 text-xs font-mono">{{ group.bubbles.length }} 条</span>
              <div class="flex-1 h-px bg-white/10"></div>
            </div>

            <div class="space-y-3">
              <div
                v-for="(bubble, index) in group.bubbles"
                :key="bubble.id"
                class="bubble-card p-4 rounded-2xl border transition-all duration-300"
                :style="{
                  background: getBubbleGradient(bubble.emotionId),
                  borderColor: getEmotionBorder(bubble.emotionId),
                  animationDelay: `${index * 0.05}s`
                }"
                :class="{ 'card-publishing': publishingId === bubble.id }"
              >
                <div class="flex items-start gap-3">
                  <div class="emoji-wrapper w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                    <span class="text-2xl animate-float-slow" :style="{ animationDelay: `${index * 0.2}s` }">
                      {{ getEmotion(bubble.emotionId)?.emoji || '💭' }}
                    </span>
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center justify-between mb-1">
                      <span class="text-white/60 text-xs font-mono">{{ formatTime(bubble.storedAt) }}</span>
                      <span class="text-white/40 text-xs">
                        {{ getEmotion(bubble.emotionId)?.name || '心情' }}
                      </span>
                    </div>
                    <div class="bubble-text mb-3">
                      <p
                        v-if="bubble.text"
                        class="text-white text-sm font-display leading-relaxed"
                      >
                        {{ bubble.text }}
                      </p>
                      <p v-else class="text-white/40 text-sm italic">
                        （无声的心情）
                      </p>
                    </div>

                    <Transition name="fade">
                      <div v-if="deletingId !== bubble.id" class="actions flex gap-2">
                        <button
                          class="flex-1 h-9 px-3 rounded-lg text-sm font-medium text-white transition-all duration-200 flex items-center justify-center gap-1"
                          :class="{
                            'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400': !publishingId,
                            'bg-white/10 text-white/30 cursor-wait': publishingId === bubble.id
                          }"
                          :disabled="publishingId === bubble.id"
                          @click="handlePublish(bubble.id)"
                        >
                          <span v-if="publishingId === bubble.id">发布中...</span>
                          <template v-else>
                            <span>✨</span>
                            <span>放上墙</span>
                          </template>
                        </button>
                        <button
                          class="h-9 px-4 rounded-lg text-sm text-white/60 hover:text-red-400 hover:bg-red-500/20 transition-all duration-200 flex items-center justify-center gap-1"
                          :disabled="!!publishingId"
                          @click="handleDelete(bubble.id)"
                        >
                          <span>🗑️</span>
                          <span>删除</span>
                        </button>
                      </div>
                    </Transition>

                    <Transition name="fade">
                      <div v-if="deletingId === bubble.id" class="delete-confirm flex gap-2">
                        <span class="flex-1 flex items-center text-white/60 text-sm">确定删除这条心情？</span>
                        <button
                          class="h-9 px-4 rounded-lg text-sm text-white/40 hover:text-white/60 transition-colors"
                          @click="cancelDelete"
                        >
                          取消
                        </button>
                        <button
                          class="h-9 px-4 rounded-lg text-sm text-white bg-red-500 hover:bg-red-400 transition-colors"
                          @click="confirmDelete(bubble.id)"
                        >
                          删除
                        </button>
                      </div>
                    </Transition>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="footer p-6 border-t border-white/10">
        <div class="text-center text-white/30 text-xs">
          抽屉里的心情只有你能看见 · 所有数据存储在你的浏览器本地
        </div>
      </div>
    </div>

    <Transition name="fade">
      <div
        v-if="showClearConfirm"
        class="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm"
        @click.self="cancelClearAll"
      >
        <div class="confirm-dialog w-[90vw] max-w-sm p-6 rounded-2xl bg-wall-surface/95 backdrop-blur-xl border border-white/10 shadow-2xl animate-scale-in">
          <div class="text-center mb-6">
            <div class="text-4xl mb-3">🗑️</div>
            <h3 class="text-white text-lg font-medium mb-2">清空抽屉？</h3>
            <p class="text-white/50 text-sm">这将删除所有 {{ drawerCount }} 条暂存的心情，此操作不可撤销。</p>
          </div>
          <div class="flex gap-3">
            <button
              class="flex-1 h-11 rounded-lg text-white/60 bg-white/5 hover:bg-white/10 transition-colors"
              @click="cancelClearAll"
            >
              再想想
            </button>
            <button
              class="flex-1 h-11 rounded-lg text-white bg-red-500 hover:bg-red-400 transition-colors font-medium"
              @click="confirmClearAll"
            >
              确认清空
            </button>
          </div>
        </div>
      </div>
    </Transition>
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
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.content::-webkit-scrollbar {
  width: 4px;
}

.content::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
}

.content::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
}

.content::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}

.bubble-card {
  animation: cardFloatIn 0.4s cubic-bezier(0.4, 0, 0.2, 1) backwards;
}

@keyframes cardFloatIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.card-publishing {
  animation: publishingPulse 0.6s ease-in-out;
}

@keyframes publishingPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.02); }
}

.animate-float-slow {
  animation: floatSlow 4s ease-in-out infinite;
}

@keyframes floatSlow {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}

.animate-float {
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}
</style>
