<script setup lang="ts">
import { computed } from 'vue'
import type { RadioEmotionFilter } from '@/types'
import { useNightRadio } from '@/composables/useNightRadio'
import { useEmotions } from '@/composables/useEmotions'

const emit = defineEmits<{
  close: []
}>()

const {
  isPlaying,
  emotionFilter,
  currentClip,
  speechEnabled,
  playHistory,
  clipCounts,
  togglePlay,
  setEmotionFilter,
  toggleSpeech,
  skipNext
} = useNightRadio()

const { getEmotion } = useEmotions()

const filters: { id: RadioEmotionFilter; label: string; emoji: string }[] = [
  { id: 'all', label: '全部', emoji: '🎭' },
  { id: 'happy', label: '高兴', emoji: '😊' },
  { id: 'angry', label: '恼火', emoji: '😤' },
  { id: 'lonely', label: '孤单', emoji: '😔' }
]

const currentEmotion = computed(() => {
  if (!currentClip.value) return null
  return getEmotion(currentClip.value.emotionId)
})

const formatTime = (timestamp: number) => {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

const handleClose = () => {
  emit('close')
}
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="handleClose"></div>
    
    <div class="relative w-full max-w-lg bg-wall-surface/95 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
      <div class="p-6">
        <div class="flex items-center justify-between mb-6">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-2xl shadow-lg shadow-indigo-500/30">
              📻
            </div>
            <div>
              <h2 class="text-white text-xl font-medium">深夜电台</h2>
              <p class="text-white/40 text-xs">听听他们的心情故事</p>
            </div>
          </div>
          <button
            class="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors"
            @click="handleClose"
          >
            ✕
          </button>
        </div>

        <div class="relative h-48 rounded-2xl bg-gradient-to-br from-indigo-900/50 to-purple-900/50 border border-white/10 overflow-hidden mb-6">
          <div class="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(99,102,241,0.1),transparent_70%)]"></div>
          
          <div class="absolute inset-0 flex flex-col items-center justify-center p-6">
            <div v-if="currentClip" class="text-center">
              <div class="text-5xl mb-4 animate-bounce-slow">
                {{ currentEmotion?.emoji || '💭' }}
              </div>
              <p class="text-white text-lg font-medium mb-2 leading-relaxed">
                {{ currentClip.text }}
              </p>
              <div class="flex items-center justify-center gap-2 text-white/40 text-xs">
                <span>{{ currentEmotion?.name || '心情' }}</span>
                <span>·</span>
                <span v-if="currentClip.spokenAt">{{ formatTime(currentClip.spokenAt) }}</span>
              </div>
            </div>
            <div v-else class="text-center">
              <div class="text-5xl mb-4 opacity-50">📻</div>
              <p class="text-white/40 text-sm">暂无内容</p>
              <p class="text-white/30 text-xs mt-1">试试其他情绪分类</p>
            </div>
          </div>

          <div v-if="isPlaying" class="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-end gap-1 h-6">
            <div class="w-1 bg-indigo-400 rounded-full animate-sound-bar" style="animation-delay: 0s"></div>
            <div class="w-1 bg-indigo-400 rounded-full animate-sound-bar" style="animation-delay: 0.1s"></div>
            <div class="w-1 bg-indigo-400 rounded-full animate-sound-bar" style="animation-delay: 0.2s"></div>
            <div class="w-1 bg-indigo-400 rounded-full animate-sound-bar" style="animation-delay: 0.3s"></div>
            <div class="w-1 bg-indigo-400 rounded-full animate-sound-bar" style="animation-delay: 0.4s"></div>
          </div>
        </div>

        <div class="flex items-center justify-center gap-4 mb-6">
          <button
            class="w-12 h-12 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all"
            :class="{ 'text-indigo-400': speechEnabled }"
            @click="toggleSpeech"
            :title="speechEnabled ? '关闭语音' : '开启语音'"
          >
            <span v-if="speechEnabled" class="text-xl">🔊</span>
            <span v-else class="text-xl">🔇</span>
          </button>
          
          <button
            class="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 transition-all hover:scale-105 active:scale-95"
            @click="togglePlay"
          >
            <span v-if="isPlaying" class="text-2xl">⏸</span>
            <span v-else class="text-2xl ml-1">▶</span>
          </button>
          
          <button
            class="w-12 h-12 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all"
            @click="skipNext"
            title="下一个"
          >
            <span class="text-xl">⏭</span>
          </button>
        </div>

        <div class="mb-6">
          <p class="text-white/40 text-xs mb-3">选择心情频道</p>
          <div class="grid grid-cols-4 gap-2">
            <button
              v-for="filter in filters"
              :key="filter.id"
              class="flex flex-col items-center gap-1 p-3 rounded-xl transition-all"
              :class="[
                emotionFilter === filter.id
                  ? 'bg-gradient-to-br from-indigo-500/30 to-purple-600/30 border border-indigo-500/50 text-white'
                  : 'bg-white/5 hover:bg-white/10 border border-transparent text-white/60 hover:text-white'
              ]"
              @click="setEmotionFilter(filter.id)"
            >
              <span class="text-xl">{{ filter.emoji }}</span>
              <span class="text-xs">{{ filter.label }}</span>
              <span class="text-[10px] opacity-60">{{ clipCounts[filter.id] }}条</span>
            </button>
          </div>
        </div>

        <div v-if="playHistory.length > 0">
          <p class="text-white/40 text-xs mb-3">最近播放</p>
          <div class="space-y-2 max-h-32 overflow-y-auto">
            <div
              v-for="clip in [...playHistory].reverse().slice(0, 5)"
              :key="clip.id"
              class="flex items-center gap-3 p-2 rounded-lg bg-white/5"
            >
              <span class="text-lg">{{ clip.emoji }}</span>
              <span class="flex-1 text-white/70 text-sm truncate">{{ clip.text }}</span>
              <span v-if="clip.spokenAt" class="text-white/30 text-[10px]">{{ formatTime(clip.spokenAt) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.animate-bounce-slow {
  animation: bounce-slow 2s ease-in-out infinite;
}

@keyframes bounce-slow {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

.animate-sound-bar {
  animation: sound-bar 0.8s ease-in-out infinite;
}

@keyframes sound-bar {
  0%, 100% { height: 20%; }
  50% { height: 100%; }
}
</style>
