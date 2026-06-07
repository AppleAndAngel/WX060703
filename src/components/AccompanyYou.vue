<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useBubbles } from '@/composables/useBubbles'
import { useCompanion } from '@/composables/useCompanion'
import { useEmotions } from '@/composables/useEmotions'
import { useEffects } from '@/composables/useEffects'

const emit = defineEmits<{
  (e: 'close'): void
}>()

const { bubbles } = useBubbles()
const {
  currentBubble,
  receivedRecords,
  sentRecords,
  unreadCount,
  warmResponses,
  startCompanion,
  sendResponse,
  skipBubble,
  markAsRead,
  markAllAsRead,
  formatTimeAgo
} = useCompanion()
const { getEmotion } = useEmotions()
const { triggerEffect } = useEffects()

const stage = ref<'companion' | 'records'>('companion')
const subStage = ref<'idle' | 'finding' | 'viewing' | 'response' | 'sent'>('idle')
const selectedResponse = ref('')
const customResponse = ref('')
const companionRef = ref<HTMLElement | null>(null)
const activeTab = ref<'received' | 'sent'>('received')

const emotion = computed(() => {
  if (!currentBubble.value) return undefined
  return getEmotion(currentBubble.value.emotionId)
})

const bubbleGradient = computed(() => {
  if (!emotion.value) return ''
  return `radial-gradient(circle at 30% 30%, ${emotion.value.color.from}cc, ${emotion.value.color.to}88 60%, ${emotion.value.color.to}44)`
})

const timeAgo = computed(() => {
  if (!currentBubble.value) return ''
  const diff = Date.now() - currentBubble.value.createdAt
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(hours / 24)
  if (days > 0) return `${days} 天前`
  if (hours > 0) return `${hours} 小时前`
  return '刚刚'
})

const canSend = computed(() => {
  return selectedResponse.value.length > 0 || customResponse.value.trim().length > 0
})

const finalResponse = computed(() => {
  return customResponse.value.trim() || selectedResponse.value
})

const startFinding = () => {
  subStage.value = 'finding'
  selectedResponse.value = ''
  customResponse.value = ''
  startCompanion(bubbles)

  setTimeout(() => {
    if (currentBubble.value) {
      subStage.value = 'viewing'
    }
  }, 1300)
}

const selectResponse = (response: string) => {
  selectedResponse.value = response
  customResponse.value = ''
  subStage.value = 'response'
}

const writeCustom = () => {
  selectedResponse.value = ''
  subStage.value = 'response'
}

const handleSend = () => {
  if (!currentBubble.value || !canSend.value) return

  if (companionRef.value) {
    triggerEffect('sparkle', companionRef.value, {})
  }

  sendResponse(currentBubble.value, finalResponse.value, bubbles)
  subStage.value = 'sent'
}

const handleSkip = () => {
  skipBubble()
  startFinding()
}

const accompanyAgain = () => {
  subStage.value = 'idle'
  selectedResponse.value = ''
  customResponse.value = ''
}

const handleReadRecord = (recordId: string) => {
  markAsRead(recordId)
}

const handleTabChange = (tab: 'received' | 'sent') => {
  activeTab.value = tab
}

const switchToRecords = () => {
  stage.value = 'records'
}

const switchToCompanion = () => {
  stage.value = 'companion'
}

const groupRecordsByDate = computed(() => {
  const records = activeTab.value === 'received' ? receivedRecords.value : sentRecords.value
  const groups: Record<string, typeof records> = {}

  records.forEach(record => {
    const date = new Date(record.timestamp)
    const dateKey = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
    if (!groups[dateKey]) {
      groups[dateKey] = []
    }
    groups[dateKey].push(record)
  })

  return Object.entries(groups)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([dateKey, records]) => ({
      dateKey,
      dateLabel: formatDateLabel(dateKey),
      records
    }))
})

const formatDateLabel = (dateKey: string): string => {
  const [year, month, day] = dateKey.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const messageDate = new Date(year, month - 1, day)

  if (messageDate.getTime() === today.getTime()) return '今天'
  if (messageDate.getTime() === yesterday.getTime()) return '昨天'

  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return `${month}月${day}日 ${weekdays[date.getDay()]}`
}

const getRecordEmotion = (emotionId: string) => {
  return getEmotion(emotionId)
}

onMounted(() => {
  if (subStage.value === 'idle') {
    startFinding()
  }
})
</script>

<template>
  <div class="accompany-you fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
    <div class="panel relative w-[92vw] max-w-lg h-[85vh] max-h-[700px] rounded-3xl bg-wall-surface/95 backdrop-blur-xl border border-white/10 shadow-2xl flex flex-col overflow-hidden">
      <button
        class="close-btn absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/20 transition-colors"
        @click="emit('close')"
      >
        ✕
      </button>

      <div class="header px-6 pt-6 pb-4 text-center border-b border-white/10">
        <div class="inline-block mb-3">
          <div ref="companionRef" class="companion-icon text-5xl">
            🫂
          </div>
        </div>
        <h2 class="text-white text-2xl font-medium mb-2">陪你一下</h2>
        <p class="text-white/50 text-sm">遇见陌生人的心情，送出一份温暖的陪伴</p>
      </div>

      <div class="tabs flex border-b border-white/10">
        <button
          class="flex-1 py-3 text-sm font-medium transition-colors relative"
          :class="{
            'text-white': stage === 'companion',
            'text-white/40 hover:text-white/60': stage !== 'companion'
          }"
          @click="switchToCompanion"
        >
          陪伴
          <div
            v-if="stage === 'companion'"
            class="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-gradient-to-r from-rose-500 to-pink-500 rounded-full"
          ></div>
        </button>
        <button
          class="flex-1 py-3 text-sm font-medium transition-colors relative"
          :class="{
            'text-white': stage === 'records',
            'text-white/40 hover:text-white/60': stage !== 'records'
          }"
          @click="switchToRecords"
        >
          记录
          <span
            v-if="unreadCount > 0"
            class="ml-1 px-1.5 py-0.5 text-[10px] bg-rose-500 text-white rounded-full font-mono"
          >
            {{ unreadCount }}
          </span>
          <div
            v-if="stage === 'records'"
            class="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-gradient-to-r from-rose-500 to-pink-500 rounded-full"
          ></div>
        </button>
      </div>

      <div class="content flex-1 overflow-y-auto">
        <div v-if="stage === 'companion'" class="p-6">
          <Transition name="fade" mode="out-in">
            <div v-if="subStage === 'finding'" key="finding" class="text-center py-12">
              <div class="inline-block mb-6">
                <div class="text-7xl animate-pulse">💭</div>
              </div>
              <h2 class="text-white text-xl font-medium mb-3">正在寻找...</h2>
              <p class="text-white/50 text-sm mb-6">在人群中寻找一颗需要陪伴的心</p>
              <div class="flex justify-center gap-1">
                <div class="w-2 h-2 rounded-full bg-pink-400 animate-bounce" style="animation-delay: 0s"></div>
                <div class="w-2 h-2 rounded-full bg-pink-400 animate-bounce" style="animation-delay: 0.2s"></div>
                <div class="w-2 h-2 rounded-full bg-pink-400 animate-bounce" style="animation-delay: 0.4s"></div>
              </div>
            </div>

            <div v-else-if="subStage === 'viewing' && currentBubble" key="viewing" class="text-center">
              <div class="inline-block mb-4 animate-bubble-float">
                <div
                  class="bubble-view w-28 h-28 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/20 mx-auto"
                  :style="{ background: bubbleGradient, boxShadow: `0 0 40px ${emotion?.color.from}44` }"
                >
                  <span class="text-5xl">{{ emotion?.emoji || '💭' }}</span>
                </div>
              </div>

              <h2 class="text-white text-lg font-medium mb-1">遇见了一颗心情</h2>
              <p class="text-white/40 text-xs mb-4">{{ timeAgo }} · {{ currentBubble.empathyCount }} 人共情</p>

              <div class="message-preview p-5 rounded-2xl bg-white/5 border border-white/10 mb-6">
                <p class="text-white/90 text-lg leading-relaxed">"{{ currentBubble.text }}"</p>
              </div>

              <p class="text-white/50 text-sm mb-5">想对TA说些什么？</p>

              <div class="space-y-2 mb-5">
                <button
                  v-for="(response, index) in warmResponses.slice(0, 4)"
                  :key="index"
                  class="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white/80 text-left transition-all hover:bg-white/10 hover:border-pink-500/30 hover:text-white"
                  @click="selectResponse(response)"
                >
                  {{ response }}
                </button>
              </div>

              <button
                class="w-full p-3 rounded-xl bg-gradient-to-r from-rose-500/20 to-pink-500/20 border border-rose-500/30 text-rose-300 transition-all hover:from-rose-500/30 hover:to-pink-500/30"
                @click="writeCustom"
              >
                ✏️ 写一句自定义的话
              </button>

              <button
                class="w-full mt-3 p-2 text-white/30 text-sm transition-colors hover:text-white/50"
                @click="handleSkip"
              >
                换一个 →
              </button>
            </div>

            <div v-else-if="subStage === 'response' && currentBubble" key="response">
              <div class="flex items-center gap-3 mb-5 p-4 rounded-xl bg-white/5 border border-white/10">
                <div
                  class="w-14 h-14 rounded-full flex items-center justify-center text-2xl flex-shrink-0"
                  :style="{ background: bubbleGradient }"
                >
                  {{ emotion?.emoji || '💭' }}
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-white/70 text-sm leading-relaxed truncate">"{{ currentBubble.text }}"</p>
                  <p class="text-white/30 text-xs mt-1">{{ timeAgo }}</p>
                </div>
              </div>

              <p class="text-white/60 text-sm mb-3">你想说：</p>

              <textarea
                v-if="selectedResponse === ''"
                v-model="customResponse"
                class="w-full h-32 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 resize-none focus:outline-none focus:border-rose-500/50 transition-colors text-base mb-4"
                placeholder="写下你想对TA说的话..."
                maxlength="100"
                autofocus
              ></textarea>

              <div v-else class="p-4 rounded-xl bg-gradient-to-r from-rose-500/20 to-pink-500/20 border border-rose-500/30 mb-4">
                <p class="text-rose-200 text-lg">"{{ selectedResponse }}"</p>
              </div>

              <div v-if="selectedResponse === ''" class="text-right text-xs text-white/30 mb-4 font-mono">
                {{ customResponse.length }}/100
              </div>

              <div class="flex gap-3">
                <button
                  class="flex-1 h-12 rounded-xl bg-white/10 text-white/70 font-medium transition-all hover:bg-white/15"
                  @click="subStage = 'viewing'"
                >
                  ← 返回
                </button>
                <button
                  class="flex-1 h-12 rounded-xl font-medium shadow-lg transition-all"
                  :class="{
                    'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-rose-500/30 hover:from-rose-400 hover:to-pink-400': canSend,
                    'bg-white/10 text-white/30 cursor-not-allowed': !canSend
                  }"
                  :disabled="!canSend"
                  @click="handleSend"
                >
                  🫂 送出陪伴
                </button>
              </div>
            </div>

            <div v-else-if="subStage === 'sent'" key="sent" class="text-center py-8">
              <div class="inline-block mb-4">
                <div class="text-7xl animate-pulse-glow">💗</div>
              </div>

              <h2 class="text-white text-xl font-medium mb-2">陪伴已送达！</h2>
              <p class="text-white/50 text-sm mb-6">远方的陌生人会收到你的温暖 🫂</p>

              <div class="p-5 rounded-2xl bg-gradient-to-br from-rose-500/20 to-pink-500/10 border border-rose-500/30 mb-6">
                <p class="text-rose-200 text-lg">"{{ finalResponse }}"</p>
              </div>

              <div class="flex gap-3">
                <button
                  class="flex-1 h-12 rounded-xl bg-white/10 text-white/70 font-medium transition-all hover:bg-white/15"
                  @click="emit('close')"
                >
                  关闭
                </button>
                <button
                  class="flex-1 h-12 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 text-white font-medium shadow-lg shadow-rose-500/30 transition-all hover:from-rose-400 hover:to-pink-400"
                  @click="accompanyAgain"
                >
                  💭 再陪一个
                </button>
              </div>
            </div>
          </Transition>
        </div>

        <div v-else class="p-6">
          <div class="sub-tabs flex gap-1 p-1 rounded-xl bg-white/5 mb-4">
            <button
              class="flex-1 py-2 text-sm font-medium rounded-lg transition-colors"
              :class="{
                'bg-white/10 text-white': activeTab === 'received',
                'text-white/40 hover:text-white/60': activeTab !== 'received'
              }"
              @click="handleTabChange('received')"
            >
              收到的陪伴
              <span
                v-if="unreadCount > 0 && activeTab !== 'received'"
                class="ml-1 px-1.5 py-0.5 text-[10px] bg-rose-500 text-white rounded-full font-mono"
              >
                {{ unreadCount }}
              </span>
            </button>
            <button
              class="flex-1 py-2 text-sm font-medium rounded-lg transition-colors"
              :class="{
                'bg-white/10 text-white': activeTab === 'sent',
                'text-white/40 hover:text-white/60': activeTab !== 'sent'
              }"
              @click="handleTabChange('sent')"
            >
              送出的陪伴
            </button>
          </div>

          <div
            v-if="activeTab === 'received' && unreadCount > 0"
            class="mb-4 flex justify-end">
            <button
              class="text-xs text-rose-400 hover:text-rose-300 transition-colors"
              @click="markAllAsRead"
            >
              全部标为已读
            </button>
          </div>

          <div v-if="groupRecordsByDate.length === 0" class="text-center py-12">
            <div class="text-6xl mb-4">📭</div>
            <p class="text-white/50 text-sm">还{{ activeTab === 'received' ? '没收到' : '没送出' }}过陪伴</p>
            <p class="text-white/30 text-xs mt-2">
              {{ activeTab === 'received' ? '送出一份陪伴，也许会收到回应' : '点击上方"陪伴"开始' }}
            </p>
          </div>

          <div v-else class="space-y-6">
            <div v-for="group in groupRecordsByDate" :key="group.dateKey">
              <div class="flex items-center gap-2 mb-3">
                <span class="text-white/30 text-xs font-medium">{{ group.dateLabel }}</span>
                <div class="flex-1 h-px bg-white/10"></div>
              </div>

              <div class="space-y-3">
                <div
                  v-for="record in group.records"
                  :key="record.id"
                  class="record-card p-4 rounded-xl border transition-all duration-300 cursor-pointer"
                  :class="{
                    'bg-white/5 border-white/10 hover:bg-white/10': record.isRead || record.direction === 'sent',
                    'bg-rose-500/10 border-rose-500/30': !record.isRead && record.direction === 'received'
                  }"
                  @click="handleReadRecord(record.id)"
                >
                  <div class="flex items-start gap-3">
                    <div
                      class="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                      :style="{
                        background: `linear-gradient(135deg, ${getRecordEmotion(record.bubbleEmotionId)?.color.from || '#666'}44, ${getRecordEmotion(record.bubbleEmotionId)?.color.to || '#666'}44)`
                      }"
                    >
                      {{ record.bubbleEmoji }}
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="text-white/60 text-xs mb-1">
                        {{ record.direction === 'received' ? 'TA 的心情' : '你的陪伴' }}
                      </p>
                      <p class="text-white text-sm leading-relaxed break-words mb-2">
                        {{ record.direction === 'received' ? `"${record.bubbleText}"` : `"${record.responseText}"` }}
                      </p>
                      <div class="pt-2 border-t border-white/10">
                        <p class="text-white/60 text-xs mb-1">
                          {{ record.direction === 'received' ? 'TA 收到的回应' : 'TA 的心情' }}
                        </p>
                        <p class="text-rose-300 text-sm leading-relaxed break-words">
                          "{{ record.direction === 'received' ? record.responseText : record.bubbleText }}"
                        </p>
                      </div>
                      <div class="flex items-center gap-2 mt-2">
                        <span class="text-white/30 text-xs font-mono">
                          {{ formatTimeAgo(record.timestamp) }}
                        </span>
                        <span
                          v-if="!record.isRead && record.direction === 'received'"
                          class="text-rose-400 text-xs">
                          新
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

.companion-icon {
  filter: drop-shadow(0 4px 8px rgba(244, 63, 94, 0.3));
}

.bubble-view {
  will-change: transform;
}

@keyframes bubble-float {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-8px);
  }
}

.bubble-view {
  animation: bubble-float 3s ease-in-out infinite;
}

@keyframes pulse-glow {
  0%, 100% {
    filter: drop-shadow(0 0 20px rgba(244, 63, 94, 0.5));
  }
  50% {
    filter: drop-shadow(0 0 40px rgba(244, 63, 94, 0.8));
  }
}

.animate-pulse-glow {
  animation: pulse-glow 2s ease-in-out infinite;
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

textarea::-webkit-scrollbar {
  width: 4px;
}

textarea::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 2px;
}

textarea::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
}

.record-card {
  animation: fadeInUp 0.4s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
