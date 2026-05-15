<script setup lang="ts">
  import { computed } from "vue";
  import { useBattleStore, usePlayerStore } from "@/stores";
  import { SKILL_META, TURNS_PER_WAVE } from "@/constants";

  const props = defineProps<{
    opponentId: string | null;
  }>();

  const battleStore = useBattleStore();
  const playerStore = usePlayerStore();

  // ─── Skill lookup by playerId + orderIndex ────────────────────────────────
  const getSkill = (playerId: string, orderIdx: number) => {
    if (orderIdx < 0) return null;
    return battleStore.initPlayers[playerId]?.skills[orderIdx] ?? null;
  };

  const getIcon = (playerId: string, orderIdx: number) => {
    const skill = getSkill(playerId, orderIdx);
    return skill ? (SKILL_META[skill.code]?.icon ?? "❓") : "…";
  };

  const getLabel = (playerId: string, orderIdx: number) => {
    const skill = getSkill(playerId, orderIdx);
    return skill ? (SKILL_META[skill.code]?.label ?? "") : "";
  };

  // ─── Clash indicator ──────────────────────────────────────────────────────
  const currentWaveShown = computed(
    () => battleStore.shownLogs.filter((l: any) => l.wave === battleStore.wave).length
  );

  const clashIdx = computed(() =>
    currentWaveShown.value < TURNS_PER_WAVE ? currentWaveShown.value : null
  );

  // ─── Actions data ─────────────────────────────────────────────────────────
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

  // ─── Opponent icon: reveal from logs once played, else from actions ───────
  const getOpponentIcon = (i: number) => {
    if (!props.opponentId) return "🎴";
    const waveLogs = [...battleStore.shownLogs].filter((l: any) => l.wave === battleStore.wave);
    if (i < waveLogs.length) {
      const log = [...waveLogs].reverse()[i];
      const action = log?.players?.get(props.opponentId)?.action ?? -1;
      if (action >= 0) return getIcon(props.opponentId, action);
    }
    const orderIdx = opponentActions.value[i];
    return orderIdx >= 0 ? getIcon(props.opponentId, orderIdx) : "🎴";
  };

  const getOpponentLabel = (i: number) => {
    if (!props.opponentId) return "";
    const orderIdx = opponentActions.value[i];
    return orderIdx >= 0 ? getLabel(props.opponentId, orderIdx) : "";
  };

  // ─── Slot CSS ─────────────────────────────────────────────────────────────
  const mySlotClass = (i: number) => {
    const done = i < currentWaveShown.value;
    const active = i === clashIdx.value;
    if (done) return "bg-base-200 opacity-40 scale-95";
    if (active) return "ring-2 ring-primary scale-110 bg-primary/10 shadow-lg";
    return "bg-base-200";
  };

  const opponentSlotClass = (i: number) => {
    const done = i < currentWaveShown.value;
    const active = i === clashIdx.value;
    if (done) return "bg-base-200 opacity-40 scale-95";
    if (active) return "ring-2 ring-error scale-110 bg-error/10 shadow-lg";
    return "bg-base-200";
  };
</script>

<template>
  <div class="bg-base-100 shadow-md rounded-none">
    <div class="p-4 gap-4 flex flex-col">
      <div v-if="!actionsReady" class="flex justify-center py-4">
        <span class="loading loading-dots loading-sm"></span>
      </div>

      <div v-if="actionsReady" class="flex flex-col gap-1">
        <!-- My row -->
        <div class="text-xs font-semibold opacity-60 mb-1">Bạn</div>
        <div class="grid gap-1.5" :style="`grid-template-columns: repeat(${TURNS_PER_WAVE}, 1fr)`">
          <div
            v-for="(orderIdx, i) in myActions"
            :key="i"
            class="h-14 flex flex-col items-center justify-center gap-0.5 transition-all duration-300 select-none"
            :class="mySlotClass(i)"
          >
            <span class="text-xl leading-none">{{
              getIcon(playerStore.myPlayerId, orderIdx)
            }}</span>
            <span class="text-[10px] opacity-60 leading-none truncate max-w-full px-1">
              {{ getLabel(playerStore.myPlayerId, orderIdx) || i + 1 }}
            </span>
          </div>
        </div>

        <!-- Clash indicator -->
        <div class="grid h-7" :style="`grid-template-columns: repeat(${TURNS_PER_WAVE}, 1fr)`">
          <div v-for="i in TURNS_PER_WAVE" :key="i" class="flex justify-center items-center">
            <span v-if="clashIdx === i - 1" class="text-base animate-bounce leading-none">⚔️</span>
          </div>
        </div>

        <!-- Opponent row -->
        <div class="grid gap-1.5" :style="`grid-template-columns: repeat(${TURNS_PER_WAVE}, 1fr)`">
          <div
            v-for="(_, i) in opponentActions"
            :key="i"
            class="h-14 flex flex-col items-center justify-center gap-0.5 transition-all duration-300 select-none"
            :class="opponentSlotClass(i)"
          >
            <span class="text-xl leading-none" :class="{ 'animate-pulse': i === clashIdx }">{{
              getOpponentIcon(i)
            }}</span>
            <span class="text-[10px] opacity-60 leading-none truncate max-w-full px-1">
              {{ getOpponentLabel(i) || i + 1 }}
            </span>
          </div>
        </div>

        <div class="text-xs font-semibold opacity-60 mt-1 text-right">Đối thủ</div>
      </div>
    </div>
  </div>
</template>
