import { ref, watch } from 'vue'

const PREFIX = 'empathy-wall'

export function useLocalStorage<T>(key: string, defaultValue: T) {
  const fullKey = `${PREFIX}:${key}`
  const stored = localStorage.getItem(fullKey)
  const data = ref<T>(stored ? JSON.parse(stored) : defaultValue)

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
