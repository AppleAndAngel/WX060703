<script setup lang="ts">
import { ref, computed } from 'vue'
import { useBubbles } from '@/composables/useBubbles'

const { myTapRecords, myBubbles } = useBubbles()

const isExpanded = ref(false)

const totalTaps = computed(() => {
  return myTapRecords.value.reduce((sum, r) => sum + r.count, 0)
})

const formatTime = (timestamp: number) => {
  const diff = Date.now() - timestamp
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (mins < 1) return '刚刚'
  if (mins < 60) return `${mins}分钟前`
  if (hours < 24) return `${hours}小时前`
  return `${days}天前`
}

const toggleExpand = () => {
  isExpanded.value = !isExpanded.value
}
</script>

<template>
  <div class="tap-history relative">
    <button
      class="toggle-btn relative w-14 h-14 rounded-full bg-gradient-to-br from-blue-500/80 to-cyan-500/80 backdrop-blur-md border border-white/20 shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-105 hover:shadow-blue-500/50"
      @click="toggleExpand"
    >
      <span class="text-2xl">👆</span>
      <div
        v-if="totalTaps > 0"
        class="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-xs font-mono flex items-center justify-center"
      >
        {{ totalTaps > 99 ? '99+' : totalTaps }}
      </div>
    </button>

    <Transition name="slide">
      <div
        v-if="isExpanded"
        class="panel absolute bottom-full right-0 mb-4 w-80 max-h-96 rounded-2xl bg-wall-surface/90 backdrop-blur-xl border border-white/10 shadow-2xl overflow-hidden flex flex-col"
      >
        <div class="p-5 border-b border-white/10">
          <h3 class="text-white text-lg font-medium font-display">谁戳过你</h3>
          <p class="text-white/40 text-sm mt-1">
            共收到 {{ totalTaps }} 次共情
          </p>
        </div>

        <div class="flex-1 overflow-y-auto">
          <div v-if="myTapRecords.length === 0" class="p-8 text-center">
            <div class="text-4xl mb-3">😶</div>
            <p class="text-white/40 text-sm">还没有人戳过你的气泡</p>
            <p class="text-white/20 text-xs mt-1">投放心情，等待共鸣</p>
          </div>

          <div v-else class="p-3 space-y-2">
            <div
              v-for="record in myTapRecords.slice(0, 20)"
              :key="record.id"
              class="record-item flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
            >
              <div class="text-2xl">{{ record.bubbleEmoji }}</div>
              <div class="flex-1 min-w-0">
                <div class="text-white text-sm font-display truncate">
                  匿名用户
                </div>
                <div class="text-white/40 text-xs">
                  {{ formatTime(record.timestamp) }}
                </div>
              </div>
              <div class="flex items-center gap-1 text-yellow-400">
                <span class="text-lg">✨</span>
                <span class="font-mono font-medium">+{{ record.count }}</span>
              </div>
            </div>
          </div>
        </div>

        <div v-if="myBubbles.length > 0" class="p-4 border-t border-white/10">
          <p class="text-white/30 text-xs text-center">
            你投放了 {{ myBubbles.length }} 个心情气泡
          </p>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.panel::-webkit-scrollbar {
  width: 4px;
}

.panel::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
}

.panel::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
}

.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  transform: translateY(10px) scale(0.95);
}
</style>
