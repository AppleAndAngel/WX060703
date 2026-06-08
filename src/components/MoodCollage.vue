<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import type { MoodCollage, CollageBubble, Bubble as BubbleType } from '@/types'
import { useMoodCollage } from '@/composables/useMoodCollage'
import { useBubbles } from '@/composables/useBubbles'
import { useEmotions } from '@/composables/useEmotions'

const emit = defineEmits<{
  (e: 'close'): void
}>()

const {
  sortedCollages,
  collageCount,
  favoriteCollages,
  createCollage,
  getCollage,
  updateCollage,
  deleteCollage,
  toggleFavorite,
  addBubbleToCollage,
  removeBubbleFromCollage,
  updateCollageBubble,
  getCollageEmotionSummary,
  formatCollageDate
} = useMoodCollage()

const { displayBubbles, addEmpathy, addSparkleParticles } = useBubbles()
const { getEmotion } = useEmotions()

type ViewMode = 'list' | 'create' | 'edit' | 'view' | 'select'

const viewMode = ref<ViewMode>('list')
const currentCollageId = ref<string | null>(null)
const selectedBubbleIds = ref<string[]>([])
const showDeleteConfirm = ref(false)
const collageToDelete = ref<string | null>(null)
const selectedCollageForAdd = ref<string | null>(null)

const newCollageForm = reactive({
  title: '',
  description: ''
})

const availableBubbles = computed(() => displayBubbles.value.slice(0, 30))

const currentCollage = computed(() =>
  currentCollageId.value ? getCollage(currentCollageId.value) : null
)

const selectedBubblesForCollage = computed(() =>
  availableBubbles.value.filter(b => selectedBubbleIds.value.includes(b.id))
)

const getBubbleGradient = (emotionId: string, opacity: number = 0.8) => {
  const emotion = getEmotion(emotionId)
  if (!emotion) return 'linear-gradient(135deg, #66666666, #44444444)'
  const alpha = Math.floor(opacity * 255).toString(16).padStart(2, '0')
  return `linear-gradient(135deg, ${emotion.color.from}${alpha}, ${emotion.color.to}${Math.floor(opacity * 0.7 * 255).toString(16).padStart(2, '0')})`
}

const getEmotionColor = (emotionId: string) => {
  const emotion = getEmotion(emotionId)
  return emotion?.color.from || '#888888'
}

const formatDate = (timestamp: number) => {
  return formatCollageDate(timestamp)
}

const openCreateMode = () => {
  newCollageForm.title = ''
  newCollageForm.description = ''
  selectedBubbleIds.value = []
  viewMode.value = 'create'
}

const openEditMode = (collage: MoodCollage) => {
  currentCollageId.value = collage.id
  newCollageForm.title = collage.title
  newCollageForm.description = collage.description || ''
  viewMode.value = 'edit'
}

const openViewMode = (collage: MoodCollage) => {
  currentCollageId.value = collage.id
  viewMode.value = 'view'
}

const openSelectMode = (collageId: string) => {
  selectedCollageForAdd.value = collageId
  selectedBubbleIds.value = []
  viewMode.value = 'select'
}

const goBack = () => {
  if (viewMode.value === 'select') {
    viewMode.value = 'edit'
    selectedCollageForAdd.value = null
  } else if (viewMode.value === 'edit' || viewMode.value === 'view') {
    viewMode.value = 'list'
    currentCollageId.value = null
  } else {
    viewMode.value = 'list'
  }
  selectedBubbleIds.value = []
}

const handleCreateCollage = () => {
  if (!newCollageForm.title.trim()) return

  const collage = createCollage(newCollageForm.title.trim(), newCollageForm.description.trim() || undefined)

  selectedBubblesForCollage.value.forEach(bubble => {
    addBubbleToCollage(collage.id, bubble)
  })

  if (collage.bubbles.length === 0) {
    openEditMode(collage)
  } else {
    viewMode.value = 'list'
  }
  newCollageForm.title = ''
  newCollageForm.description = ''
  selectedBubbleIds.value = []
}

const handleAddSelectedBubbles = () => {
  if (!selectedCollageForAdd.value) return

  selectedBubblesForCollage.value.forEach(bubble => {
    addBubbleToCollage(selectedCollageForAdd.value!, bubble)
  })

  currentCollageId.value = selectedCollageForAdd.value
  selectedCollageForAdd.value = null
  selectedBubbleIds.value = []
  viewMode.value = 'edit'
}

const handleUpdateCollage = () => {
  if (!currentCollageId.value || !newCollageForm.title.trim()) return

  updateCollage(currentCollageId.value, {
    title: newCollageForm.title.trim(),
    description: newCollageForm.description.trim() || undefined
  })

  viewMode.value = 'list'
  currentCollageId.value = null
}

const confirmDelete = (collageId: string) => {
  collageToDelete.value = collageId
  showDeleteConfirm.value = true
}

const handleDelete = () => {
  if (collageToDelete.value) {
    deleteCollage(collageToDelete.value)
  }
  showDeleteConfirm.value = false
  collageToDelete.value = null
  if (currentCollageId.value === collageToDelete.value) {
    viewMode.value = 'list'
    currentCollageId.value = null
  }
}

const toggleBubbleSelection = (bubbleId: string) => {
  const index = selectedBubbleIds.value.indexOf(bubbleId)
  if (index === -1) {
    if (selectedBubbleIds.value.length < 12) {
      selectedBubbleIds.value.push(bubbleId)
    }
  } else {
    selectedBubbleIds.value.splice(index, 1)
  }
}

const isBubbleSelected = (bubbleId: string) => {
  return selectedBubbleIds.value.includes(bubbleId)
}

const handleRemoveBubble = (collageBubbleId: string) => {
  if (!currentCollageId.value) return
  removeBubbleFromCollage(currentCollageId.value, collageBubbleId)
}

const getCollageStyle = (bubble: CollageBubble) => {
  return {
    left: `${bubble.x}%`,
    top: `${bubble.y}%`,
    transform: `translate(-50%, -50%) rotate(${bubble.rotation}deg) scale(${bubble.scale})`,
    background: getBubbleGradient(bubble.emotionId, 0.9),
    borderColor: `${getEmotionColor(bubble.emotionId)}44`,
    boxShadow: `0 8px 32px ${getEmotionColor(bubble.emotionId)}33`
  }
}

const getEmotionSummaryEmojis = (collage: MoodCollage) => {
  const summary = getCollageEmotionSummary(collage)
  const entries = Object.entries(summary).sort((a, b) => b[1] - a[1])
  return entries.slice(0, 4).map(([emotionId]) => getEmotion(emotionId)?.emoji || '💭')
}

const showBubbleDetail = (collageBubble: CollageBubble) => {
  const originalBubble = availableBubbles.value.find(b => b.id === collageBubble.bubbleId)
  if (originalBubble) {
    addEmpathy(originalBubble.id)
  }

  const target = document.createElement('div')
  target.style.position = 'fixed'
  target.style.left = '50%'
  target.style.top = '50%'
  document.body.appendChild(target)

  const createSparkle = (count: number) => {
    const particles = []
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count
      const speed = 2 + Math.random() * 3
      particles.push({
        id: crypto.randomUUID(),
        x: 0,
        y: 0,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: getEmotionColor(collageBubble.emotionId),
        size: 4 + Math.random() * 4,
        life: 1
      })
    }
    addSparkleParticles(particles)
  }
  createSparkle(12)

  setTimeout(() => {
    document.body.removeChild(target)
  }, 100)
}

const getRandomPrompt = () => {
  const prompts = [
    '今天最打动我的瞬间',
    '此刻的心情碎片',
    '那些触动我的话',
    '一周的心情集锦',
    '深夜的思绪',
    '温柔时刻收藏',
    '我的小确幸清单'
  ]
  return prompts[Math.floor(Math.random() * prompts.length)]
}
</script>

<template>
  <div
    class="mood-collage fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
    @click.self="viewMode === 'list' ? emit('close') : goBack()"
  >
    <div
      class="collage-container w-full max-w-6xl h-[85vh] rounded-3xl bg-wall-surface/95 backdrop-blur-xl border border-white/10 shadow-2xl overflow-hidden animate-scale-in flex flex-col"
    >
      <div class="header p-6 border-b border-white/10 flex-shrink-0">
        <div class="flex items-center justify-between mb-4">
          <button
            v-if="viewMode !== 'list'"
            class="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors"
            @click="goBack"
          >
            ←
          </button>
          <div v-else class="w-10"></div>

          <h2 class="text-white text-xl font-medium font-display flex items-center gap-2">
            <span class="text-2xl">🎨</span>
            <span v-if="viewMode === 'list'">情绪拼贴板</span>
            <span v-else-if="viewMode === 'create'">创建新拼贴</span>
            <span v-else-if="viewMode === 'edit'">编辑拼贴</span>
            <span v-else-if="viewMode === 'view'">回看日记</span>
            <span v-else-if="viewMode === 'select'">选择气泡</span>
          </h2>

          <button
            v-if="viewMode === 'list'"
            class="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors"
            @click="emit('close')"
          >
            ✕
          </button>
          <div v-else class="w-10"></div>
        </div>

        <p v-if="viewMode === 'list'" class="text-white/40 text-sm text-center">
          挑选打动你的气泡，拼成属于你的心情日记
        </p>
        <p v-else-if="viewMode === 'create' || viewMode === 'select'" class="text-white/40 text-sm text-center">
          最多可以选择 12 个气泡 · 已选 <span class="text-white/80 font-mono">{{ selectedBubbleIds.length }}</span> 个
        </p>
      </div>

      <div class="content flex-1 overflow-hidden">
        <div v-if="viewMode === 'list'" class="h-full overflow-y-auto p-6">
          <div class="flex justify-between items-center mb-6">
            <div class="flex items-center gap-4">
              <span class="text-white/60 text-sm">
                共 <span class="text-white font-mono">{{ collageCount }}</span> 页日记
              </span>
              <span v-if="favoriteCollages.length > 0" class="text-white/40 text-sm">
                <span class="text-yellow-400">★</span> {{ favoriteCollages.length }} 个收藏
              </span>
            </div>
            <button
              class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 text-white text-sm font-medium hover:shadow-lg hover:shadow-pink-500/30 transition-all duration-300 hover:scale-105 flex items-center gap-2"
              @click="openCreateMode"
            >
              <span>✦</span>
              新建拼贴
            </button>
          </div>

          <div v-if="sortedCollages.length === 0" class="text-center py-20">
            <div class="text-7xl mb-6 animate-float">📓</div>
            <p class="text-white/60 text-lg font-display mb-2">还没有拼贴日记</p>
            <p class="text-white/30 text-sm mb-8">挑选打动你的气泡，拼成第一页心情吧</p>
            <button
              class="px-6 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 text-white font-medium hover:shadow-lg hover:shadow-pink-500/30 transition-all duration-300 hover:scale-105"
              @click="openCreateMode"
            >
              创建我的第一页
            </button>
          </div>

          <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <div
              v-for="collage in sortedCollages"
              :key="collage.id"
              class="collage-card group relative rounded-2xl border border-white/10 overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl"
              :class="{ 'ring-2 ring-yellow-400/50': collage.isFavorite }"
              @click="openViewMode(collage)"
            >
              <div class="collage-preview relative h-48 overflow-hidden bg-gradient-to-br from-slate-900/50 to-slate-800/50">
                <div
                  v-for="(bubble, index) in collage.bubbles.slice(0, 6)"
                  :key="bubble.id"
                  class="absolute w-12 h-12 rounded-full flex items-center justify-center border backdrop-blur-sm transition-all duration-300"
                  :style="{
                    left: `${15 + (index % 3) * 30}%`,
                    top: `${20 + Math.floor(index / 3) * 40}%`,
                    transform: `translate(-50%, -50%) rotate(${(index - 2) * 5}deg) scale(${0.8 + index * 0.05})`,
                    background: getBubbleGradient(bubble.emotionId, 0.7),
                    borderColor: `${getEmotionColor(bubble.emotionId)}44`
                  }"
                >
                  <span class="text-lg">{{ bubble.emoji }}</span>
                </div>

                <div
                  v-if="collage.bubbles.length > 6"
                  class="absolute bottom-2 right-2 px-2 py-1 rounded-lg bg-black/50 text-white/60 text-xs font-mono"
                >
                  +{{ collage.bubbles.length - 6 }}
                </div>

                <div
                  v-if="collage.isFavorite"
                  class="absolute top-2 right-2 w-6 h-6 rounded-full bg-yellow-500/90 flex items-center justify-center text-white text-xs"
                >
                  ★
                </div>
              </div>

              <div class="p-4 bg-gradient-to-t from-black/30 to-transparent">
                <div class="flex items-start justify-between mb-2">
                  <h3 class="text-white font-medium font-display line-clamp-1 group-hover:text-pink-300 transition-colors">
                    {{ collage.title }}
                  </h3>
                </div>

                <p v-if="collage.description" class="text-white/40 text-sm line-clamp-2 mb-3">
                  {{ collage.description }}
                </p>

                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-1">
                    <span v-for="emoji in getEmotionSummaryEmojis(collage)" :key="emoji" class="text-sm">
                      {{ emoji }}
                    </span>
                  </div>
                  <div class="text-white/30 text-xs font-mono">
                    {{ collage.bubbles.length }} 个气泡
                  </div>
                </div>

                <div class="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
                  <span class="text-white/30 text-xs">
                    {{ formatDate(collage.updatedAt) }}
                  </span>
                  <div class="flex items-center gap-2">
                    <button
                      class="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-yellow-400 transition-colors"
                      :class="{ 'text-yellow-400': collage.isFavorite }"
                      @click.stop="toggleFavorite(collage.id)"
                    >
                      {{ collage.isFavorite ? '★' : '☆' }}
                    </button>
                    <button
                      class="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white transition-colors"
                      @click.stop="openEditMode(collage)"
                    >
                      ✎
                    </button>
                    <button
                      class="w-7 h-7 rounded-lg bg-white/5 hover:bg-red-500/20 flex items-center justify-center text-white/40 hover:text-red-400 transition-colors"
                      @click.stop="confirmDelete(collage.id)"
                    >
                      🗑
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-else-if="viewMode === 'create' || viewMode === 'select'" class="h-full flex flex-col">
          <div v-if="viewMode === 'create'" class="p-6 border-b border-white/10 space-y-4">
            <div>
              <label class="block text-white/60 text-sm mb-2">标题</label>
              <input
                v-model="newCollageForm.title"
                type="text"
                class="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-pink-500/50 focus:bg-white/10 transition-all"
                :placeholder="getRandomPrompt()"
                maxlength="30"
              />
            </div>
            <div>
              <label class="block text-white/60 text-sm mb-2">描述（可选）</label>
              <textarea
                v-model="newCollageForm.description"
                class="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-pink-500/50 focus:bg-white/10 transition-all resize-none"
                placeholder="写下你此刻的感受..."
                rows="2"
                maxlength="100"
              ></textarea>
            </div>
          </div>

          <div class="flex-1 overflow-y-auto p-6">
            <h3 class="text-white/80 text-sm font-medium mb-4 flex items-center gap-2">
              <span>✨</span>
              选择打动你的气泡
            </h3>

            <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
              <div
                v-for="bubble in availableBubbles"
                :key="bubble.id"
                class="bubble-select-item relative aspect-square rounded-2xl border-2 flex items-center justify-center cursor-pointer transition-all duration-200 hover:scale-105 group"
                :class="{
                  'border-pink-500 shadow-lg shadow-pink-500/30 scale-105': isBubbleSelected(bubble.id),
                  'border-white/10 hover:border-white/30': !isBubbleSelected(bubble.id)
                }"
                :style="{
                  background: isBubbleSelected(bubble.id)
                    ? getBubbleGradient(bubble.emotionId, 0.9)
                    : getBubbleGradient(bubble.emotionId, 0.3)
                }"
                @click="toggleBubbleSelection(bubble.id)"
              >
                <span class="text-3xl transition-transform duration-200" :class="{ 'scale-110': isBubbleSelected(bubble.id) }">
                  {{ getEmotion(bubble.emotionId)?.emoji || '💭' }}
                </span>

                <div
                  v-if="isBubbleSelected(bubble.id)"
                  class="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-pink-500 flex items-center justify-center text-white text-xs"
                >
                  ✓
                </div>

                <div
                  class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 rounded-lg bg-black/90 text-white text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 max-w-[200px]"
                >
                  <p class="line-clamp-2">{{ bubble.text || '无声的心情' }}</p>
                </div>
              </div>
            </div>
          </div>

          <div class="p-6 border-t border-white/10">
            <div class="flex items-center justify-between">
              <div class="text-white/40 text-sm">
                已选择 <span class="text-white font-mono">{{ selectedBubbleIds.length }}</span> / 12 个气泡
              </div>
              <div class="flex items-center gap-3">
                <button
                  class="px-5 py-2.5 rounded-xl bg-white/5 text-white/60 hover:bg-white/10 hover:text-white transition-all"
                  @click="goBack"
                >
                  取消
                </button>
                <button
                  class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 text-white font-medium hover:shadow-lg hover:shadow-pink-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  :disabled="(viewMode === 'create' && !newCollageForm.title.trim()) || selectedBubbleIds.length === 0"
                  @click="viewMode === 'create' ? handleCreateCollage() : handleAddSelectedBubbles()"
                >
                  {{ viewMode === 'create' ? '创建拼贴' : '添加到拼贴' }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div v-else-if="viewMode === 'edit' && currentCollage" class="h-full flex flex-col">
          <div class="p-6 border-b border-white/10 space-y-4">
            <div>
              <label class="block text-white/60 text-sm mb-2">标题</label>
              <input
                v-model="newCollageForm.title"
                type="text"
                class="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-pink-500/50 focus:bg-white/10 transition-all"
                maxlength="30"
              />
            </div>
            <div>
              <label class="block text-white/60 text-sm mb-2">描述（可选）</label>
              <textarea
                v-model="newCollageForm.description"
                class="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-pink-500/50 focus:bg-white/10 transition-all resize-none"
                placeholder="写下你此刻的感受..."
                rows="2"
                maxlength="100"
              ></textarea>
            </div>
          </div>

          <div class="flex-1 relative overflow-hidden bg-gradient-to-br from-slate-900/30 via-slate-800/20 to-slate-900/30">
            <div
              v-if="currentCollage.bubbles.length === 0"
              class="absolute inset-0 flex items-center justify-center"
            >
              <div class="text-center">
                <div class="text-5xl mb-4 opacity-50">✨</div>
                <p class="text-white/40">还没有添加气泡</p>
                <p class="text-white/20 text-sm mt-1">点击下方按钮添加</p>
              </div>
            </div>

            <div v-else class="absolute inset-0">
              <div
                v-for="bubble in currentCollage.bubbles"
                :key="bubble.id"
                class="collage-bubble absolute w-20 h-20 rounded-full flex flex-col items-center justify-center border backdrop-blur-sm transition-all duration-200 hover:z-10 group"
                :style="getCollageStyle(bubble)"
              >
                <span class="text-2xl">{{ bubble.emoji }}</span>

                <button
                  class="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500/90 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  @click.stop="handleRemoveBubble(bubble.id)"
                >
                  ✕
                </button>

                <div
                  class="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-3 py-2 rounded-lg bg-black/90 text-white text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 max-w-[200px]"
                >
                  <p class="line-clamp-3">{{ bubble.text || '无声的心情' }}</p>
                </div>
              </div>
            </div>
          </div>

          <div class="p-6 border-t border-white/10">
            <div class="flex items-center justify-between">
              <div class="text-white/40 text-sm">
                {{ currentCollage.bubbles.length }} / 12 个气泡
              </div>
              <div class="flex items-center gap-3">
                <button
                  class="px-4 py-2 rounded-xl bg-white/5 text-white/60 hover:bg-white/10 hover:text-white transition-all flex items-center gap-2"
                  :disabled="currentCollage.bubbles.length >= 12"
                  @click="openSelectMode(currentCollage.id)"
                >
                  <span>+</span>
                  添加气泡
                </button>
                <button
                  class="px-5 py-2.5 rounded-xl bg-white/5 text-white/60 hover:bg-white/10 hover:text-white transition-all"
                  @click="goBack"
                >
                  取消
                </button>
                <button
                  class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 text-white font-medium hover:shadow-lg hover:shadow-pink-500/30 transition-all disabled:opacity-50"
                  :disabled="!newCollageForm.title.trim()"
                  @click="handleUpdateCollage"
                >
                  保存
                </button>
              </div>
            </div>
          </div>
        </div>

        <div v-else-if="viewMode === 'view' && currentCollage" class="h-full flex flex-col">
          <div class="p-6 border-b border-white/10 text-center">
            <h2 class="text-white text-2xl font-medium font-display mb-2">{{ currentCollage.title }}</h2>
            <p v-if="currentCollage.description" class="text-white/50 text-sm mb-3">
              {{ currentCollage.description }}
            </p>
            <p class="text-white/30 text-xs">
              {{ formatDate(currentCollage.createdAt) }}
            </p>
          </div>

          <div class="flex-1 relative overflow-hidden bg-gradient-to-br from-slate-900/50 via-slate-800/30 to-slate-900/50">
            <div class="absolute inset-0 overflow-hidden">
              <div class="absolute inset-0 opacity-20">
                <div class="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-pink-500/20 blur-3xl"></div>
                <div class="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full bg-purple-500/20 blur-3xl"></div>
              </div>
            </div>

            <div v-if="currentCollage.bubbles.length === 0" class="absolute inset-0 flex items-center justify-center">
              <div class="text-center">
                <div class="text-6xl mb-4 opacity-40">📄</div>
                <p class="text-white/40">空白的一页</p>
              </div>
            </div>

            <div v-else class="absolute inset-0">
              <div
                v-for="(bubble, index) in currentCollage.bubbles"
                :key="bubble.id"
                class="collage-bubble-view absolute rounded-xl flex flex-col items-center justify-center border backdrop-blur-md cursor-pointer transition-all duration-300 hover:scale-110 hover:z-10 group"
                :class="bubble.text ? 'w-28 h-32 p-3' : 'w-20 h-20'"
                :style="{
                  left: `${bubble.x}%`,
                  top: `${bubble.y}%`,
                  transform: `translate(-50%, -50%) rotate(${bubble.rotation}deg) scale(${bubble.scale})`,
                  background: getBubbleGradient(bubble.emotionId, 0.95),
                  borderColor: `${getEmotionColor(bubble.emotionId)}66`,
                  boxShadow: `0 12px 40px ${getEmotionColor(bubble.emotionId)}44`,
                  animationDelay: `${index * 0.1}s`
                }"
                @click="showBubbleDetail(bubble)"
              >
                <span class="text-3xl mb-1">{{ bubble.emoji }}</span>
                <p
                  v-if="bubble.text"
                  class="text-white text-xs text-center font-display leading-tight line-clamp-4"
                >
                  {{ bubble.text }}
                </p>
              </div>
            </div>
          </div>

          <div class="p-6 border-t border-white/10">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="flex items-center gap-1">
                  <span v-for="(emoji, i) in getEmotionSummaryEmojis(currentCollage)" :key="i" class="text-lg">
                    {{ emoji }}
                  </span>
                </div>
                <span class="text-white/30 text-sm">
                  · {{ currentCollage.bubbles.length }} 个心情
                </span>
              </div>
              <div class="flex items-center gap-2">
                <button
                  class="px-4 py-2 rounded-xl bg-white/5 text-white/60 hover:bg-white/10 hover:text-yellow-400 transition-all flex items-center gap-2"
                  :class="{ 'text-yellow-400': currentCollage.isFavorite }"
                  @click="toggleFavorite(currentCollage.id)"
                >
                  <span>{{ currentCollage.isFavorite ? '★' : '☆' }}</span>
                  <span class="text-sm">{{ currentCollage.isFavorite ? '已收藏' : '收藏' }}</span>
                </button>
                <button
                  class="px-4 py-2 rounded-xl bg-white/5 text-white/60 hover:bg-white/10 hover:text-white transition-all"
                  @click="openEditMode(currentCollage)"
                >
                  编辑
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <Transition name="fade">
      <div
        v-if="showDeleteConfirm"
        class="fixed inset-0 z-60 flex items-center justify-center bg-black/70"
        @click.self="showDeleteConfirm = false"
      >
        <div class="bg-wall-surface/95 backdrop-blur-xl border border-white/10 rounded-2xl p-6 max-w-sm w-full mx-4 animate-scale-in">
          <h3 class="text-white text-lg font-medium mb-2">确认删除</h3>
          <p class="text-white/60 text-sm mb-6">这页拼贴日记将被永久删除，无法恢复。</p>
          <div class="flex items-center justify-end gap-3">
            <button
              class="px-4 py-2 rounded-xl bg-white/5 text-white/60 hover:bg-white/10 hover:text-white transition-all"
              @click="showDeleteConfirm = false"
            >
              取消
            </button>
            <button
              class="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 transition-all"
              @click="handleDelete"
            >
              删除
            </button>
          </div>
        </div>
      </div>
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

.animate-float {
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-4 {
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.collage-bubble-view {
  animation: bubbleFloatIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) backwards;
}

@keyframes bubbleFloatIn {
  from {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.5);
  }
  to {
    opacity: 1;
  }
}

.collage-bubble::before {
  content: '';
  position: absolute;
  top: 15%;
  left: 20%;
  width: 25%;
  height: 20%;
  background: rgba(255, 255, 255, 0.4);
  border-radius: 50%;
  filter: blur(2px);
  pointer-events: none;
}
</style>
