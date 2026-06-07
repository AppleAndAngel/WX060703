<script setup lang="ts">
import { useBubbles } from '@/composables/useBubbles'

const { sparkleParticles } = useBubbles()
</script>

<template>
  <div class="effect-layer fixed inset-0 pointer-events-none z-50 overflow-hidden">
    <div
      v-for="particle in sparkleParticles"
      :key="particle.id"
      class="sparkle absolute rounded-full"
      :style="{
        left: `${particle.x}px`,
        top: `${particle.y}px`,
        width: `${particle.size}px`,
        height: `${particle.size}px`,
        backgroundColor: particle.color,
        opacity: particle.life,
        boxShadow: `0 0 ${particle.size * 2}px ${particle.color}, 0 0 ${particle.size * 4}px ${particle.color}66`,
        transform: `scale(${particle.life})`,
      }"
    />
  </div>
</template>

<style scoped>
.sparkle {
  will-change: left, top, opacity, transform;
  transform: translate(-50%, -50%);
}
</style>
