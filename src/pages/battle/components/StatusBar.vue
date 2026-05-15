<script setup lang="ts">
  import { computed } from "vue";
  import { useBattleStore } from "@/store";
  import { Phase, PHASE_LABEL } from "@/constants";

  const store = useBattleStore();
  const phase = computed(() => store.battleState?.phase ?? "");
  const wave = computed(() => store.battleState?.wave ?? 0);
  const winner = computed(() => store.battleState?.winner ?? "");
  const isEnded = computed(() => phase.value === Phase.ENDED);
  const isExec = computed(() => phase.value === Phase.EXECUTING);
  const iWon = computed(() => winner.value === store.myPlayerId);
</script>

<template>
  <div class="flex items-center justify-between bg-base-100 rounded-xl px-4 py-2 shadow">
    <div class="flex items-center gap-3">
      <span class="badge badge-primary badge-lg">{{ PHASE_LABEL[phase] ?? phase }}</span>
      <span class="text-sm opacity-60">Wave {{ wave }}</span>
    </div>
    <div v-if="isEnded">
      <span v-if="winner === 'draw'" class="badge badge-warning badge-lg">🤝 Hòa</span>
      <span v-else-if="iWon" class="badge badge-success badge-lg">🏆 Thắng!</span>
      <span v-else class="badge badge-error badge-lg">💀 Thua</span>
    </div>
    <span v-if="isExec" class="loading loading-dots loading-sm"></span>
  </div>
</template>
