import { ref, computed } from 'vue'
import type { Effect } from '@/types'

const effectModules = import.meta.glob('@/effects/*.ts', { eager: true })
const effectsMap = ref<Map<string, Effect>>(new Map())

for (const path in effectModules) {
  const module = effectModules[path] as { default: Effect }
  const effect = module.default
  if (effect && effect.id) {
    effectsMap.value.set(effect.id, effect)
  }
}

export function useEffects() {
  const effects = computed(() => Array.from(effectsMap.value.values()))

  const getEffect = (id: string): Effect | undefined => {
    return effectsMap.value.get(id)
  }

  const triggerEffect = (id: string, element: HTMLElement, options?: any) => {
    const effect = effectsMap.value.get(id)
    if (effect) {
      return effect.trigger(element, options)
    }
    return undefined
  }

  return {
    effects,
    getEffect,
    triggerEffect
  }
}
