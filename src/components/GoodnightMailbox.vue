<script setup lang="ts">
import { ref, computed } from 'vue'
import { useEmotions } from '@/composables/useEmotions'
import { useGoodnightMailbox } from '@/composables/useGoodnightMailbox'
import { useEffects } from '@/composables/useEffects'

const emit = defineEmits<{
  (e: 'close'): void
}>()

const { emotions } = useEmotions()
const {
  availableMessages,
  pendingMessages,
  unreadCount,
  addNightMessage,
  markAsRead,
  markAllAsRead,
  getMessageEmotion,
  formatTimeAgo,
  formatAvailableTime
} = useGoodnightMailbox()
const { triggerEffect } = useEffects()

const activeTab = ref<'write' | 'letters'>('write')
const selectedEmotionId = ref<string | null>(null)
const messageText = ref('')
const isSubmitting = ref(false)
const mailboxRef = ref<HTMLElement | null>(null)

const canSubmit = computed(() => selectedEmotionId.value && messageText.value.trim().length > 0)

const selectEmotion = (id: string) => {
  selectedEmotionId.value = id
}

const handleSubmit = async () => {
  if (!canSubmit.value || isSubmitting.value) return

  isSubmitting.value = true

  if (mailboxRef.value) {
    triggerEffect('sparkle', mailboxRef.value, {})
  }

  setTimeout(() => {
    addNightMessage(messageText.value, selectedEmotionId.value!)

    messageText.value = ''
    selectedEmotionId.value = null
    activeTab.value = 'letters'
    isSubmitting.value = false
  }, 800)
}

const handleReadMessage = (messageId: string) => {
  markAsRead(messageId)
}

const groupMessagesByDate = computed(() => {
  const groups: Record<string, typeof availableMessages.value> = {}

  availableMessages.value.forEach(message => {
    const date = new Date(message.createdAt)
    const dateKey = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
    if (!groups[dateKey]) {
      groups[dateKey] = []
    }
    groups[dateKey].push(message)
  })

  return Object.entries(groups)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([dateKey, messages]) => ({
      dateKey,
      dateLabel: formatDateLabel(dateKey),
      messages
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

const handleTabChange = (tab: 'write' | 'letters') => {
  activeTab.value = tab
}
</script>

<template>
  <div class="goodnight-mailbox fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
    <div class="panel relative w-[92vw] max-w-lg h-[85vh] max-h-[700px] rounded-3xl bg-wall-surface/95 backdrop-blur-xl border border-white/10 shadow-2xl flex flex-col overflow-hidden">
      <button
        class="close-btn absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/20 transition-colors"
        @click="emit('close')"
      >
        ✕
      </button>

      <div class="header px-6 pt-6 pb-4 text-center border-b border-white/10">
        <div class="inline-block mb-3">
          <div ref="mailboxRef" class="mailbox-icon text-5xl">
            💌
          </div>
        </div>
        <h2 class="text-white text-2xl font-medium mb-2">晚安信箱</h2>
        <p class="text-white/50 text-sm">给明天的自己留一句话，明早醒来再看</p>
      </div>

      <div class="tabs flex border-b border-white/10">
        <button
          class="flex-1 py-3 text-sm font-medium transition-colors relative"
          :class="{
            'text-white': activeTab === 'write',
            'text-white/40 hover:text-white/60': activeTab !== 'write'
          }"
          @click="handleTabChange('write')"
        >
          写留言
          <div
            v-if="activeTab === 'write'"
            class="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
          ></div>
        </button>
        <button
          class="flex-1 py-3 text-sm font-medium transition-colors relative"
          :class="{
            'text-white': activeTab === 'letters',
            'text-white/40 hover:text-white/60': activeTab !== 'letters'
          }"
          @click="handleTabChange('letters')"
        >
          我的信箱
          <span
            v-if="unreadCount > 0"
            class="ml-1 px-1.5 py-0.5 text-[10px] bg-indigo-500 text-white rounded-full font-mono"
          >
            {{ unreadCount }}
          </span>
          <div
            v-if="activeTab === 'letters'"
            class="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
          ></div>
        </button>
      </div>

      <div class="content flex-1 overflow-y-auto">
        <div v-if="activeTab === 'write'" class="p-6">
          <div class="emotion-picker mb-5">
            <p class="text-white/60 text-sm mb-3">今晚的心情是？</p>
            <div class="flex gap-2 overflow-x-auto pb-2">
              <button
                v-for="emotion in emotions"
                :key="emotion.id"
                class="emotion-btn flex-shrink-0 w-16 h-16 rounded-xl flex items-center justify-center text-3xl transition-all duration-200 border-2"
                :class="{
                  'border-white/40 scale-110': selectedEmotionId === emotion.id,
                  'border-transparent hover:bg-white/5': selectedEmotionId !== emotion.id
                }"
                :style="{
                  background: selectedEmotionId === emotion.id
                    ? `linear-gradient(135deg, ${emotion.color.from}44, ${emotion.color.to}44)`
                    : 'transparent'
                }"
                @click="selectEmotion(emotion.id)"
              >
                {{ emotion.emoji }}
              </button>
            </div>
          </div>

          <div class="text-input mb-6">
            <p class="text-white/60 text-sm mb-2">想对明天的自己说什么？</p>
            <textarea
              v-model="messageText"
              class="w-full h-36 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 resize-none focus:outline-none focus:border-indigo-500/50 transition-colors text-base"
              placeholder="明天也要加油呀~"
              maxlength="100"
              :disabled="isSubmitting"
            ></textarea>
            <div class="text-right text-xs text-white/30 mt-1 font-mono">
              {{ messageText.length }}/100
            </div>
          </div>

          <div class="hint mb-6 p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
            <div class="flex items-start gap-3">
              <span class="text-2xl">🌙</span>
              <div>
                <p class="text-white/70 text-sm">这封信会在明天零点自动解锁</p>
                <p class="text-white/40 text-xs mt-1">同时会变成心情气泡漂浮在墙上</p>
              </div>
            </div>
          </div>

          <button
            class="submit-btn w-full h-14 rounded-xl font-medium text-lg text-white transition-all duration-300 relative overflow-hidden"
            :class="{
              'bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 cursor-pointer shadow-lg shadow-indigo-500/30': canSubmit && !isSubmitting,
              'bg-white/10 text-white/30 cursor-not-allowed': !canSubmit || isSubmitting
            }"
            :disabled="!canSubmit || isSubmitting"
            @click="handleSubmit"
          >
            <span v-if="!isSubmitting">💌 投入信箱</span>
            <span v-else>信件投递中...</span>
          </button>

          <div v-if="pendingMessages.length > 0" class="mt-6">
            <p class="text-white/40 text-sm mb-3">等待解锁的信件</p>
            <div class="space-y-2">
              <div
                v-for="message in pendingMessages"
                :key="message.id"
                class="p-4 rounded-xl bg-white/5 border border-white/10"
              >
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <span class="text-2xl">{{ getMessageEmotion(message)?.emoji || '💭' }}</span>
                    <span class="text-white/20 text-sm">••••••</span>
                  </div>
                  <span class="text-white/40 text-xs font-mono">
                    {{ formatAvailableTime(message.availableAt) }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="p-6">
          <div v-if="availableMessages.length === 0" class="text-center py-12">
            <div class="text-6xl mb-4">📭</div>
            <p class="text-white/50 text-sm">信箱空空的</p>
            <p class="text-white/30 text-xs mt-2">给明天的自己写第一封信吧</p>
          </div>

          <div v-else>
            <div
              v-if="unreadCount > 0"
              class="mb-4 flex justify-end">
              <button
                class="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                @click="markAllAsRead"
              >
                全部标为已读
              </button>
            </div>

            <div class="space-y-6">
              <div v-for="group in groupMessagesByDate" :key="group.dateKey">
                <div class="flex items-center gap-2 mb-3">
                  <span class="text-white/30 text-xs font-medium">{{ group.dateLabel }}</span>
                  <div class="flex-1 h-px bg-white/10"></div>
                </div>

                <div class="space-y-3">
                  <div
                    v-for="message in group.messages"
                    :key="message.id"
                    class="message-card p-4 rounded-xl border transition-all duration-300 cursor-pointer"
                    :class="{
                      'bg-white/5 border-white/10 hover:bg-white/10': message.isRead,
                      'bg-indigo-500/10 border-indigo-500/30': !message.isRead
                    }"
                    @click="handleReadMessage(message.id)"
                  >
                    <div class="flex items-start gap-3">
                      <div class="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                        :style="{
                          background: `linear-gradient(135deg, ${getMessageEmotion(message)?.color.from || '#666'}44, ${getMessageEmotion(message)?.color.to || '#666'}44)`
                        }"
                      >
                        {{ getMessageEmotion(message)?.emoji || '💭' }}
                      </div>
                      <div class="flex-1 min-w-0">
                        <p class="text-white text-sm leading-relaxed break-words">
                          {{ message.text }}
                        </p>
                        <div class="flex items-center gap-2 mt-2">
                          <span class="text-white/30 text-xs font-mono">
                            {{ formatTimeAgo(message.createdAt) }}
                          </span>
                          <span
                            v-if="!message.isRead"
                            class="text-indigo-400 text-xs">
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
  </div>
</template>

<style scoped>
.mailbox-icon {
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
}

.emotion-picker::-webkit-scrollbar {
  height: 4px;
}

.emotion-picker::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 2px;
}

.emotion-picker::-webkit-scrollbar-thumb {
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

.message-card {
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
