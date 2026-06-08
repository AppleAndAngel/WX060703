<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
import type { Bubble } from '@/types'
import { useEmotions } from '@/composables/useEmotions'
import { useEffects } from '@/composables/useEffects'
import { useBubbles } from '@/composables/useBubbles'
import { useNightRadio } from '@/composables/useNightRadio'

const props = defineProps<{
  bubble: Bubble
  quietMode?: boolean
}>()

const { getEmotion } = useEmotions()
const { triggerEffect } = useEffects()
const { addEmpathy, addSparkleParticles, userId } = useBubbles()
const { isBubblePlaying, isEnabled: radioEnabled } = useNightRadio()

const bubbleRef = ref<HTMLElement | null>(null)
const isPressing = ref(false)
const showTooltip = ref(false)
const pressProgress = ref(0)

let pressTimer: ReturnType<typeof setTimeout> | null = null
let shakeCleanup: (() => void) | undefined
let pressStartTime = 0
let hasTriggeredEmpathy = false

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
const isPlaying = computed(() => isBubblePlaying(props.bubble.id))

const floatStyle = computed(() => {
  const baseDuration = props.bubble.floatDuration
  const duration = props.quietMode ? baseDuration * 1.8 : baseDuration
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
  const glowMultiplier = props.quietMode ? 0.5 : 1
  const baseGlow = `0 0 ${(20 + scaleLevel.value * 10) * glowMultiplier}px ${emotion.value.color.from}, 0 0 ${(40 + scaleLevel.value * 15) * glowMultiplier}px ${emotion.value.color.to}44`
  if (isPressing.value) {
    return `${baseGlow}, 0 0 ${60 * glowMultiplier}px ${emotion.value.color.from}88`
  }
  if (isPlaying.value) {
    return `${baseGlow}, 0 0 ${80 * glowMultiplier}px ${emotion.value.color.from}aa, 0 0 ${120 * glowMultiplier}px ${emotion.value.color.to}66`
  }
  return baseGlow
})

let updateInterval: ReturnType<typeof setInterval> | null = null

const handlePressStart = () => {
  if (isOwner.value) return

  isPressing.value = true
  pressStartTime = Date.now()
  pressProgress.value = 0
  hasTriggeredEmpathy = false

  updateInterval = setInterval(() => {
    if (!isPressing.value) return

    const elapsed = Date.now() - pressStartTime
    pressProgress.value = Math.min(elapsed / 300, 1)

    if (elapsed >= 100 && !shakeCleanup && bubbleRef.value) {
      const result = triggerEffect('shake', bubbleRef.value)
      if (result && result.cleanup) {
        shakeCleanup = result.cleanup
      }
    }
  }, 16)
}

const handlePressEnd = () => {
  if (updateInterval) {
    clearInterval(updateInterval)
    updateInterval = null
  }

  if (pressTimer) {
    clearTimeout(pressTimer)
    pressTimer = null
  }

  const wasPressedLongEnough = pressProgress.value >= 0.5

  if (isPressing.value && !isOwner.value && wasPressedLongEnough && !hasTriggeredEmpathy) {
    hasTriggeredEmpathy = true

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
  pressProgress.value = 0
}

const handleMouseEnter = () => {
  if (props.bubble.text) {
    showTooltip.value = true
  }
}

const handleMouseLeave = () => {
  showTooltip.value = false
  if (isPressing.value) {
    handlePressEnd()
  }
}

onUnmounted(() => {
  if (pressTimer) clearTimeout(pressTimer)
  if (updateInterval) clearInterval(updateInterval)
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
      class="bubble-container relative"
      :style="{
        width: `${bubbleSize + 20}px`,
        height: `${bubbleSize + 20}px`,
      }"
    >
      <svg
        v-if="isPressing && !isOwner"
        class="progress-ring absolute inset-0 -m-2.5"
        :width="bubbleSize + 20"
        :height="bubbleSize + 20"
      >
        <circle
          :cx="(bubbleSize + 20) / 2"
          :cy="(bubbleSize + 20) / 2"
          :r="(bubbleSize + 10) / 2"
          fill="none"
          stroke="rgba(255,255,255,0.2)"
          stroke-width="3"
        />
        <circle
          :cx="(bubbleSize + 20) / 2"
          :cy="(bubbleSize + 20) / 2"
          :r="(bubbleSize + 10) / 2"
          fill="none"
          :stroke="emotion?.color.from || '#ffffff'"
          stroke-width="3"
          stroke-linecap="round"
          :stroke-dasharray="Math.PI * (bubbleSize + 10)"
          :stroke-dashoffset="Math.PI * (bubbleSize + 10) * (1 - pressProgress)"
          :transform="`rotate(-90 ${(bubbleSize + 20) / 2} ${(bubbleSize + 20) / 2})`"
        />
      </svg>

      <div
        class="bubble absolute inset-2.5 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/20 transition-all duration-200"
        :class="{
          'ring-2 ring-white/50': isPressing,
          'animate-pulse-glow': scaleLevel > 0,
          'animate-radio-play': isPlaying,
          'opacity-40': radioEnabled && !isPlaying
        }"
        :style="{
          background: bubbleGradient,
          boxShadow: glowStyle,
          opacity: isPlaying ? 1 : (glowIntensity + 0.4),
          transform: `scale(${1 + scaleLevel * 0.05 + (isPressing ? 0.05 : 0) + (isPlaying ? 0.1 : 0)})`,
        }"
      >
        <span class="text-3xl" :style="{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }">
          {{ emotion?.emoji || '💭' }}
        </span>

        <div
          class="absolute -bottom-1 -right-1 min-w-6 h-6 px-1.5 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 transition-all duration-300"
          :class="{ 'scale-125 bg-white/30': isPressing }"
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

.bubble-container {
  will-change: transform;
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
  pointer-events: none;
}

.progress-ring {
  pointer-events: none;
  z-index: 10;
}

.progress-ring circle:last-child {
  transition: stroke-dashoffset 0.05s linear;
  filter: drop-shadow(0 0 4px currentColor);
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

.animate-radio-play {
  animation: radio-pulse 1.5s ease-in-out infinite;
}

@keyframes radio-pulse {
  0%, 100% { 
    transform: scale(1); 
  }
  50% { 
    transform: scale(1.08); 
  }
}
</style>
