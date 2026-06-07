<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import type { Bubble } from '@/types'
import { useEmotions } from '@/composables/useEmotions'

const props = defineProps<{
  bubble: Bubble | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const { getEmotion } = useEmotions()
const canvasRef = ref<HTMLCanvasElement | null>(null)
const isGenerating = ref(true)
const cardUrl = ref('')
const showTip = ref(false)

const emotion = computed(() => props.bubble ? getEmotion(props.bubble.emotionId) : undefined)

const formatDate = (timestamp: number) => {
  const date = new Date(timestamp)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}.${month}.${day}`
}

const getEncouragement = (count: number) => {
  if (count >= 50) return '超级共鸣！'
  if (count >= 30) return '深深共鸣'
  if (count >= 20) return '强烈共鸣'
  if (count >= 10) return '温暖共鸣'
  if (count >= 5) return '有人懂你'
  return '收到心意'
}

const drawCard = async () => {
  if (!canvasRef.value || !props.bubble || !emotion.value) return

  const canvas = canvasRef.value
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  isGenerating.value = true

  const width = 750
  const height = 1200
  canvas.width = width
  canvas.height = height

  const gradient = ctx.createLinearGradient(0, 0, width, height)
  gradient.addColorStop(0, emotion.value.color.from + '20')
  gradient.addColorStop(0.5, '#1a1a2e')
  gradient.addColorStop(1, emotion.value.color.to + '15')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)

  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'
  for (let i = 0; i < 50; i++) {
    const x = Math.random() * width
    const y = Math.random() * height
    const size = Math.random() * 2 + 1
    ctx.beginPath()
    ctx.arc(x, y, size, 0, Math.PI * 2)
    ctx.fill()
  }

  const centerX = width / 2
  const centerY = 380

  const glowGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 280)
  glowGradient.addColorStop(0, emotion.value.color.from + '60')
  glowGradient.addColorStop(0.5, emotion.value.color.to + '30')
  glowGradient.addColorStop(1, 'transparent')
  ctx.fillStyle = glowGradient
  ctx.beginPath()
  ctx.arc(centerX, centerY, 280, 0, Math.PI * 2)
  ctx.fill()

  const bubbleGradient = ctx.createRadialGradient(centerX - 40, centerY - 40, 0, centerX, centerY, 160)
  bubbleGradient.addColorStop(0, emotion.value.color.from + 'dd')
  bubbleGradient.addColorStop(0.6, emotion.value.color.to + 'aa')
  bubbleGradient.addColorStop(1, emotion.value.color.to + '66')
  ctx.fillStyle = bubbleGradient
  ctx.beginPath()
  ctx.arc(centerX, centerY, 150, 0, Math.PI * 2)
  ctx.fill()

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
  ctx.lineWidth = 2
  ctx.stroke()

  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)'
  ctx.beginPath()
  ctx.ellipse(centerX - 50, centerY - 60, 45, 30, -0.3, 0, Math.PI * 2)
  ctx.fill()

  ctx.font = '120px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(emotion.value.emoji, centerX, centerY)

  ctx.fillStyle = 'rgba(255, 255, 255, 0.95)'
  ctx.font = 'bold 32px "Noto Sans SC", sans-serif'
  ctx.fillText('共 情 纪 念 卡', centerX, 620)

  ctx.fillStyle = emotion.value.color.from
  ctx.font = 'bold 64px "Noto Sans SC", sans-serif'
  ctx.fillText(`${props.bubble.empathyCount}`, centerX, 720)

  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
  ctx.font = '24px "Noto Sans SC", sans-serif'
  ctx.fillText('次 共 情', centerX, 770)

  ctx.fillStyle = emotion.value.color.from
  ctx.font = 'bold 28px "Noto Sans SC", sans-serif'
  ctx.fillText(getEncouragement(props.bubble.empathyCount), centerX, 830)

  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
  ctx.font = '20px "Noto Sans SC", sans-serif'
  ctx.fillText(`—— ${emotion.value.name}的心情 ——`, centerX, 880)

  const textY = 960
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
  ctx.font = 'bold 30px "Noto Sans SC", sans-serif'
  
  const text = props.bubble.text || '一个心情气泡'
  const maxWidth = 600
  const lineHeight = 42
  
  if (ctx.measureText(text).width > maxWidth) {
    let line1 = ''
    let line2 = ''
    for (let i = 0; i < text.length; i++) {
      const testLine = line1 + text[i]
      if (ctx.measureText(testLine).width <= maxWidth / 1.5) {
        line1 = testLine
      } else {
        line2 = text.slice(i)
        break
      }
    }
    if (line2) {
      ctx.fillText(line1, centerX, textY - 20)
      ctx.fillText(line2, centerX, textY + lineHeight - 20)
    } else {
      ctx.fillText(text, centerX, textY)
    }
  } else {
    ctx.fillText(text, centerX, textY)
  }

  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
  ctx.font = '20px "Noto Sans SC", sans-serif'
  ctx.fillText(`💭 匿名共情墙 · ${formatDate(props.bubble.createdAt)}`, centerX, 1100)

  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'
  ctx.font = '16px "Noto Sans SC", sans-serif'
  ctx.fillText('每一份共鸣，都是心灵的相遇', centerX, 1140)

  cardUrl.value = canvas.toDataURL('image/png', 0.95)
  isGenerating.value = false
}

const saveCard = () => {
  if (!cardUrl.value) return

  const link = document.createElement('a')
  link.download = `共情纪念卡_${emotion.value?.name}_${Date.now()}.png`
  link.href = cardUrl.value
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  showTip.value = true
  setTimeout(() => {
    showTip.value = false
  }, 2000)
}

watch(() => props.bubble, (newBubble) => {
  if (newBubble) {
    setTimeout(() => drawCard(), 100)
  }
}, { immediate: true })

onMounted(() => {
  if (props.bubble) {
    drawCard()
  }
})
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4" @click.self="emit('close')">
    <div class="absolute inset-0 bg-black/70 backdrop-blur-md" @click="emit('close')"></div>

    <div class="relative w-full max-w-md bg-wall-surface/95 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
      <div class="p-6 border-b border-white/10">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-white text-xl font-medium font-display flex items-center gap-2">
              <span class="text-2xl">💌</span>
              共情纪念卡
            </h2>
            <p class="text-white/40 text-sm mt-1">保存这份温暖的共鸣</p>
          </div>
          <button
            class="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/60 hover:text-white transition-colors"
            @click="emit('close')"
          >
            ✕
          </button>
        </div>
      </div>

      <div class="p-6">
        <div 
          class="relative rounded-2xl overflow-hidden shadow-xl border border-white/10"
          :style="{ boxShadow: `0 0 60px ${emotion?.color.from}40` }"
        >
          <canvas 
            ref="canvasRef" 
            class="w-full h-auto block"
            :style="{ aspectRatio: '750/1200' }"
          ></canvas>

          <div 
            v-if="isGenerating"
            class="absolute inset-0 bg-black/60 flex items-center justify-center"
          >
            <div class="text-center">
              <div class="w-12 h-12 border-4 border-white/20 border-t-white/80 rounded-full animate-spin mx-auto"></div>
              <p class="text-white/60 text-sm mt-3">正在生成纪念卡...</p>
            </div>
          </div>
        </div>

        <div v-if="bubble" class="mt-4 p-4 rounded-xl bg-white/5 border border-white/10">
          <div class="flex items-center gap-3">
            <div 
              class="w-10 h-10 rounded-full flex items-center justify-center text-xl"
              :style="{ background: `linear-gradient(135deg, ${emotion?.color.from}60, ${emotion?.color.to}40)` }"
            >
              {{ emotion?.emoji }}
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-white text-sm font-medium truncate">
                {{ bubble.text || '一个心情气泡' }}
              </p>
              <p class="text-white/40 text-xs">
                收到 {{ bubble.empathyCount }} 次共情
              </p>
            </div>
          </div>
        </div>

        <div class="mt-6 flex gap-3">
          <button
            class="flex-1 py-3 px-4 rounded-xl text-white text-sm font-medium transition-all duration-300 border"
            :class="[
              isGenerating 
                ? 'bg-white/10 border-white/10 text-white/40 cursor-not-allowed' 
                : 'bg-gradient-to-r from-purple-500 to-pink-500 border-transparent hover:shadow-lg hover:shadow-purple-500/30 hover:scale-[1.02]'
            ]"
            :disabled="isGenerating"
            @click="saveCard"
          >
            <div class="flex items-center justify-center gap-2">
              <span>📥</span>
              <span>保存图片</span>
            </div>
          </button>
          <button
            class="py-3 px-6 rounded-xl bg-white/5 border border-white/10 text-white/70 text-sm font-medium hover:bg-white/10 hover:text-white transition-all duration-200"
            @click="drawCard"
          >
            🔄
          </button>
        </div>

        <p class="text-white/30 text-xs text-center mt-4">
          长按图片可保存到手机相册
        </p>
      </div>

      <Transition name="slide-up">
        <div 
          v-if="showTip"
          class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-6 py-3 bg-black/80 backdrop-blur-md rounded-xl border border-white/10 text-white text-sm"
        >
          ✅ 已保存到本地
        </div>
      </Transition>
    </div>
  </div>
</template>

<style scoped>
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translate(-50%, -40%) !important;
}
</style>
