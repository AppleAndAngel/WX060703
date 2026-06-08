<script setup lang="ts">
import { ref, computed } from 'vue'
import Bubble from '@/components/Bubble.vue'
import MoodWindow from '@/components/MoodWindow.vue'
import TapHistory from '@/components/TapHistory.vue'
import EffectLayer from '@/components/EffectLayer.vue'
import MoodCalendar from '@/components/MoodCalendar.vue'
import ResonanceRanking from '@/components/ResonanceRanking.vue'
import RoomSelector from '@/components/RoomSelector.vue'
import RoomView from '@/components/RoomView.vue'
import { useBubbles } from '@/composables/useBubbles'
import { useMoodCalendar } from '@/composables/useMoodCalendar'
import { useRooms } from '@/composables/useRooms'

const { bubblesWithoutRoom, getTopEmpathy } = useBubbles()
const { totalMoodDays } = useMoodCalendar()
const { isInRoom, currentRoom } = useRooms()

const showCalendar = ref(false)
const showRanking = ref(false)
const showRoomSelector = ref(false)

const topBubblesToday = computed(() => getTopEmpathy('today'))
const hasRankingData = computed(() => topBubblesToday.value.length > 0)

const openCalendar = () => {
  showCalendar.value = true
}

const closeCalendar = () => {
  showCalendar.value = false
}

const openRanking = () => {
  showRanking.value = true
}

const closeRanking = () => {
  showRanking.value = false
}

const openRoomSelector = () => {
  showRoomSelector.value = true
}

const closeRoomSelector = () => {
  showRoomSelector.value = false
}

const onRoomEnter = () => {
  showRoomSelector.value = false
}

const onLeaveRoom = () => {
}
</script>

<template>
  <RoomView v-if="isInRoom" @leave="onLeaveRoom" />

  <div v-else class="app min-h-screen bg-wall-bg overflow-hidden relative font-display">
    <div class="bg-layer absolute inset-0">
      <div class="stars absolute inset-0 opacity-30"></div>
      <div class="gradient-1 absolute top-0 left-1/4 w-96 h-96 rounded-full bg-purple-600/10 blur-3xl"></div>
      <div class="gradient-2 absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-blue-600/10 blur-3xl"></div>
      <div class="gradient-3 absolute top-1/3 right-0 w-64 h-64 rounded-full bg-pink-600/10 blur-3xl"></div>
      <div class="noise absolute inset-0 opacity-[0.015]"></div>
    </div>

    <div class="header absolute top-0 left-0 right-0 z-10 p-6">
      <div class="flex items-center justify-between max-w-7xl mx-auto">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xl">
            💭
          </div>
          <div>
            <h1 class="text-white text-xl font-medium">匿名共情墙</h1>
            <p class="text-white/40 text-xs">长按气泡，传递共情</p>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <button
            class="relative w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/80 to-blue-500/80 backdrop-blur-md border border-white/20 shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-105 hover:shadow-cyan-500/50"
            @click="openRoomSelector"
            title="匿名房间"
          >
            <span class="text-lg">🏠</span>
          </button>
          <button
            class="relative w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/80 to-pink-500/80 backdrop-blur-md border border-white/20 shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-105 hover:shadow-purple-500/50"
            @click="openRanking"
            title="共鸣回声"
          >
            <span class="text-lg">🔊</span>
            <div
              v-if="hasRankingData"
              class="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-purple-500 text-white text-xs font-mono flex items-center justify-center"
            >
              {{ topBubblesToday.length > 99 ? '99+' : topBubblesToday.length }}
            </div>
          </button>
          <button
            class="calendar-btn relative w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500/80 to-yellow-500/80 backdrop-blur-md border border-white/20 shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-105 hover:shadow-orange-500/50"
            @click="openCalendar"
            title="心情日历"
          >
            <span class="text-lg">📅</span>
            <div
              v-if="totalMoodDays > 0"
              class="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-orange-500 text-white text-xs font-mono flex items-center justify-center"
            >
              {{ totalMoodDays }}
            </div>
          </button>
          <div class="text-right">
            <div class="text-white/60 text-sm font-mono">
              {{ bubblesWithoutRoom.length }} 个心情
            </div>
            <div class="text-white/30 text-xs">
              在墙上漂浮
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="wall absolute inset-0 pt-24 pb-32">
      <Bubble
        v-for="bubble in bubblesWithoutRoom"
        :key="bubble.id"
        :bubble="bubble"
      />
    </div>

    <div class="footer absolute bottom-0 left-0 right-0 z-20 p-6">
      <div class="flex items-end justify-between max-w-7xl mx-auto">
        <MoodWindow />

        <div class="hidden md:block text-center">
          <p class="text-white/20 text-xs">
            按住不放 → 气泡颤抖 → 释放 → 亮片崩出
          </p>
          <p class="text-white/10 text-[10px] mt-1">
            所有数据存储在你的浏览器本地
          </p>
        </div>

        <TapHistory />
      </div>
    </div>

    <EffectLayer />

    <Transition name="fade">
      <MoodCalendar v-if="showCalendar" @close="closeCalendar" />
    </Transition>

    <Transition name="fade">
      <ResonanceRanking v-if="showRanking" @close="closeRanking" />
    </Transition>

    <Transition name="fade">
      <RoomSelector v-if="showRoomSelector" @close="closeRoomSelector" @enter="onRoomEnter" />
    </Transition>
  </div>
</template>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
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

.gradient-1 {
  animation: float-gradient 20s ease-in-out infinite;
}

.gradient-2 {
  animation: float-gradient 25s ease-in-out infinite reverse;
}

.gradient-3 {
  animation: float-gradient 18s ease-in-out infinite;
}

@keyframes float-gradient {
  0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
  33% { transform: translate3d(30px, -20px, 0) scale(1.1); }
  66% { transform: translate3d(-20px, 10px, 0) scale(0.95); }
}
</style>
