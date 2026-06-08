<script setup lang="ts">
import { computed } from 'vue'
import { useRooms } from '@/composables/useRooms'
import { useBubbles } from '@/composables/useBubbles'

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'enter', roomId: string): void
}>()

const { rooms, currentRoomId, enterRoom, leaveRoom } = useRooms()
const { bubblesByRoom } = useBubbles()

const sortedRooms = computed(() => {
  return [...rooms.value].sort((a, b) => {
    const countA = bubblesByRoom.value[a.id]?.length || 0
    const countB = bubblesByRoom.value[b.id]?.length || 0
    return countB - countA
  })
})

const handleEnterRoom = (roomId: string) => {
  if (currentRoomId.value === roomId) {
    return
  }
  if (currentRoomId.value) {
    leaveRoom()
  }
  enterRoom(roomId)
  emit('enter', roomId)
}

const closeSelector = () => {
  emit('close')
}
</script>

<template>
  <div class="room-selector fixed inset-0 z-50 bg-wall-bg overflow-hidden">
    <div class="bg-layer absolute inset-0">
      <div class="stars absolute inset-0 opacity-30"></div>
      <div class="noise absolute inset-0 opacity-[0.015]"></div>
    </div>

    <div class="absolute top-0 left-0 right-0 z-20 p-6">
      <div class="flex items-center justify-between max-w-7xl mx-auto">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-xl">
            🏠
          </div>
          <div>
            <h1 class="text-white text-xl font-medium">匿名房间</h1>
            <p class="text-white/40 text-xs">选择一个主题，加入共鸣</p>
          </div>
        </div>
        <button
          class="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all duration-300"
          @click="closeSelector"
        >
          ✕
        </button>
      </div>
    </div>

    <div class="rooms-container absolute inset-0 pt-24 pb-32 px-6 overflow-y-auto">
      <div class="rooms-grid max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="room in sortedRooms"
          :key="room.id"
          class="room-card relative p-5 rounded-2xl bg-wall-surface/60 backdrop-blur-xl border border-white/10 shadow-xl cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl group"
          :class="{
            'ring-2 ring-white/40': currentRoomId === room.id
          }"
          @click="handleEnterRoom(room.id)"
        >
          <div
            class="absolute inset-0 rounded-2xl opacity-30 group-hover:opacity-50 transition-opacity duration-300"
            :style="{
              background: `linear-gradient(135deg, ${room.color.from}22, ${room.color.to}22)`
            }"
          />

          <div class="relative flex items-start gap-4">
            <div
              class="w-14 h-14 rounded-xl flex items-center justify-center text-3xl flex-shrink-0 transition-all duration-300 group-hover:scale-110"
              :style="{
                background: `linear-gradient(135deg, ${room.color.from}, ${room.color.to})`,
                boxShadow: `0 0 20px ${room.color.from}44`
              }"
            >
              {{ room.icon }}
            </div>

            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1">
                <h3 class="text-white text-lg font-medium truncate">{{ room.name }}</h3>
                <div
                  v-if="currentRoomId === room.id"
                  class="flex-shrink-0 px-2 py-0.5 rounded-full bg-green-500/30 border border-green-500/50"
                >
                  <span class="text-green-400 text-xs">已在房间</span>
                </div>
              </div>
              <p class="text-white/50 text-sm mb-3 line-clamp-2">{{ room.description }}</p>

              <div class="flex items-center gap-4">
                <div class="flex items-center gap-1.5">
                  <span class="text-white/40 text-sm">👥</span>
                  <span class="text-white/70 text-sm font-mono">{{ room.onlineCount }}</span>
                  <span class="text-white/40 text-xs">在线</span>
                </div>
                <div class="flex items-center gap-1.5">
                  <span class="text-white/40 text-sm">💭</span>
                  <span class="text-white/70 text-sm font-mono">{{ bubblesByRoom[room.id]?.length || 0 }}</span>
                  <span class="text-white/40 text-xs">心情</span>
                </div>
              </div>
            </div>
          </div>

          <div
            class="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          >
            <button
              class="px-4 py-2 rounded-xl text-white text-sm font-medium"
              :style="{
                background: `linear-gradient(135deg, ${room.color.from}, ${room.color.to})`
              }"
              @click.stop="handleEnterRoom(room.id)"
            >
              {{ currentRoomId === room.id ? '进入' : '进入房间' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="absolute bottom-0 left-0 right-0 z-20 p-6">
      <div class="flex items-center justify-center max-w-7xl mx-auto">
        <div class="text-center">
          <p class="text-white/30 text-xs">
            每个房间都是一个独立的匿名空间
          </p>
          <p class="text-white/20 text-[10px] mt-1">
            在这里，你可以放心说出心里话
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.room-card {
  will-change: transform;
}

.room-card::before {
  content: '';
  position: absolute;
  top: 15%;
  left: 15%;
  width: 30%;
  height: 20%;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  filter: blur(8px);
  pointer-events: none;
}

.rooms-container::-webkit-scrollbar {
  width: 4px;
}

.rooms-container::-webkit-scrollbar-track {
  background: transparent;
}

.rooms-container::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
}

.rooms-container::-webkit-scrollbar-thumb:hover {
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

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
