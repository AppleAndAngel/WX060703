import { computed } from 'vue'
import { useBubbles } from './useBubbles'
import { useEmotions } from './useEmotions'

export interface WeatherType {
  id: string
  name: string
  icon: string
  bgGradient: string
  description: string
  tips: string[]
}

const weatherTypes: Record<string, WeatherType> = {
  sunny: {
    id: 'sunny',
    name: '情绪晴朗',
    icon: '☀️',
    bgGradient: 'from-amber-400/30 to-orange-500/30',
    description: '今晚的心情墙上洒满了阳光，大家似乎都很开心。',
    tips: [
      '适合和朋友分享喜悦',
      '记录下这些美好时刻',
      '把快乐传递给更多人'
    ]
  },
  partlyCloudy: {
    id: 'partlyCloudy',
    name: '晴转多云',
    icon: '⛅',
    bgGradient: 'from-yellow-400/20 to-slate-500/30',
    description: '今晚的心情有喜有忧，像阳光穿过云层。',
    tips: [
      '开心的时候尽情享受',
      '难过的时候也没关系',
      '情绪本来就是多变的'
    ]
  },
  cloudy: {
    id: 'cloudy',
    name: '情绪阴天',
    icon: '☁️',
    bgGradient: 'from-slate-400/30 to-gray-600/30',
    description: '今晚的心情墙有些沉闷，似乎很多人感到孤单。',
    tips: [
      '你不是一个人',
      '试着给孤单的心情一个共情',
      '温暖会在传递中扩散'
    ]
  },
  stormy: {
    id: 'stormy',
    name: '情绪雷暴',
    icon: '⛈️',
    bgGradient: 'from-red-500/30 to-orange-600/30',
    description: '今晚的心情墙有些躁动，大家似乎都带着火气。',
    tips: [
      '深呼吸，让自己平静下来',
      '愤怒是正常的情绪',
      '试着理解背后的原因'
    ]
  },
  rainy: {
    id: 'rainy',
    name: '情绪小雨',
    icon: '🌧️',
    bgGradient: 'from-blue-400/30 to-indigo-600/30',
    description: '今晚的心情墙飘着细雨，淡淡的忧伤在空气中弥漫。',
    tips: [
      '允许自己难过',
      '雨后总会有彩虹',
      '找个方式安抚自己'
    ]
  },
  mixed: {
    id: 'mixed',
    name: '情绪多变',
    icon: '🌈',
    bgGradient: 'from-purple-400/30 via-pink-500/30 to-amber-400/30',
    description: '今晚的心情墙五彩斑斓，各种情绪在这里交织。',
    tips: [
      '接纳所有的情绪',
      '每一种心情都值得被看见',
      '这就是生活的样子'
    ]
  }
}

export function useEmotionWeather() {
  const { emotionPercentages, tonightEmotionPercentages, bubbles } = useBubbles()
  const { emotions } = useEmotions()

  const happyPercent = computed(() => emotionPercentages.value['happy'] || 0)
  const angryPercent = computed(() => emotionPercentages.value['angry'] || 0)
  const lonelyPercent = computed(() => emotionPercentages.value['lonely'] || 0)

  const tonightHappyPercent = computed(() => tonightEmotionPercentages.value['happy'] || 0)
  const tonightAngryPercent = computed(() => tonightEmotionPercentages.value['angry'] || 0)
  const tonightLonelyPercent = computed(() => tonightEmotionPercentages.value['lonely'] || 0)

  const weather = computed(() => {
    const happy = happyPercent.value
    const angry = angryPercent.value
    const lonely = lonelyPercent.value
    const total = happy + angry + lonely

    if (total === 0) {
      return {
        ...weatherTypes.partlyCloudy,
        temperature: 22,
        humidity: 50,
        wind: 3,
        primaryEmotion: null,
        secondaryEmotion: null
      }
    }

    const maxPercent = Math.max(happy, angry, lonely)
    const minPercent = Math.min(happy, angry, lonely)
    const spread = maxPercent - minPercent

    let weatherType: WeatherType
    let primaryEmotion: string | null = null
    let secondaryEmotion: string | null = null

    const sortedEmotions = [...emotions.value].sort((a, b) => {
      return (emotionPercentages.value[b.id] || 0) - (emotionPercentages.value[a.id] || 0)
    })

    primaryEmotion = sortedEmotions[0]?.id || null
    secondaryEmotion = sortedEmotions[1]?.id || null

    if (spread < 15) {
      weatherType = weatherTypes.mixed
    } else if (happy >= 50) {
      weatherType = weatherTypes.sunny
    } else if (angry >= 50) {
      weatherType = weatherTypes.stormy
    } else if (lonely >= 50) {
      if (lonely >= 65) {
        weatherType = weatherTypes.rainy
      } else {
        weatherType = weatherTypes.cloudy
      }
    } else if (happy >= angry && happy >= lonely) {
      weatherType = weatherTypes.partlyCloudy
    } else if (angry >= happy && angry >= lonely) {
      weatherType = weatherTypes.partlyCloudy
    } else {
      weatherType = weatherTypes.cloudy
    }

    const temperature = Math.round(15 + (happy * 0.3) - (angry * 0.15) + (lonely * -0.1))
    const humidity = Math.round(40 + (lonely * 0.4) + (angry * 0.2))
    const wind = Math.round(2 + (angry * 0.08) + (happy * 0.03))

    return {
      ...weatherType,
      temperature: Math.max(0, Math.min(40, temperature)),
      humidity: Math.max(20, Math.min(100, humidity)),
      wind: Math.max(0, Math.min(12, wind)),
      primaryEmotion,
      secondaryEmotion
    }
  })

  const tonightWeather = computed(() => {
    const happy = tonightHappyPercent.value
    const angry = tonightAngryPercent.value
    const lonely = tonightLonelyPercent.value
    const total = happy + angry + lonely

    if (total === 0) {
      return {
        ...weatherTypes.partlyCloudy,
        temperature: 22,
        humidity: 50,
        wind: 3,
        primaryEmotion: null,
        secondaryEmotion: null,
        forecast: '今夜暂无心情数据，等待第一个心情的到来'
      }
    }

    const maxPercent = Math.max(happy, angry, lonely)
    const minPercent = Math.min(happy, angry, lonely)
    const spread = maxPercent - minPercent

    let weatherType: WeatherType
    let primaryEmotion: string | null = null
    let secondaryEmotion: string | null = null

    const sortedEmotions = [...emotions.value].sort((a, b) => {
      return (tonightEmotionPercentages.value[b.id] || 0) - (tonightEmotionPercentages.value[a.id] || 0)
    })

    primaryEmotion = sortedEmotions[0]?.id || null
    secondaryEmotion = sortedEmotions[1]?.id || null

    if (spread < 15) {
      weatherType = weatherTypes.mixed
    } else if (happy >= 50) {
      weatherType = weatherTypes.sunny
    } else if (angry >= 50) {
      weatherType = weatherTypes.stormy
    } else if (lonely >= 50) {
      if (lonely >= 65) {
        weatherType = weatherTypes.rainy
      } else {
        weatherType = weatherTypes.cloudy
      }
    } else if (happy >= angry && happy >= lonely) {
      weatherType = weatherTypes.partlyCloudy
    } else if (angry >= happy && angry >= lonely) {
      weatherType = weatherTypes.partlyCloudy
    } else {
      weatherType = weatherTypes.cloudy
    }

    const temperature = Math.round(15 + (happy * 0.3) - (angry * 0.15) + (lonely * -0.1))
    const humidity = Math.round(40 + (lonely * 0.4) + (angry * 0.2))
    const wind = Math.round(2 + (angry * 0.08) + (happy * 0.03))

    const primaryEmotionData = emotions.value.find(e => e.id === primaryEmotion)
    let forecast = ''
    if (primaryEmotion === 'happy') {
      forecast = `今夜${primaryEmotionData?.emoji || ''}情绪晴朗，${happy}%的人感到高兴`
      if (secondaryEmotion === 'lonely' && lonely > 20) {
        forecast += `，但仍有${lonely}%的人需要陪伴`
      } else if (secondaryEmotion === 'angry' && angry > 20) {
        forecast += `，同时${angry}%的人带着一丝火气`
      }
    } else if (primaryEmotion === 'lonely') {
      forecast = `今夜${primaryEmotionData?.emoji || ''}情绪微冷，${lonely}%的人感到孤单`
      if (secondaryEmotion === 'happy' && happy > 20) {
        forecast += `，幸好还有${happy}%的快乐在温暖着大家`
      } else if (secondaryEmotion === 'angry' && angry > 20) {
        forecast += `，另有${angry}%的人在独自生气`
      }
    } else if (primaryEmotion === 'angry') {
      forecast = `今夜${primaryEmotionData?.emoji || ''}情绪躁动，${angry}%的人带着火气`
      if (secondaryEmotion === 'happy' && happy > 20) {
        forecast += `，但${happy}%的好心情也许能缓解一下`
      } else if (secondaryEmotion === 'lonely' && lonely > 20) {
        forecast += `，还有${lonely}%的人在孤单中郁闷`
      }
    } else {
      forecast = '今夜情绪多变，各种心情交织在一起'
    }

    return {
      ...weatherType,
      temperature: Math.max(0, Math.min(40, temperature)),
      humidity: Math.max(20, Math.min(100, humidity)),
      wind: Math.max(0, Math.min(12, wind)),
      primaryEmotion,
      secondaryEmotion,
      forecast
    }
  })

  const getEmotionWeatherIcon = (emotionId: string | null) => {
    if (!emotionId) return '💭'
    const emotion = emotions.value.find(e => e.id === emotionId)
    return emotion?.emoji || '💭'
  }

  const getEmotionName = (emotionId: string | null) => {
    if (!emotionId) return ''
    const emotion = emotions.value.find(e => e.id === emotionId)
    return emotion?.name || ''
  }

  const getEmotionColor = (emotionId: string | null) => {
    if (!emotionId) return { from: '#999', to: '#666' }
    const emotion = emotions.value.find(e => e.id === emotionId)
    return emotion?.color || { from: '#999', to: '#666' }
  }

  const hourlyForecast = computed(() => {
    const now = new Date()
    const hours = []
    const baseHappy = tonightHappyPercent.value
    const baseAngry = tonightAngryPercent.value
    for (let i = 0; i < 6; i++) {
      const hour = (now.getHours() + i) % 24
      const timeLabel = `${hour.toString().padStart(2, '0')}:00`

      const variation = Math.sin(i * 0.5) * 10
      const happy = Math.max(0, Math.min(100, baseHappy + variation * (Math.random() * 0.5 + 0.5)))
      const angry = Math.max(0, Math.min(100, baseAngry - variation * 0.3 * (Math.random() * 0.5 + 0.5)))
      const lonely = Math.max(0, Math.min(100, 100 - happy - angry))

      const total = happy + angry + lonely
      const happyPct = Math.round((happy / total) * 100)
      const angryPct = Math.round((angry / total) * 100)
      const lonelyPct = 100 - happyPct - angryPct

      let icon = '⛅'
      if (happyPct >= 50) icon = '☀️'
      else if (angryPct >= 50) icon = '⛈️'
      else if (lonelyPct >= 50) icon = '🌧️'

      hours.push({
        time: timeLabel,
        icon,
        happy: happyPct,
        angry: angryPct,
        lonely: lonelyPct,
        temp: Math.round(20 + (happyPct * 0.15) - (lonelyPct * 0.1))
      })
    }

    return hours
  })

  const totalBubbles = computed(() => bubbles.length)

  return {
    weather,
    tonightWeather,
    happyPercent,
    angryPercent,
    lonelyPercent,
    tonightHappyPercent,
    tonightAngryPercent,
    tonightLonelyPercent,
    hourlyForecast,
    totalBubbles,
    getEmotionWeatherIcon,
    getEmotionName,
    getEmotionColor,
    weatherTypes
  }
}
