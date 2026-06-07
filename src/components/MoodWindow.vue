<script setup lang="ts">
import { ref } from 'vue'
import { useEmotions } from '@/composables/useEmotions'
import { useBubbles } from '@/composables/useBubbles'

const { emotions } = useEmotions()
const { addBubble } = useBubbles()

const isExpanded = ref(false)
const selectedEmotionId = ref<string | null>(null)
const moodText = ref('')

const selectEmotion = (id: string) => {
  selectedEmotionId.value = id
}

const submitMood = () => {
  if (!selectedEmotionId.value) return

  const text = moodText.value.trim() || undefined
  addBubble(selectedEmotionId.value, text)

  moodText.value = ''
  selectedEmotionId.value = null
  isExpanded.value = false
}

const toggleExpand = () => {
  isExpanded.value = !isExpanded.value
  if (!isExpanded.value) {
    selectedEmotionId.value = null
    moodText.value = ''
  }
}
</script>

<template>
  <div class="mood-window relative">
    <button
      class="toggle-btn w-14 h-14 rounded-full bg-gradient-to-br from-purple-500/80 to-pink-500/80 backdrop-blur-md border border-white/20 shadow-lg flex items-center justify-center text-white text-2xl transition-all duration-300 hover:scale-105 hover:shadow-purple-500/50"
      :class="{ 'rotate-45': isExpanded }"
      @click="toggleExpand"
    >
      +
    </button>

    <Transition name="slide">
      <div
        v-if="isExpanded"
        class="panel absolute bottom-full left-0 mb-4 w-80 p-5 rounded-2xl bg-wall-surface/90 backdrop-blur-xl border border-white/10 shadow-2xl"
      >
        <h3 class="text-white text-lg font-medium mb-4 font-display">投心情</h3>

        <div class="emotion-picker mb-4">
          <p class="text-white/60 text-sm mb-2">选个表情</p>
          <div class="flex gap-2 overflow-x-auto pb-2">
            <button
              v-for="emotion in emotions"
              :key="emotion.id"
              class="emotion-btn flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center text-2xl transition-all duration-200 border-2"
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

        <div class="text-input mb-4">
          <p class="text-white/60 text-sm mb-2">写点什么 <span class="text-white/30">(可选)</span></p>
          <textarea
            v-model="moodText"
            class="w-full h-20 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30 resize-none focus:outline-none focus:border-purple-500/50 transition-colors font-display"
            placeholder="此刻的心情..."
            maxlength="100"
          ></textarea>
          <div class="text-right text-xs text-white/30 mt-1 font-mono">
            {{ moodText.length }}/100
          </div>
        </div>

        <button
          class="submit-btn w-full h-11 rounded-lg font-medium text-white transition-all duration-200 font-display"
          :class="{
            'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 cursor-pointer': selectedEmotionId,
            'bg-white/10 text-white/30 cursor-not-allowed': !selectedEmotionId
          }"
          :disabled="!selectedEmotionId"
          @click="submitMood"
        >
          投上墙
        </button>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
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

.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  transform: translateY(10px) scale(0.95);
}
</style>
