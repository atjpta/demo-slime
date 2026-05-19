<script setup lang="ts">
  import { computed } from "vue";
  import TierBadge from "@/components/TierBadge.vue";
  import type { TierCode } from "@/constants";

  const props = defineProps<{
    label: string;
    name?: string;
    stats?: { hp: number; attack: number; magic: number; defense: number } | null;
    initHp?: number | null;
    variant: "primary" | "error";
    ready?: boolean;
    tierCode?: string | null;
  }>();

  const maxHp = computed(() => props.initHp ?? props.stats?.hp ?? null);

  const hpPercent = computed(() => {
    if (maxHp.value == null || props.stats == null) return 100;
    return Math.max(0, Math.min(100, (props.stats.hp / maxHp.value) * 100));
  });

  const hpBarClass = computed(() => {
    const pct = hpPercent.value;
    if (pct > 55) return "bg-success";
    if (pct > 25) return "bg-warning";
    return "bg-error animate-pulse";
  });
</script>

<template>
  <div
    class="rounded-none bg-base-100 shadow-lg overflow-hidden"
    :class="variant === 'primary' ? 'ring-2 ring-primary/50' : 'ring-2 ring-error/50'"
  >
    <!-- Header -->
    <div
      class="flex items-center justify-between px-3 py-2"
      :class="variant === 'primary' ? 'bg-primary/10' : 'bg-error/10'"
    >
      <div class="flex items-center gap-1.5 min-w-0">
        <span class="font-bold text-sm truncate leading-tight">{{ name ?? "..." }}</span>
        <TierBadge v-if="tierCode" :code="tierCode as TierCode" class="text-xs" />
      </div>
      <span v-if="ready" class="text-green-500 shrink-0 text-base leading-none">✔</span>
    </div>

    <div class="px-3 pt-2.5 pb-3 flex flex-col gap-2.5">
      <!-- HP bar with number overlaid -->
      <div class="flex items-center gap-2">
        <span class="text-xs shrink-0 leading-none">❤️</span>
        <div class="relative flex-1 h-6">
          <div class="absolute inset-0 bg-base-300 overflow-hidden">
            <div
              class="h-full transition-all duration-700 ease-out"
              :class="hpBarClass"
              :style="{ width: `${hpPercent}%` }"
            />
          </div>
          <div class="absolute inset-0 flex items-center justify-center text-white">
            <span class="font-mono font-extrabold text-sm leading-none">
              {{ stats?.hp ?? "?" }}<span class="font-normal text-xs"> / {{ maxHp ?? "?" }}</span>
            </span>
          </div>
        </div>
      </div>

      <!-- Stats row (icons only, left-aligned) -->
      <div v-if="stats" class="flex items-center gap-3 tabular-nums">
        <span class="text-xs font-mono font-semibold">⚔️ {{ stats.attack }}</span>
        <span class="text-xs font-mono font-semibold">✨ {{ stats.magic }}</span>
        <span class="text-xs font-mono font-semibold">🛡️ {{ stats.defense }}</span>
      </div>
      <div v-else class="text-xs opacity-30 py-0.5">Chờ...</div>
    </div>
  </div>
</template>
