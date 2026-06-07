import { ref, watch } from 'vue'

const PREFIX = 'empathy-wall'

export function useLocalStorage<T>(key: string, defaultValue: T) {
  const fullKey = `${PREFIX}:${key}`
  const stored = localStorage.getItem(fullKey)
  
  let initialValue: T
  if (stored) {
    try {
      const parsed = JSON.parse(stored)
      if (Array.isArray(parsed) && parsed.length === 0 && Array.isArray(defaultValue) && defaultValue.length > 0) {
        initialValue = defaultValue
      } else {
        initialValue = parsed
      }
    } catch {
      initialValue = defaultValue
    }
  } else {
    initialValue = defaultValue
  }
  
  const data = ref<T>(initialValue)

  watch(
    data,
    (newValue) => {
      localStorage.setItem(fullKey, JSON.stringify(newValue))
    },
    { deep: true }
  )

  return data
}

export function getUserId(): string {
  const key = `${PREFIX}:user-id`
  let id = localStorage.getItem(key)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(key, id)
  }
  return id
}
