<script setup lang="ts">
import { ref, computed } from 'vue'
import { useMoodCalendar } from '@/composables/useMoodCalendar'
import { useEmotions } from '@/composables/useEmotions'
import MoodDayDetail from './MoodDayDetail.vue'

const { getMonthCalendar, getEmotionFrequencyForMonth, todayDateKey, totalMoodDays } = useMoodCalendar()
const { emotions } = useEmotions()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const currentDate = ref(new Date())
const selectedDateKey = ref<string | null>(null)
const showDayDetail = ref(false)

const currentYear = computed(() => currentDate.value.getFullYear())
const currentMonth = computed(() => currentDate.value.getMonth())

const calendarDays = computed(() => {
  return getMonthCalendar(currentYear.value, currentMonth.value)
})

const monthName = computed(() => {
  return currentDate.value.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' })
})

const emotionFrequency = computed(() => {
  return getEmotionFrequencyForMonth(currentYear.value, currentMonth.value)
})

const weekDays = ['日', '一', '二', '三', '四', '五', '六']

const isToday = (dateKey: string) => dateKey === todayDateKey.value

const goToPrevMonth = () => {
  currentDate.value = new Date(currentYear.value, currentMonth.value - 1, 1)
}

const goToNextMonth = () => {
  currentDate.value = new Date(currentYear.value, currentMonth.value + 1, 1)
}

const goToToday = () => {
  currentDate.value = new Date()
}

const selectDay = (dateKey: string, hasMood: boolean) => {
  if (!hasMood) return
  selectedDateKey.value = dateKey
  showDayDetail.value = true
}

const closeDayDetail = () => {
  showDayDetail.value = false
  selectedDateKey.value = null
}
</script>

<template>
  <div class="mood-calendar fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" @click.self="emit('close')">
    <div class="calendar-container w-full max-w-lg rounded-3xl bg-wall-surface/95 backdrop-blur-xl border border-white/10 shadow-2xl overflow-hidden animate-scale-in">
      <div class="header p-6 border-b border-white/10">
        <div class="flex items-center justify-between mb-4">
          <button
            class="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors"
            @click="emit('close')"
          >
            ✕
          </button>
          <h2 class="text-white text-xl font-medium font-display">心情日历</h2>
          <div class="w-10"></div>
        </div>

        <div class="flex items-center justify-center gap-4 mb-2">
          <button
            class="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors"
            @click="goToPrevMonth"
          >
            ‹
          </button>
          <div class="text-center">
            <div class="text-white text-lg font-medium font-display">{{ monthName }}</div>
            <div class="text-white/40 text-xs">已记录 {{ totalMoodDays }} 天心情</div>
          </div>
          <button
            class="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors"
            @click="goToNextMonth"
          >
            ›
          </button>
        </div>

        <button
          class="mx-auto block px-4 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-white/60 text-xs transition-colors"
          @click="goToToday"
        >
          回到今天
        </button>
      </div>

      <div class="calendar-body p-6">
        <div class="week-header grid grid-cols-7 gap-1 mb-2">
          <div
            v-for="day in weekDays"
            :key="day"
            class="text-center text-white/40 text-xs py-2 font-medium"
          >
            {{ day }}
          </div>
        </div>

        <div class="days-grid grid grid-cols-7 gap-1">
          <div
            v-for="(day, index) in calendarDays"
            :key="index"
            class="day-cell aspect-square relative"
          >
            <button
              class="w-full h-full rounded-xl flex flex-col items-center justify-center transition-all duration-200"
              :class="{
                'opacity-30': !day.isCurrentMonth,
                'cursor-pointer hover:scale-105': day.dayMood,
                'cursor-default': !day.dayMood,
                'ring-2 ring-white/50': isToday(day.dateKey),
                'bg-white/5': !day.primaryColor,
              }"
              :style="{
                background: day.primaryColor
                  ? `linear-gradient(135deg, ${day.primaryColor}66, ${day.primaryColor}22)`
                  : undefined,
              }"
              :disabled="!day.dayMood"
              @click="selectDay(day.dateKey, !!day.dayMood)"
            >
              <span class="text-sm" :class="day.isCurrentMonth ? 'text-white/80' : 'text-white/30'">
                {{ day.dayOfMonth }}
              </span>
              <span v-if="day.primaryEmoji" class="text-lg mt-0.5">
                {{ day.primaryEmoji }}
              </span>
              <div v-if="day.emotionCount > 1" class="absolute top-1 right-1 min-w-4 h-4 px-1 rounded-full bg-white/20 text-[10px] text-white/80 flex items-center justify-center">
                {{ day.emotionCount }}
              </div>
            </button>
          </div>
        </div>
      </div>

      <div class="footer p-6 border-t border-white/10">
        <div class="text-white/60 text-sm mb-3 font-display">本月心情分布</div>
        <div class="flex flex-wrap gap-2">
          <div
            v-for="emotion in emotions"
            :key="emotion.id"
            class="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5"
          >
            <span class="text-xl">{{ emotion.emoji }}</span>
            <span class="text-white/60 text-sm">{{ emotion.name }}</span>
            <span class="text-white/80 text-sm font-mono">{{ emotionFrequency[emotion.id] || 0 }}</span>
          </div>
          <div
            v-if="Object.keys(emotionFrequency).length === 0"
            class="text-white/30 text-sm py-2"
          >
            本月还没有记录心情
          </div>
        </div>
      </div>
    </div>

    <Transition name="fade">
      <MoodDayDetail
        v-if="showDayDetail && selectedDateKey"
        :date-key="selectedDateKey"
        @close="closeDayDetail"
      />
    </Transition>
  </div>
</template>

<style scoped>
.animate-scale-in {
  animation: scaleIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
