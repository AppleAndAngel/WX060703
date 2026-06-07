<script setup lang="ts">
import { computed } from 'vue'
import { useEmotionWeather } from '@/composables/useEmotionWeather'
import { useEmotions } from '@/composables/useEmotions'

const emit = defineEmits<{
  (e: 'close'): void
}>()

const {
  tonightWeather,
  tonightHappyPercent,
  tonightAngryPercent,
  tonightLonelyPercent,
  hourlyForecast,
  totalBubbles,
  getEmotionWeatherIcon,
  getEmotionName,
  getEmotionColor
} = useEmotionWeather()

const { emotions } = useEmotions()

const closeWeather = () => {
  emit('close')
}

const primaryEmotionColor = computed(() => {
  return getEmotionColor(tonightWeather.value.primaryEmotion)
})

const weatherAnimationClass = computed(() => {
  const id = tonightWeather.value.id
  if (id === 'sunny') return 'animate-sun-rotate'
  if (id === 'stormy') return 'animate-storm-shake'
  if (id === 'rainy') return 'animate-rain-fall'
  if (id === 'mixed') return 'animate-rainbow-glow'
  return ''
})

const windDescription = computed(() => {
  const wind = tonightWeather.value.wind
  if (wind < 3) return '微风'
  if (wind < 6) return '和风'
  if (wind < 9) return '清风'
  return '劲风'
})

const humidityDescription = computed(() => {
  const humidity = tonightWeather.value.humidity
  if (humidity < 40) return '干燥'
  if (humidity < 65) return '舒适'
  return '湿润'
})

const getEmotionPercent = (emotionId: string) => {
  if (emotionId === 'happy') return tonightHappyPercent.value
  if (emotionId === 'angry') return tonightAngryPercent.value
  return tonightLonelyPercent.value
}

const getStrokeDasharray = (emotionId: string) => {
  const percent = getEmotionPercent(emotionId)
  const circumference = 2 * Math.PI * 40
  const gap = 1
  const dashLength = (percent / 100) * circumference - gap
  return `${dashLength} ${circumference - dashLength}`
}

const getStrokeDashoffset = (index: number) => {
  const percentages = [tonightHappyPercent.value, tonightAngryPercent.value, tonightLonelyPercent.value]
  const circumference = 2 * Math.PI * 40
  let offset = 0
  for (let i = 0; i < index; i++) {
    offset += (percentages[i] / 100) * circumference
  }
  return -offset
}
</script>

<template>
  <div class="emotion-weather fixed inset-0 z-50 bg-wall-bg overflow-hidden">
    <div class="bg-layer absolute inset-0">
      <div class="stars absolute inset-0 opacity-30"></div>
      <div class="noise absolute inset-0 opacity-[0.015]"></div>
      <div
        class="weather-glow absolute inset-0 opacity-40"
        :class="`bg-gradient-to-br ${tonightWeather.bgGradient}`"
      ></div>
    </div>

    <div class="absolute top-0 left-0 right-0 z-20 p-6">
      <div class="flex items-center justify-between max-w-7xl mx-auto">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-cyan-500 flex items-center justify-center text-xl">
            🌤️
          </div>
          <div>
            <h1 class="text-white text-xl font-medium">情绪天气</h1>
            <p class="text-white/40 text-xs">今夜心情墙的气象报告</p>
          </div>
        </div>
        <div class="flex items-center gap-4">
          <div class="text-right">
            <div class="text-white text-lg font-mono">{{ totalBubbles }}</div>
            <div class="text-white/40 text-xs">采样心情</div>
          </div>
          <button
            class="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all duration-300"
            @click="closeWeather"
          >
            ✕
          </button>
        </div>
      </div>
    </div>

    <div class="weather-container absolute inset-0 pt-24 pb-32 px-6 overflow-y-auto">
      <div class="max-w-4xl mx-auto space-y-6">
        <div
          class="main-weather-card relative p-8 rounded-3xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/10 shadow-2xl overflow-hidden"
        >
          <div class="absolute top-0 right-0 w-64 h-64 rounded-full opacity-20 blur-3xl"
            :style="{
              background: `radial-gradient(circle, ${primaryEmotionColor.from}, transparent)`
            }"
          ></div>

          <div class="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-8">
            <div class="weather-icon-container text-center md:text-left">
              <div
                class="text-8xl mb-4"
                :class="weatherAnimationClass"
              >
                {{ tonightWeather.icon }}
              </div>
              <h2 class="text-3xl font-bold text-white mb-2">{{ tonightWeather.name }}</h2>
              <p class="text-white/60 text-lg">{{ tonightWeather.description }}</p>
            </div>

            <div class="flex-1 w-full">
              <div class="temperature-display flex items-center justify-center md:justify-end gap-2 mb-6">
                <span class="text-7xl font-bold text-white">{{ tonightWeather.temperature }}</span>
                <span class="text-3xl text-white/60">°C</span>
              </div>

              <div class="weather-metrics grid grid-cols-3 gap-4">
                <div class="metric p-4 rounded-2xl bg-white/5 text-center">
                  <div class="text-2xl mb-1">💧</div>
                  <div class="text-white/40 text-xs mb-1">湿度</div>
                  <div class="text-white text-lg font-medium">{{ tonightWeather.humidity }}%</div>
                  <div class="text-white/30 text-xs">{{ humidityDescription }}</div>
                </div>
                <div class="metric p-4 rounded-2xl bg-white/5 text-center">
                  <div class="text-2xl mb-1">💨</div>
                  <div class="text-white/40 text-xs mb-1">风力</div>
                  <div class="text-white text-lg font-medium">{{ tonightWeather.wind }}级</div>
                  <div class="text-white/30 text-xs">{{ windDescription }}</div>
                </div>
                <div class="metric p-4 rounded-2xl bg-white/5 text-center">
                  <div class="text-2xl mb-1">{{ getEmotionWeatherIcon(tonightWeather.primaryEmotion) }}</div>
                  <div class="text-white/40 text-xs mb-1">主导</div>
                  <div class="text-white text-lg font-medium">{{ getEmotionName(tonightWeather.primaryEmotion) || '—' }}</div>
                  <div class="text-white/30 text-xs">{{ getEmotionName(tonightWeather.secondaryEmotion) || '' }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="forecast-card p-6 rounded-2xl bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl border border-white/10">
          <h3 class="text-white text-lg font-medium mb-4 flex items-center gap-2">
            <span>📝</span>
            <span>今夜预报</span>
          </h3>
          <p class="text-white/80 text-lg leading-relaxed">{{ tonightWeather.forecast }}</p>
        </div>

        <div class="emotion-distribution-card p-6 rounded-2xl bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl border border-white/10">
          <h3 class="text-white text-lg font-medium mb-6 flex items-center gap-2">
            <span>📊</span>
            <span>情绪占比</span>
          </h3>

          <div class="emotion-bars space-y-4">
            <div
              v-for="emotion in emotions"
              :key="emotion.id"
              class="emotion-bar-item"
            >
              <div class="flex items-center justify-between mb-2">
                <div class="flex items-center gap-2">
                  <span class="text-2xl">{{ emotion.emoji }}</span>
                  <span class="text-white font-medium">{{ emotion.name }}</span>
                </div>
                <span class="text-white/80 font-mono text-lg">
                  {{ getEmotionPercent(emotion.id) }}%
                </span>
              </div>
              <div class="h-3 bg-white/10 rounded-full overflow-hidden">
                <div
                  class="h-full rounded-full transition-all duration-1000 ease-out"
                  :style="{
                    width: `${getEmotionPercent(emotion.id)}%`,
                    background: `linear-gradient(90deg, ${emotion.color.from}, ${emotion.color.to})`,
                    boxShadow: `0 0 10px ${emotion.color.from}66`
                  }"
                ></div>
              </div>
            </div>
          </div>

          <div class="emotion-pie mt-8 flex justify-center">
            <div class="relative w-48 h-48">
              <svg class="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="rgba(255,255,255,0.1)"
                  stroke-width="20"
                />
                <circle
                  v-for="(emotion, index) in emotions"
                  :key="emotion.id"
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  :stroke="emotion.color.from"
                  stroke-width="20"
                  :stroke-dasharray="getStrokeDasharray(emotion.id)"
                  :stroke-dashoffset="getStrokeDashoffset(index)"
                  class="transition-all duration-1000"
                  :stroke-linecap="emotions.length === 1 ? 'round' : 'butt'"
                />
              </svg>
              <div class="absolute inset-0 flex items-center justify-center">
                <div class="text-center">
                  <div class="text-4xl font-bold text-white">{{ totalBubbles }}</div>
                  <div class="text-white/40 text-xs">个心情</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="hourly-forecast-card p-6 rounded-2xl bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl border border-white/10">
          <h3 class="text-white text-lg font-medium mb-6 flex items-center gap-2">
            <span>⏰</span>
            <span>逐时预报</span>
          </h3>

          <div class="hourly-grid grid grid-cols-3 md:grid-cols-6 gap-2">
            <div
              v-for="(hour, index) in hourlyForecast"
              :key="index"
              class="hour-item text-center p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-300"
            >
              <div class="text-white/40 text-xs mb-2">{{ hour.time }}</div>
              <div class="text-3xl mb-2">{{ hour.icon }}</div>
              <div class="text-white font-medium">{{ hour.temp }}°</div>
              <div class="mt-2 space-y-1">
                <div class="flex items-center justify-center gap-1 text-xs">
                  <span>😊</span>
                  <span class="text-white/60">{{ hour.happy }}%</span>
                </div>
                <div class="flex items-center justify-center gap-1 text-xs">
                  <span>😤</span>
                  <span class="text-white/60">{{ hour.angry }}%</span>
                </div>
                <div class="flex items-center justify-center gap-1 text-xs">
                  <span>😔</span>
                  <span class="text-white/60">{{ hour.lonely }}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="tips-card p-6 rounded-2xl bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl border border-white/10">
          <h3 class="text-white text-lg font-medium mb-4 flex items-center gap-2">
            <span>💡</span>
            <span>心情小贴士</span>
          </h3>
          <div class="tips-list space-y-3">
            <div
              v-for="(tip, index) in tonightWeather.tips"
              :key="index"
              class="tip-item flex items-start gap-3 p-3 rounded-xl bg-white/5"
            >
              <span class="text-xl">✨</span>
              <span class="text-white/80">{{ tip }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.animate-sun-rotate {
  animation: sun-rotate 10s linear infinite;
}

@keyframes sun-rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.animate-storm-shake {
  animation: storm-shake 0.5s ease-in-out infinite;
}

@keyframes storm-shake {
  0%, 100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-5px) rotate(-5deg);
  }
  75% {
    transform: translateX(5px) rotate(5deg);
  }
}

.animate-rain-fall {
  animation: rain-fall 2s ease-in-out infinite;
}

@keyframes rain-fall {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(10px);
  }
}

.animate-rainbow-glow {
  animation: rainbow-glow 3s ease-in-out infinite;
}

@keyframes rainbow-glow {
  0%, 100% {
    filter: drop-shadow(0 0 10px rgba(255, 200, 0, 0.5));
  }
  33% {
    filter: drop-shadow(0 0 20px rgba(255, 100, 100, 0.5));
  }
  66% {
    filter: drop-shadow(0 0 20px rgba(100, 200, 255, 0.5));
  }
}

.emotion-weather::-webkit-scrollbar {
  width: 4px;
}

.emotion-weather::-webkit-scrollbar-track {
  background: transparent;
}

.emotion-weather::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
}

.emotion-weather::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.4);
}

.stars {
  background-image:
    radial-gradient(1px 1px at 20% 30%, white, transparent),
    radial-gradient(1px 1px at 60% 70%, white, transparent),
    radial-gradient(1px 1px at 80% 20%, white, transparent),
    radial-gradient(1px 1px at 40% 80%, white, transparent),
    radial-gradient(1px 1px at 10% 50%, white, transparent),
    radial-gradient(1px 1px at 90% 60%, white, transparent),
    radial-gradient(2px 2px at 30% 10%, white, transparent),
    radial-gradient(2px 2px at 70% 90%, white, transparent);
  background-size: 300px 300px;
  animation: twinkle 4s ease-in-out infinite;
}

@keyframes twinkle {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 0.5; }
}

.noise {
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
}

.hour-item:hover {
  transform: translateY(-4px);
}
</style>
