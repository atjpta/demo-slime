<script setup lang="ts">
  import { computed } from "vue";
  import { useBattleStore, usePlayerStore } from "@/stores";
  import { SKILL_META, SKILL_COUNTER, ITEM_META, TURNS_PER_WAVE } from "@/constants";
  import slimeGif from "@/assets/slime/idle_right.gif";

  const props = defineProps<{ opponentId: string | null }>();

  const battleStore = useBattleStore();
  const playerStore = usePlayerStore();

  // ─── Skill lookup ─────────────────────────────────────────────────────────
  const getSkill = (playerId: string, orderIdx: number) => {
    if (orderIdx < 0) return null;
    return battleStore.initPlayers[playerId]?.skills[orderIdx] ?? null;
  };

  const getIcon = (playerId: string, orderIdx: number) => {
    const skill = getSkill(playerId, orderIdx);
    return skill ? (SKILL_META[skill.code]?.icon ?? "❓") : "…";
  };

  // ─── Turn tracking ────────────────────────────────────────────────────────
  // Đếm tất cả log đã reveal (kể cả turn 0) — dùng làm animation key
  const currentWaveShown = computed(
    () => battleStore.shownLogs.filter((l: any) => l.wave === battleStore.wave).length
  );

  // Chỉ đếm combat turns (turn > 0) — dùng cho clashIdx slot highlighting
  const combatWaveShown = computed(
    () => battleStore.shownLogs.filter((l: any) => l.wave === battleStore.wave && l.turn > 0).length
  );

  const clashIdx = computed(() => {
    if (combatWaveShown.value === 0) return null;
    const idx = combatWaveShown.value - 1;
    return idx < TURNS_PER_WAVE ? idx : null;
  });

  const clashKey = computed(() => currentWaveShown.value);

  // ─── Actions ──────────────────────────────────────────────────────────────
  const myActions = computed(() => {
    const raw = battleStore.playerActions[playerStore.myPlayerId] ?? [];
    return Array.from({ length: TURNS_PER_WAVE }, (_, i) => raw[i] ?? -1);
  });

  const opponentActions = computed(() => {
    const raw = props.opponentId ? (battleStore.playerActions[props.opponentId] ?? []) : [];
    return Array.from({ length: TURNS_PER_WAVE }, (_, i) => raw[i] ?? -1);
  });

  // ─── Opponent icon reveal ─────────────────────────────────────────────────
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

  // ─── Last revealed log (counter + damage) ─────────────────────────────────
  const lastShownLog = computed(
    () => battleStore.shownLogs.find((l: any) => l.wave === battleStore.wave) ?? null
  );

  const totalDamage = (effects: any[]) =>
    (effects ?? [])
      .filter((e: any) => e.typeEffect !== "heal")
      .reduce((sum: number, e: any) => sum + (e.value ?? 0), 0);

  const totalHeal = (effects: any[]) =>
    (effects ?? [])
      .filter((e: any) => e.typeEffect === "heal")
      .reduce((sum: number, e: any) => sum + (e.value ?? 0), 0);

  const isItemTurn = computed(() => lastShownLog.value?.turn === 0);

  const getItemMeta = (code: string | undefined) => {
    if (!code) return null;
    return ITEM_META[code.replace(/-/g, "_")] ?? null;
  };

  const myItemUsed = computed(() =>
    isItemTurn.value ? getItemMeta((lastShownLog.value?.players.get(playerStore.myPlayerId) as any)?.itemUsed?.code) : null
  );

  const oppItemUsed = computed(() =>
    isItemTurn.value && props.opponentId ? getItemMeta((lastShownLog.value?.players.get(props.opponentId) as any)?.itemUsed?.code) : null
  );

  const myDmg = computed(() => {
    if (!lastShownLog.value) return 0;
    return totalDamage(lastShownLog.value.players.get(playerStore.myPlayerId)?.damageReceive ?? []);
  });

  const oppDmg = computed(() => {
    if (!lastShownLog.value || !props.opponentId) return 0;
    return totalDamage(lastShownLog.value.players.get(props.opponentId)?.damageReceive ?? []);
  });

  const myHeal = computed(() => {
    if (!lastShownLog.value) return 0;
    return totalHeal(lastShownLog.value.players.get(playerStore.myPlayerId)?.damageReceive ?? []);
  });

  const oppHeal = computed(() => {
    if (!lastShownLog.value || !props.opponentId) return 0;
    return totalHeal(lastShownLog.value.players.get(props.opponentId)?.damageReceive ?? []);
  });

  const counter = computed(() => {
    if (!lastShownLog.value || !props.opponentId) return null;
    const myAction = lastShownLog.value.players.get(playerStore.myPlayerId)?.action ?? -1;
    const oppAction = lastShownLog.value.players.get(props.opponentId)?.action ?? -1;
    const mySkill = getSkill(playerStore.myPlayerId, myAction);
    const oppSkill = getSkill(props.opponentId, oppAction);
    if (!mySkill || !oppSkill) return null;
    return SKILL_COUNTER[`${mySkill.type}_vs_${oppSkill.type}`] ?? null;
  });

  const oppCounter = computed(() => {
    if (!lastShownLog.value || !props.opponentId) return null;
    const myAction = lastShownLog.value.players.get(playerStore.myPlayerId)?.action ?? -1;
    const oppAction = lastShownLog.value.players.get(props.opponentId)?.action ?? -1;
    const mySkill = getSkill(playerStore.myPlayerId, myAction);
    const oppSkill = getSkill(props.opponentId, oppAction);
    if (!mySkill || !oppSkill) return null;
    return SKILL_COUNTER[`${oppSkill.type}_vs_${mySkill.type}`] ?? null;
  });

  // ─── Clash icons của turn vừa reveal ─────────────────────────────────────
  const myClashIcon = computed(() => {
    if (clashIdx.value === null) return null;
    return getIcon(playerStore.myPlayerId, myActions.value[clashIdx.value]);
  });

  const oppClashIcon = computed(() => {
    if (clashIdx.value === null) return null;
    return getOpponentIcon(clashIdx.value);
  });

  const oppName = computed(() =>
    props.opponentId ? (battleStore.initPlayers[props.opponentId]?.name ?? "Đối thủ") : "Đối thủ"
  );
</script>

<template>
  <div
    class="relative z-10 bg-base-100 shadow-md grid grid-cols-[1fr_auto_1fr] items-end px-3 pb-3 gap-1"
  >
    <!-- My slime -->
    <div class="flex flex-col items-center gap-1 relative">
      <!-- Chat bubble (absolute, floats above into PlayerCard) -->
      <div
        class="absolute bottom-full left-0 right-0 flex justify-center pb-1 pointer-events-none"
        style="height: 40px; align-items: flex-end"
      >
        <Transition name="bubble" mode="out-in">
          <div v-if="myItemUsed" :key="`item-${clashKey}`" class="flex flex-col items-center">
            <div
              class="px-4 py-1.5 whitespace-nowrap"
              :class="myHeal > 0 ? 'bg-success text-success-content' : 'bg-warning text-warning-content'"
              :style="myHeal > 0
                ? 'transform:skewX(-14deg);box-shadow:0 3px 12px -2px oklch(var(--su)/0.6)'
                : 'transform:skewX(-14deg);box-shadow:0 3px 12px -2px oklch(var(--wa)/0.6)'"
            >
              <span
                class="block text-[11px] font-black uppercase tracking-widest leading-none"
                style="transform: skewX(14deg); text-shadow: 1px 1px 0 rgba(0,0,0,0.25)"
                >{{ myItemUsed.icon }} {{ myItemUsed.label }}!</span
              >
            </div>
            <div
              class="w-2.5 h-2.5 rotate-45 -mt-1.5"
              :class="myHeal > 0 ? 'bg-success' : 'bg-warning'"
            ></div>
          </div>
          <div v-else-if="counter?.win" :key="clashKey" class="flex flex-col items-center">
            <div
              class="px-4 py-1.5 bg-success text-success-content whitespace-nowrap"
              style="transform: skewX(-14deg); box-shadow: 0 3px 12px -2px oklch(var(--su) / 0.6)"
            >
              <span
                class="block text-[11px] font-black uppercase tracking-widest leading-none"
                style="transform: skewX(14deg); text-shadow: 1px 1px 0 rgba(0, 0, 0, 0.25)"
                >{{ counter.icon }} {{ counter.label }}!</span
              >
            </div>
            <div class="w-2.5 h-2.5 bg-success rotate-45 -mt-1.5"></div>
          </div>
        </Transition>
      </div>

      <!-- Slime + damage/heal float -->
      <div class="relative">
        <span
          v-if="myDmg > 0"
          :key="`dmg-${clashKey}`"
          class="dmg-float absolute top-1/2 left-1/2 text-error font-extrabold text-base whitespace-nowrap pointer-events-none z-10"
          >-{{ myDmg }}</span
        >
        <span
          v-if="myHeal > 0"
          :key="`heal-${clashKey}`"
          class="heal-float absolute top-1/2 left-1/2 text-success font-extrabold text-base whitespace-nowrap pointer-events-none z-10"
          >+{{ myHeal }}</span
        >
        <img :src="slimeGif" class="h-24 w-auto object-contain" />
      </div>
      <span class="text-[11px] font-bold text-primary truncate max-w-[72px]">
        {{ playerStore.myPlayer?.name ?? "Bạn" }}
      </span>
    </div>

    <!-- Center clash zone — luôn render để giữ kích thước, không gây layout shift -->
    <div class="flex flex-col items-center justify-center h-full w-full">
      <div :key="`skills-${clashKey}`" class="flex items-center gap-1.5">
        <span
          v-if="clashIdx !== null"
          v-motion
          :initial="{ x: -28, opacity: 0 }"
          :enter="{ x: 0, opacity: 1, transition: { duration: 280 } }"
          class="text-2xl w-8 text-center"
          >{{ myClashIcon }}</span
        >
        <span v-else class="text-2xl w-8 opacity-0 select-none pointer-events-none">·</span>

        <!-- ⚔️ luôn render với h-24 cố định -->
        <div class="flex items-center justify-center w-12 shrink-0 mx-0.5">
          <div class="relative w-10 h-10 flex items-center justify-center pointer-events-none">
            <div class="absolute w-6 h-6 rotate-45 bg-base-content opacity-10 rounded-sm"></div>
            <span class="relative z-10 text-base opacity-20">⚔️</span>
          </div>
        </div>

        <span
          v-if="clashIdx !== null"
          v-motion
          :initial="{ x: 28, opacity: 0 }"
          :enter="{ x: 0, opacity: 1, transition: { duration: 280 } }"
          class="text-2xl w-8 text-center"
          >{{ oppClashIcon }}</span
        >
        <span v-else class="text-2xl w-8 opacity-0 select-none pointer-events-none">·</span>
      </div>
    </div>

    <!-- Opponent slime (flipped) -->
    <div class="flex flex-col items-center gap-1 relative">
      <!-- Chat bubble (absolute) -->
      <div
        class="absolute bottom-full left-0 right-0 flex justify-center pb-1 pointer-events-none"
        style="height: 40px; align-items: flex-end"
      >
        <Transition name="bubble" mode="out-in">
          <div v-if="oppItemUsed" :key="`opp-item-${clashKey}`" class="flex flex-col items-center">
            <div
              class="px-4 py-1.5 whitespace-nowrap"
              :class="oppHeal > 0 ? 'bg-success text-success-content' : 'bg-warning text-warning-content'"
              :style="oppHeal > 0
                ? 'transform:skewX(14deg);box-shadow:0 3px 12px -2px oklch(var(--su)/0.6)'
                : 'transform:skewX(14deg);box-shadow:0 3px 12px -2px oklch(var(--wa)/0.6)'"
            >
              <span
                class="block text-[11px] font-black uppercase tracking-widest leading-none"
                style="transform: skewX(-14deg); text-shadow: 1px 1px 0 rgba(0,0,0,0.25)"
                >{{ oppItemUsed.icon }} {{ oppItemUsed.label }}!</span
              >
            </div>
            <div
              class="w-2.5 h-2.5 rotate-45 -mt-1.5"
              :class="oppHeal > 0 ? 'bg-success' : 'bg-warning'"
            ></div>
          </div>
          <div v-else-if="oppCounter?.win" :key="clashKey" class="flex flex-col items-center">
            <div
              class="px-4 py-1.5 bg-error text-error-content whitespace-nowrap"
              style="transform: skewX(14deg); box-shadow: 0 3px 12px -2px oklch(var(--er) / 0.6)"
            >
              <span
                class="block text-[11px] font-black uppercase tracking-widest leading-none"
                style="transform: skewX(-14deg); text-shadow: 1px 1px 0 rgba(0, 0, 0, 0.25)"
                >{{ oppCounter.icon }} {{ oppCounter.label }}!</span
              >
            </div>
            <div class="w-2.5 h-2.5 bg-error rotate-45 -mt-1.5"></div>
          </div>
        </Transition>
      </div>

      <!-- Slime + damage/heal float -->
      <div class="relative">
        <span
          v-if="oppDmg > 0"
          :key="`opp-dmg-${clashKey}`"
          class="dmg-float absolute top-1/2 left-1/2 text-error font-extrabold text-base whitespace-nowrap pointer-events-none z-10"
          >-{{ oppDmg }}</span
        >
        <span
          v-if="oppHeal > 0"
          :key="`opp-heal-${clashKey}`"
          class="heal-float absolute top-1/2 left-1/2 text-success font-extrabold text-base whitespace-nowrap pointer-events-none z-10"
          >+{{ oppHeal }}</span
        >
        <img :src="slimeGif" class="h-24 w-auto object-contain -scale-x-100" />
      </div>
      <span class="text-[11px] font-bold text-error truncate max-w-[72px]">
        {{ oppName }}
      </span>
    </div>
  </div>
</template>

<style scoped>
  .dmg-float {
    animation: dmg-float 1s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  }
  .heal-float {
    animation: heal-float 1s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  }
  @keyframes heal-float {
    0% {
      opacity: 0;
      transform: translateX(-50%) translateY(0px) scale(0.75);
    }
    10% {
      opacity: 1;
      transform: translateX(-50%) translateY(-6px) scale(1.2);
    }
    20% {
      transform: translateX(-50%) translateY(-10px) scale(1);
    }
    70% {
      opacity: 1;
      transform: translateX(-50%) translateY(-48px) scale(1);
    }
    100% {
      opacity: 0;
      transform: translateX(-50%) translateY(-72px) scale(0.95);
    }
  }
  @keyframes dmg-float {
    0% {
      opacity: 0;
      transform: translateX(-50%) translateY(0px) scale(0.75);
    }
    10% {
      opacity: 1;
      transform: translateX(-50%) translateY(-6px) scale(1.2);
    }
    20% {
      transform: translateX(-50%) translateY(-10px) scale(1);
    }
    70% {
      opacity: 1;
      transform: translateX(-50%) translateY(-48px) scale(1);
    }
    100% {
      opacity: 0;
      transform: translateX(-50%) translateY(-72px) scale(0.95);
    }
  }

  .bubble-enter-active {
    animation: bubble-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
    opacity: 0;
  }
  .bubble-leave-active {
    animation: bubble-out 0.05s ease-in forwards;
  }
  @keyframes bubble-in {
    0% {
      opacity: 0;
      transform: scale(0.5) translateY(6px);
    }
    100% {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }
  @keyframes bubble-out {
    0% {
      opacity: 1;
      transform: scale(1);
    }
    100% {
      opacity: 0;
      transform: scale(0.8);
    }
  }
</style>
