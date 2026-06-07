<script setup lang="ts">
import { ref, computed } from 'vue'
import { useEmotions } from '@/composables/useEmotions'
import { useDriftBottles } from '@/composables/useDriftBottles'
import { useEffects } from '@/composables/useEffects'

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'thrown'): void
}>()

const { emotions } = useEmotions()
const { throwBottle } = useDriftBottles()
const { triggerEffect } = useEffects()

const selectedEmotionId = ref<string | null>(null)
const moodText = ref('')
const isThrowing = ref(false)
const bottleRef = ref<HTMLElement | null>(null)

const canThrow = computed(() => selectedEmotionId.value && moodText.value.trim().length > 0)

const selectEmotion = (id: string) => {
  selectedEmotionId.value = id
}

const handleThrow = () => {
  if (!canThrow.value || isThrowing.value) return

  isThrowing.value = true

  if (bottleRef.value) {
    triggerEffect('sparkle', bottleRef.value, {})
  }

  setTimeout(() => {
    throwBottle(selectedEmotionId.value!, moodText.value)
    emit('thrown')

    setTimeout(() => {
      emit('close')
    }, 800)
  }, 1000)
}
</script>

<template>
  <div class="throw-bottle fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
    <div class="panel relative w-[90vw] max-w-md p-6 rounded-3xl bg-wall-surface/95 backdrop-blur-xl border border-white/10 shadow-2xl">
      <button
        class="close-btn absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/20 transition-colors"
        @click="emit('close')"
      >
        ✕
      </button>

      <div class="text-center mb-6">
        <div class="inline-block mb-3">
          <div
            ref="bottleRef"
            class="bottle-icon text-5xl animate-bottle-float"
            :class="{ 'animate-bottle-splash': isThrowing }"
          >
            🍾
          </div>
        </div>
        <h2 class="text-white text-2xl font-medium mb-2">扔一个漂流瓶</h2>
        <p class="text-white/50 text-sm">把此刻的心情塞进瓶子，漂向远方的陌生人</p>
      </div>

      <div class="emotion-picker mb-5">
        <p class="text-white/60 text-sm mb-3">选个表情代表心情</p>
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
        <p class="text-white/60 text-sm mb-2">写一句话塞进瓶子</p>
        <textarea
          v-model="moodText"
          class="w-full h-28 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 resize-none focus:outline-none focus:border-cyan-500/50 transition-colors text-base"
          placeholder="此刻想说的一句话..."
          maxlength="80"
          :disabled="isThrowing"
        ></textarea>
        <div class="text-right text-xs text-white/30 mt-1 font-mono">
          {{ moodText.length }}/80
        </div>
      </div>

      <button
        class="throw-btn w-full h-14 rounded-xl font-medium text-lg text-white transition-all duration-300 relative overflow-hidden"
        :class="{
          'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 cursor-pointer shadow-lg shadow-cyan-500/30': canThrow && !isThrowing,
          'bg-white/10 text-white/30 cursor-not-allowed': !canThrow || isThrowing
        }"
        :disabled="!canThrow || isThrowing"
        @click="handleThrow"
      >
        <span v-if="!isThrowing">🌊 扔出去</span>
        <span v-else>瓶子漂走中...</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.bottle-icon {
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
</style>
