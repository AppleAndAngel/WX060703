<script setup lang="ts">
import { ref, computed } from 'vue'
import Bubble from '@/components/Bubble.vue'
import MoodWindow from '@/components/MoodWindow.vue'
import TapHistory from '@/components/TapHistory.vue'
import RoomSelector from '@/components/RoomSelector.vue'
import { useRooms } from '@/composables/useRooms'
import { useBubbles } from '@/composables/useBubbles'

const emit = defineEmits<{
  (e: 'leave'): void
}>()

const { currentRoom, leaveRoom } = useRooms()
const { getBubblesForRoom } = useBubbles()

const showRoomSelector = ref(false)

const roomBubbles = computed(() => {
  if (!currentRoom.value) return []
  return getBubblesForRoom(currentRoom.value.id)
})



const handleLeaveRoom = () => {
  leaveRoom()
  emit('leave')
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
</script>

<template>
  <div class="room-view min-h-screen bg-wall-bg overflow-hidden relative font-display">
    <div class="bg-layer absolute inset-0">
      <div class="stars absolute inset-0 opacity-30"></div>
      <div
        class="room-gradient absolute inset-0 opacity-40"
        :style="{
          background: `radial-gradient(ellipse at center, ${currentRoom?.color.from}33 0%, transparent 70%)`
        }"
      />
      <div class="gradient-1 absolute top-0 left-1/4 w-96 h-96 rounded-full bg-purple-600/10 blur-3xl"></div>
      <div class="gradient-2 absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-blue-600/10 blur-3xl"></div>
      <div class="noise absolute inset-0 opacity-[0.015]"></div>
    </div>

    <div class="header absolute top-0 left-0 right-0 z-10 p-6">
      <div class="flex items-center justify-between max-w-7xl mx-auto">
        <div class="flex items-center gap-3">
          <div
            class="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
            :style="{
              background: `linear-gradient(135deg, ${currentRoom?.color.from}, ${currentRoom?.color.to})`
            }"
          >
            {{ currentRoom?.icon }}
          </div>
          <div>
            <h1 class="text-white text-xl font-medium">{{ currentRoom?.name }}</h1>
            <p class="text-white/40 text-xs">{{ currentRoom?.description }}</p>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <div class="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/20">
            <span class="text-green-400 text-sm">●</span>
            <span class="text-white/70 text-sm font-mono">{{ currentRoom?.onlineCount }}</span>
            <span class="text-white/40 text-xs">在线</span>
          </div>
          <button
            class="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/80 to-blue-500/80 backdrop-blur-md border border-white/20 shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-105"
            @click="openRoomSelector"
            title="切换房间"
          >
            <span class="text-lg">🔄</span>
          </button>
          <button
            class="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500/80 to-orange-500/80 backdrop-blur-md border border-white/20 shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-105"
            @click="handleLeaveRoom"
            title="退出房间"
          >
            <span class="text-lg">🚪</span>
          </button>
          <div class="text-right">
            <div class="text-white text-lg font-mono">{{ roomBubbles.length }}</div>
            <div class="text-white/40 text-xs">个心情在漂浮</div>
          </div>
        </div>
      </div>
    </div>

    <div class="wall absolute inset-0 pt-24 pb-32">
      <Bubble
        v-for="bubble in roomBubbles"
        :key="bubble.id"
        :bubble="bubble"
      />

      <div
        v-if="roomBubbles.length === 0"
        class="absolute inset-0 flex items-center justify-center"
      >
        <div class="text-center">
          <div class="text-6xl mb-4 opacity-50">💭</div>
          <h3 class="text-white/60 text-lg mb-2">这个房间还没有心情</h3>
          <p class="text-white/30 text-sm">成为第一个在这里投放心情的人吧</p>
        </div>
      </div>
    </div>

    <div class="footer absolute bottom-0 left-0 right-0 z-20 p-6">
      <div class="flex items-end justify-between max-w-7xl mx-auto">
        <MoodWindow />

        <div class="hidden md:block text-center">
          <p class="text-white/20 text-xs">
            这是「{{ currentRoom?.name }}」房间
          </p>
          <p class="text-white/10 text-[10px] mt-1">
            所有数据存储在你的浏览器本地
          </p>
        </div>

        <TapHistory />
      </div>
    </div>

    <Transition name="fade">
      <RoomSelector
        v-if="showRoomSelector"
        @close="closeRoomSelector"
        @enter="onRoomEnter"
      />
    </Transition>
  </div>
</template>

<style scoped>
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

@keyframes float-gradient {
  0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
  33% { transform: translate3d(30px, -20px, 0) scale(1.1); }
  66% { transform: translate3d(-20px, 10px, 0) scale(0.95); }
}

.room-gradient {
  animation: room-pulse 8s ease-in-out infinite;
}

@keyframes room-pulse {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 0.5; }
}
</style>
