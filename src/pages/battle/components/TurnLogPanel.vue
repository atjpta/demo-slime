<script setup lang="ts">
  import { computed } from "vue";
  import { useBattleStore } from "@/store";
  import { SKILL_META } from "@/constants";

  const store = useBattleStore();

  const recentLogs = computed(() => {
    const logs = store.battleState?.logs;
    if (!logs?.length) return [];
    return [...logs].slice(-3).reverse();
  });
</script>

<template>
  <div v-if="recentLogs.length" class="card bg-base-100 shadow-md">
    <div class="card-body p-4">
      <h3 class="font-bold text-sm mb-2">Lịch sử gần đây</h3>
      <div class="flex flex-col gap-2">
        <div
          v-for="log in recentLogs"
          :key="`${log.wave}-${log.turn}`"
          class="bg-base-200 rounded-lg p-2 text-xs"
        >
          <span class="badge badge-ghost badge-xs mr-2">W{{ log.wave }} T{{ log.turn }}</span>
          <span v-for="[pid, pLog] in log.players" :key="pid" class="mr-3">
            <span class="opacity-60">{{ pid === store.myPlayerId ? "Bạn" : "Đối thủ" }}:</span>
            <span v-for="(e, i) in pLog.damageReceive" :key="i" class="ml-1">
              {{ SKILL_META[e.typeEffect]?.icon ?? e.typeEffect }} -{{ e.value }}
            </span>
            <span class="ml-1 opacity-50">HP→{{ pLog.stats.hp }}</span>
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
