<script setup lang="ts">
  import { computed } from "vue";
  import { useBattleStore, usePlayerStore } from "@/stores";
  import { SKILL_META, TURNS_PER_WAVE } from "@/constants";

  const props = defineProps<{ opponentId: string | null }>();

  const battleStore = useBattleStore();
  const playerStore = usePlayerStore();

  const getSkill = (playerId: string, orderIdx: number) => {
    if (orderIdx < 0) return null;
    return battleStore.initPlayers[playerId]?.skills[orderIdx] ?? null;
  };

  const getIcon = (playerId: string, orderIdx: number) => {
    const skill = getSkill(playerId, orderIdx);
    return skill ? (SKILL_META[skill.code]?.icon ?? "❓") : "…";
  };

  const combatWaveShown = computed(
    () => battleStore.shownLogs.filter((l: any) => l.wave === battleStore.wave && l.turn > 0).length
  );

  const clashIdx = computed(() => {
    if (combatWaveShown.value === 0) return null;
    const idx = combatWaveShown.value - 1;
    return idx < TURNS_PER_WAVE ? idx : null;
  });

  const actionsReady = computed(
    () => (battleStore.playerActions[playerStore.myPlayerId]?.length ?? 0) > 0
  );

  const myActions = computed(() => {
    const raw = battleStore.playerActions[playerStore.myPlayerId] ?? [];
    return Array.from({ length: TURNS_PER_WAVE }, (_, i) => raw[i] ?? -1);
  });

  const opponentActions = computed(() => {
    const raw = props.opponentId ? (battleStore.playerActions[props.opponentId] ?? []) : [];
    return Array.from({ length: TURNS_PER_WAVE }, (_, i) => raw[i] ?? -1);
  });

  const getOpponentIcon = (i: number) => {
    if (!props.opponentId) return "🎴";
    const waveLogs = [...battleStore.shownLogs].filter((l: any) => l.wave === battleStore.wave && l.turn > 0);
    if (i < waveLogs.length) {
      const log = [...waveLogs].reverse()[i];
      const action = log?.players?.get(props.opponentId)?.action ?? -1;
      if (action >= 0) return getIcon(props.opponentId, action);
    }
    const orderIdx = opponentActions.value[i];
    return orderIdx >= 0 ? getIcon(props.opponentId, orderIdx) : "🎴";
  };

  const slotState = (i: number) => {
    if (clashIdx.value !== null && i < clashIdx.value) return "done";
    if (clashIdx.value !== null && i === clashIdx.value) return "active";
    return "pending";
  };

  const mySlotClass = (i: number) => {
    const s = slotState(i);
    if (s === "done") return "opacity-30 bg-base-200";
    if (s === "active") return "ring-2 ring-primary bg-primary/10 shadow-md";
    return "bg-base-200";
  };

  const oppSlotClass = (i: number) => {
    const s = slotState(i);
    if (s === "done") return "opacity-30 bg-base-200";
    if (s === "active") return "ring-2 ring-error bg-error/10 shadow-md";
    return "bg-base-200";
  };

  const myIconClass = (i: number) => {
    const s = slotState(i);
    if (s === "done") return "scale-90 transition-transform duration-300";
    if (s === "active") return "scale-125 transition-transform duration-300";
    return "transition-transform duration-300";
  };

  const oppIconClass = (i: number) => {
    const s = slotState(i);
    if (s === "done") return "scale-90 transition-transform duration-300";
    if (s === "active") return "scale-125 animate-pulse transition-transform duration-300";
    return "transition-transform duration-300";
  };
</script>

<template>
  <div class="bg-base-100 shadow-md">
    <div v-if="!actionsReady" class="flex justify-center py-4">
      <span class="loading loading-dots loading-sm"></span>
    </div>

    <div v-else class="flex items-stretch px-3 py-3 gap-0">
      <!-- My actions -->
      <div class="flex flex-col flex-1 gap-1 min-w-0">
        <!-- <span class="text-[10px] font-bold uppercase tracking-widest text-primary opacity-60 text-center">Bạn</span> -->
        <div class="flex gap-1">
          <div
            v-for="(orderIdx, i) in myActions"
            :key="i"
            class="flex-1 h-10 flex items-center justify-center transition-all duration-300 select-none"
            :class="mySlotClass(i)"
          >
            <span class="text-base leading-none" :class="myIconClass(i)">{{
              getIcon(playerStore.myPlayerId, orderIdx)
            }}</span>
          </div>
        </div>
      </div>

      <!-- Separator -->
      <div class="w-px bg-base-300 mx-2 self-stretch"></div>

      <!-- Opponent actions -->
      <div class="flex flex-col flex-1 gap-1 min-w-0">
        <!-- <span class="text-[10px] font-bold uppercase tracking-widest text-error opacity-60 text-center">Địch</span> -->
        <div class="flex gap-1">
          <div
            v-for="(_, i) in opponentActions"
            :key="i"
            class="flex-1 h-10 flex items-center justify-center transition-all duration-300 select-none"
            :class="oppSlotClass(i)"
          >
            <span class="text-base leading-none" :class="oppIconClass(i)">{{
              getOpponentIcon(i)
            }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
