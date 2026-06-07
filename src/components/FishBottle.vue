<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useEmotions } from '@/composables/useEmotions'
import { useDriftBottles } from '@/composables/useDriftBottles'
import { useEffects } from '@/composables/useEffects'

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'fish'): void
}>()

const { getEmotion } = useEmotions()
const { fishBottle, empathizeBottle, throwBackBottle, bottleStats, currentBottle, setCurrentBottle } = useDriftBottles()
const { triggerEffect } = useEffects()

const stage = ref<'fishing' | 'preview' | 'revealed' | 'empty'>('fishing')
const bottleRef = ref<HTMLElement | null>(null)
const hasEmpathized = ref(false)

const emotion = computed(() => {
  if (!currentBottle.value) return undefined
  return getEmotion(currentBottle.value.emotionId)
})

const bottleGradient = computed(() => {
  if (!emotion.value) return ''
  return `radial-gradient(circle at 30% 30%, ${emotion.value.color.from}cc, ${emotion.value.color.to}88 60%, ${emotion.value.color.to}44)`
})

const timeAgo = computed(() => {
  if (!currentBottle.value) return ''
  const diff = Date.now() - currentBottle.value.createdAt
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(hours / 24)
  if (days > 0) return `${days} 天前`
  if (hours > 0) return `${hours} 小时前`
  return '刚刚'
})

const startFishing = () => {
  stage.value = 'fishing'
  setCurrentBottle(null)
  hasEmpathized.value = false

  setTimeout(() => {
    const bottle = fishBottle()
    if (bottle) {
      setCurrentBottle(bottle)
      stage.value = 'preview'
      emit('fish')
    } else {
      stage.value = 'empty'
    }
  }, 1500)
}

const handleEmpathize = () => {
  if (!currentBottle.value || hasEmpathized.value) return

  hasEmpathized.value = true

  if (bottleRef.value) {
    triggerEffect('sparkle', bottleRef.value, {})
  }

  empathizeBottle(currentBottle.value.id)
  stage.value = 'revealed'
}

const handleThrowBack = () => {
  if (!currentBottle.value) return
  throwBackBottle(currentBottle.value.id)
  setCurrentBottle(null)
  startFishing()
}

const fishAgain = () => {
  startFishing()
}

onMounted(() => {
  startFishing()
})
</script>

<template>
  <div class="fish-bottle fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
    <div class="panel relative w-[90vw] max-w-md p-6 rounded-3xl bg-wall-surface/95 backdrop-blur-xl border border-white/10 shadow-2xl">
      <button
        class="close-btn absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/20 transition-colors"
        @click="emit('close')"
      >
        ✕
      </button>

      <Transition name="fade" mode="out-in">
        <div v-if="stage === 'fishing'" key="fishing" class="text-center py-8">
          <div class="inline-block mb-6 animate-wave">
            <div class="text-7xl">🌊</div>
          </div>
          <h2 class="text-white text-2xl font-medium mb-3">正在打捞...</h2>
          <p class="text-white/50 text-sm mb-6">海浪中漂浮着 {{ bottleStats.availableCount }} 个瓶子</p>
          <div class="flex justify-center gap-1">
            <div class="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style="animation-delay: 0s"></div>
            <div class="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style="animation-delay: 0.2s"></div>
            <div class="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style="animation-delay: 0.4s"></div>
          </div>
        </div>

        <div v-else-if="stage === 'preview'" key="preview" class="text-center">
          <div class="inline-block mb-4 animate-bottle-float">
            <div
              ref="bottleRef"
              class="bottle-preview w-32 h-32 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/20 mx-auto"
              :style="{ background: bottleGradient, boxShadow: `0 0 40px ${emotion?.color.from}44` }"
            >
              <span class="text-6xl">{{ emotion?.emoji || '🍾' }}</span>
            </div>
          </div>

          <h2 class="text-white text-xl font-medium mb-2">捞到一个瓶子！</h2>
          <p class="text-white/40 text-xs mb-4">{{ timeAgo }} 扔出</p>

          <div class="message-preview p-5 rounded-2xl bg-white/5 border border-white/10 mb-6">
            <p class="text-white/80 text-lg leading-relaxed">"{{ currentBottle?.text }}"</p>
          </div>

          <p class="text-white/50 text-sm mb-5">要给TA一个共情吗？</p>

          <div class="flex gap-3">
            <button
              class="flex-1 h-12 rounded-xl bg-white/10 text-white/70 font-medium transition-all hover:bg-white/15"
              @click="handleThrowBack"
            >
              🌊 扔回去
            </button>
            <button
              class="flex-1 h-12 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-medium shadow-lg shadow-pink-500/30 transition-all hover:from-pink-400 hover:to-rose-400 hover:shadow-pink-500/50"
              @click="handleEmpathize"
            >
              💗 共情
            </button>
          </div>
        </div>

        <div v-else-if="stage === 'revealed'" key="revealed" class="text-center">
          <div class="inline-block mb-4">
            <div
              class="bottle-revealed w-32 h-32 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/20 mx-auto animate-pulse-glow"
              :style="{ background: bottleGradient, boxShadow: `0 0 60px ${emotion?.color.from}66` }"
            >
              <span class="text-6xl">{{ emotion?.emoji || '🍾' }}</span>
            </div>
          </div>

          <h2 class="text-white text-xl font-medium mb-2">共情已送达！</h2>
          <p class="text-white/40 text-xs mb-4">{{ timeAgo }} 扔出 · {{ currentBottle?.empathyCount }} 人共情</p>

          <div class="message-full p-5 rounded-2xl bg-gradient-to-br from-pink-500/20 to-rose-500/10 border border-pink-500/30 mb-6">
            <p class="text-white text-lg leading-relaxed">"{{ currentBottle?.text }}"</p>
          </div>

          <p class="text-white/50 text-sm mb-5">远方的陌生人会收到你的温暖 💗</p>

          <div class="flex gap-3">
            <button
              class="flex-1 h-12 rounded-xl bg-white/10 text-white/70 font-medium transition-all hover:bg-white/15"
              @click="emit('close')"
            >
              关闭
            </button>
            <button
              class="flex-1 h-12 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-medium shadow-lg shadow-cyan-500/30 transition-all hover:from-cyan-400 hover:to-blue-400"
              @click="fishAgain"
            >
              🎣 再捞一个
            </button>
          </div>
        </div>

        <div v-else-if="stage === 'empty'" key="empty" class="text-center py-8">
          <div class="inline-block mb-6 opacity-50">
            <div class="text-7xl">🌊</div>
          </div>
          <h2 class="text-white text-xl font-medium mb-2">海里暂时没有瓶子了</h2>
          <p class="text-white/50 text-sm mb-6">你可以扔一个瓶子出去，或者稍后再来捞</p>

          <div class="flex gap-3">
            <button
              class="flex-1 h-12 rounded-xl bg-white/10 text-white/70 font-medium transition-all hover:bg-white/15"
              @click="emit('close')"
            >
              关闭
            </button>
            <button
              class="flex-1 h-12 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-medium shadow-lg shadow-cyan-500/30 transition-all hover:from-cyan-400 hover:to-blue-400"
              @click="fishAgain"
            >
              🔄 再试一次
            </button>
          </div>
        </div>
      </Transition>
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

.bottle-preview {
  will-change: transform;
}

.bottle-revealed {
  will-change: transform, box-shadow;
}

.bottle-revealed::before {
  content: '';
  position: absolute;
  top: 15%;
  left: 20%;
  width: 30%;
  height: 20%;
  background: rgba(255, 255, 255, 0.4);
  border-radius: 50%;
  filter: blur(2px);
  pointer-events: none;
}
</style>
