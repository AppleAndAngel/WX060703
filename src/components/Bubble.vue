<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
import type { Bubble } from '@/types'
import { useEmotions } from '@/composables/useEmotions'
import { useEffects } from '@/composables/useEffects'
import { useBubbles } from '@/composables/useBubbles'

const props = defineProps<{
  bubble: Bubble
}>()

const { getEmotion } = useEmotions()
const { triggerEffect } = useEffects()
const { addEmpathy, addSparkleParticles, userId } = useBubbles()

const bubbleRef = ref<HTMLElement | null>(null)
const isPressing = ref(false)
const showTooltip = ref(false)

let pressTimer: ReturnType<typeof setTimeout> | null = null
let shakeCleanup: (() => void) | undefined

const emotion = computed(() => getEmotion(props.bubble.emotionId))

const scaleLevel = computed(() => {
  const levels = Math.floor(props.bubble.empathyCount / 5)
  return Math.min(levels, 5)
})

const bubbleSize = computed(() => {
  return 80 + scaleLevel.value * 8
})

const glowIntensity = computed(() => {
  return 0.3 + scaleLevel.value * 0.15
})

const isOwner = computed(() => props.bubble.ownerId === userId)

const floatStyle = computed(() => {
  const duration = props.bubble.floatDuration
  const offset = props.bubble.floatOffset
  return {
    animationDuration: `${duration}s`,
    animationDelay: `${offset * 0.5}s`,
    left: `${props.bubble.x}%`,
    top: `${props.bubble.y}%`,
  }
})

const bubbleGradient = computed(() => {
  if (!emotion.value) return ''
  return `radial-gradient(circle at 30% 30%, ${emotion.value.color.from}cc, ${emotion.value.color.to}88 60%, ${emotion.value.color.to}44)`
})

const glowStyle = computed(() => {
  if (!emotion.value) return ''
  return `0 0 ${20 + scaleLevel.value * 10}px ${emotion.value.color.from}, 0 0 ${40 + scaleLevel.value * 15}px ${emotion.value.color.to}44`
})

const handlePressStart = () => {
  if (isOwner.value) return

  isPressing.value = true
  pressTimer = setTimeout(() => {
    if (bubbleRef.value) {
      const result = triggerEffect('shake', bubbleRef.value)
      if (result && result.cleanup) {
        shakeCleanup = result.cleanup
      }
    }
  }, 200)
}

const handlePressEnd = () => {
  if (pressTimer) {
    clearTimeout(pressTimer)
    pressTimer = null
  }

  if (isPressing.value && !isOwner.value) {
    if (shakeCleanup) {
      shakeCleanup()
      shakeCleanup = undefined
    }

    addEmpathy(props.bubble.id)

    if (bubbleRef.value) {
      triggerEffect('sparkle', bubbleRef.value, {
        onSparkleCreated: (particles: any[]) => {
          addSparkleParticles(particles)
        }
      })
    }
  }

  isPressing.value = false
}

const handleMouseEnter = () => {
  if (props.bubble.text) {
    showTooltip.value = true
  }
}

const handleMouseLeave = () => {
  showTooltip.value = false
  handlePressEnd()
}

onUnmounted(() => {
  if (pressTimer) clearTimeout(pressTimer)
  if (shakeCleanup) shakeCleanup()
})
</script>

<template>
  <div
    ref="bubbleRef"
    class="bubble-wrapper absolute cursor-pointer select-none animate-float"
    :style="floatStyle"
    @mousedown="handlePressStart"
    @mouseup="handlePressEnd"
    @mouseleave="handleMouseLeave"
    @touchstart.prevent="handlePressStart"
    @touchend.prevent="handlePressEnd"
    @touchcancel.prevent="handlePressEnd"
    @mouseenter="handleMouseEnter"
  >
    <div
      class="bubble relative rounded-full flex items-center justify-center backdrop-blur-sm border border-white/20 transition-all duration-300"
      :class="{
        'ring-2 ring-white/50': isPressing,
        'animate-pulse-glow': scaleLevel > 0
      }"
      :style="{
        width: `${bubbleSize}px`,
        height: `${bubbleSize}px`,
        background: bubbleGradient,
        boxShadow: glowStyle,
        opacity: glowIntensity + 0.4,
        transform: `scale(${1 + scaleLevel * 0.05})`,
      }"
    >
      <span class="text-3xl" :style="{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }">
        {{ emotion?.emoji || '💭' }}
      </span>

      <div
        class="absolute -bottom-1 -right-1 min-w-6 h-6 px-1.5 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30"
      >
        <span class="text-xs font-mono font-medium text-white">
          {{ bubble.empathyCount }}
        </span>
      </div>

      <div
        v-if="isOwner"
        class="absolute -top-1 -left-1 w-4 h-4 rounded-full bg-green-500/80 border border-white/50 flex items-center justify-center"
        title="你的心情"
      >
        <span class="text-[8px]">我</span>
      </div>
    </div>

    <Transition name="fade">
      <div
        v-if="showTooltip && bubble.text"
        class="tooltip absolute left-1/2 -translate-x-1/2 bottom-full mb-3 px-4 py-2 rounded-lg bg-black/80 backdrop-blur-md border border-white/10 text-white text-sm whitespace-nowrap z-50"
      >
        {{ bubble.text }}
        <div class="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-black/80"></div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.bubble-wrapper {
  will-change: transform;
  transform: translate3d(0, 0, 0);
}

.bubble {
  will-change: transform, box-shadow;
}

.bubble::before {
  content: '';
  position: absolute;
  top: 15%;
  left: 20%;
  width: 30%;
  height: 20%;
  background: rgba(255, 255, 255, 0.4);
  border-radius: 50%;
  filter: blur(2px);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(4px);
}
</style>
