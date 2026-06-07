import { ref, computed, watch, onUnmounted } from 'vue'
import type { RadioClip, RadioEmotionFilter, RadioState } from '@/types'
import { useLocalStorage } from './useLocalStorage'
import { useBubbles } from './useBubbles'
import { useEmotions } from './useEmotions'

const initialState: RadioState = {
  isEnabled: false,
  isPlaying: false,
  emotionFilter: 'all',
  currentClip: null,
  playHistory: [],
  speechEnabled: true
}

const storedState = useLocalStorage<RadioState>('night-radio', initialState)
const radioState = ref<RadioState>({ ...storedState.value })

const { bubbles } = useBubbles()
const { getEmotion } = useEmotions()

let playTimer: ReturnType<typeof setTimeout> | null = null
let speechSynthesis: SpeechSynthesis | null = null

const CLIP_INTERVAL = 5000

export function useNightRadio() {
  const availableClips = computed(() => {
    const filtered = bubbles.filter(bubble => {
      if (!bubble.text) return false
      if (radioState.value.emotionFilter === 'all') return true
      return bubble.emotionId === radioState.value.emotionFilter
    })

    return filtered.map(bubble => {
      const emotion = getEmotion(bubble.emotionId)
      return {
        id: `clip-${bubble.id}`,
        bubbleId: bubble.id,
        text: bubble.text,
        emotionId: bubble.emotionId,
        emoji: emotion?.emoji || '💭',
        isPlaying: false
      } as RadioClip
    })
  })

  const happyClips = computed(() =>
    availableClips.value.filter(c => c.emotionId === 'happy')
  )

  const angryClips = computed(() =>
    availableClips.value.filter(c => c.emotionId === 'angry')
  )

  const lonelyClips = computed(() =>
    availableClips.value.filter(c => c.emotionId === 'lonely')
  )

  const isEnabled = computed(() => radioState.value.isEnabled)
  const isPlaying = computed(() => radioState.value.isPlaying)
  const emotionFilter = computed(() => radioState.value.emotionFilter)
  const currentClip = computed(() => radioState.value.currentClip)
  const speechEnabled = computed(() => radioState.value.speechEnabled)
  const playHistory = computed(() => radioState.value.playHistory.slice(-10))

  const clipCounts = computed(() => ({
    all: availableClips.value.length,
    happy: happyClips.value.length,
    angry: angryClips.value.length,
    lonely: lonelyClips.value.length
  }))

  const syncToStorage = () => {
    storedState.value = { ...radioState.value }
  }

  const speakText = (text: string) => {
    if (!radioState.value.speechEnabled) return
    
    if ('speechSynthesis' in window) {
      speechSynthesis = window.speechSynthesis
      speechSynthesis.cancel()
      
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'zh-CN'
      utterance.rate = 0.9
      utterance.pitch = 1
      utterance.volume = 0.7
      
      const voices = speechSynthesis.getVoices()
      const chineseVoice = voices.find(v => v.lang.includes('zh'))
      if (chineseVoice) {
        utterance.voice = chineseVoice
      }
      
      speechSynthesis.speak(utterance)
    }
  }

  const stopSpeech = () => {
    if (speechSynthesis) {
      speechSynthesis.cancel()
    }
  }

  const getNextClip = (): RadioClip | null => {
    const clips = availableClips.value
    if (clips.length === 0) return null

    const recentIds = new Set(
      radioState.value.playHistory.slice(-5).map(c => c.bubbleId)
    )
    
    const available = clips.filter(c => !recentIds.has(c.bubbleId))
    const pool = available.length > 0 ? available : clips
    
    const randomIndex = Math.floor(Math.random() * pool.length)
    return { ...pool[randomIndex], isPlaying: true, spokenAt: Date.now() }
  }

  const playNext = () => {
    if (playTimer) {
      clearTimeout(playTimer)
      playTimer = null
    }

    const nextClip = getNextClip()
    if (!nextClip) {
      radioState.value.isPlaying = false
      radioState.value.currentClip = null
      syncToStorage()
      return
    }

    radioState.value.currentClip = nextClip
    radioState.value.playHistory.push(nextClip)
    
    speakText(nextClip.text)

    playTimer = setTimeout(() => {
      if (radioState.value.isPlaying) {
        playNext()
      }
    }, CLIP_INTERVAL)

    syncToStorage()
  }

  const startRadio = () => {
    if (availableClips.value.length === 0) {
      console.log('没有可播放的气泡内容')
      return
    }
    
    radioState.value.isPlaying = true
    playNext()
  }

  const pauseRadio = () => {
    radioState.value.isPlaying = false
    if (playTimer) {
      clearTimeout(playTimer)
      playTimer = null
    }
    stopSpeech()
    syncToStorage()
  }

  const togglePlay = () => {
    if (radioState.value.isPlaying) {
      pauseRadio()
    } else {
      startRadio()
    }
  }

  const enableRadio = () => {
    radioState.value.isEnabled = true
    syncToStorage()
    startRadio()
  }

  const disableRadio = () => {
    pauseRadio()
    radioState.value.isEnabled = false
    radioState.value.currentClip = null
    syncToStorage()
  }

  const toggleRadio = () => {
    if (radioState.value.isEnabled) {
      disableRadio()
    } else {
      enableRadio()
    }
  }

  const setEmotionFilter = (filter: RadioEmotionFilter) => {
    radioState.value.emotionFilter = filter
    syncToStorage()
    
    if (radioState.value.isPlaying) {
      playNext()
    }
  }

  const toggleSpeech = () => {
    radioState.value.speechEnabled = !radioState.value.speechEnabled
    if (!radioState.value.speechEnabled) {
      stopSpeech()
    }
    syncToStorage()
  }

  const skipNext = () => {
    if (radioState.value.isPlaying) {
      playNext()
    }
  }

  const isBubblePlaying = (bubbleId: string): boolean => {
    return radioState.value.currentClip?.bubbleId === bubbleId
  }

  watch(
    () => radioState.value.isEnabled,
    (enabled) => {
      if (!enabled) {
        pauseRadio()
      }
    }
  )

  onUnmounted(() => {
    if (playTimer) {
      clearTimeout(playTimer)
    }
    stopSpeech()
  })

  return {
    isEnabled,
    isPlaying,
    emotionFilter,
    currentClip,
    speechEnabled,
    playHistory,
    availableClips,
    clipCounts,
    toggleRadio,
    togglePlay,
    setEmotionFilter,
    toggleSpeech,
    skipNext,
    isBubblePlaying
  }
}
