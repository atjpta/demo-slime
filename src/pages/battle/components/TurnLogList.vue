<script setup lang="ts">
  import { computed } from "vue";
  import { useBattleStore, usePlayerStore } from "@/stores";
  import { SKILL_META, SKILL_COUNTER } from "@/constants";

  const props = defineProps<{ opponentId: string | null }>();

  const battleStore = useBattleStore();
  const playerStore = usePlayerStore();

  const getSkill = (playerId: string, orderIdx: number) => {
    if (orderIdx < 0) return null;
    return battleStore.initPlayers[playerId]?.skills[orderIdx] ?? null;
  };

  const getSkillIcon = (playerId: string, orderIdx: number) => {
    const skill = getSkill(playerId, orderIdx);
    return skill ? (SKILL_META[skill.code]?.icon ?? "❓") : "…";
  };

  const getSkillLabel = (playerId: string, orderIdx: number) => {
    const skill = getSkill(playerId, orderIdx);
    return skill ? (SKILL_META[skill.code]?.label ?? "") : "";
  };

  const getCounter = (myAction: number, oppAction: number) => {
    const mySkill = getSkill(playerStore.myPlayerId, myAction);
    const oppSkill = getSkill(props.opponentId ?? "", oppAction);
    if (!mySkill || !oppSkill) return null;
    return SKILL_COUNTER[`${mySkill.type}_vs_${oppSkill.type}`] ?? null;
  };

  const totalDamage = (effects: any[]) => {
    if (!effects?.length) return 0;
    return [...effects].reduce((sum, e) => sum + (e.value ?? 0), 0);
  };

  const waveGroups = computed(() => {
    const logs = battleStore.logs;
    const map = new Map<number, any[]>();
    for (const log of logs) {
      if (!map.has(log.wave)) map.set(log.wave, []);
      map.get(log.wave)!.push(log);
    }
    return [...map.entries()]
      .sort(([a], [b]) => b - a)
      .map(([wave, waveLogs]) => ({
        wave,
        logs: [...waveLogs]
          .sort((a, b) => b.turn - a.turn)
          .map((log) => ({
            ...log,
            counter: getCounter(
              log.players.get(playerStore.myPlayerId)?.action ?? -1,
              log.players.get(props.opponentId ?? "")?.action ?? -1
            ),
          })),
      }));
  });
</script>

<template>
  <div v-if="battleStore.logs.length > 1" class="bg-base-100 shadow-md rounded-none">
    <div class="p-3 gap-2 flex flex-col">
      <TransitionGroup name="wave-group" tag="div" class="flex flex-col gap-3">
        <div v-for="group in waveGroups" :key="group.wave">
          <!-- Wave header -->
          <div class="flex items-center gap-2 mb-1.5">
            <div class="flex-1 h-px bg-base-300"></div>
            <span class="text-[10px] font-bold opacity-40 uppercase tracking-widest"
              >Wave {{ group.wave }}</span
            >
            <div class="flex-1 h-px bg-base-300"></div>
          </div>

          <!-- Turn rows: one compact line per turn -->
          <TransitionGroup name="log-entry" tag="div" class="flex flex-col gap-1.5">
            <div
              v-for="log in group.logs"
              :key="`${log.wave}-${log.turn}`"
              class="grid items-center bg-base-200 px-3 py-2 text-xs"
              style="grid-template-columns: auto 1fr 9rem 1fr"
            >
              <!-- Turn badge -->
              <!-- <span class="badge badge-xs shrink-0 mr-3">T{{ log.turn }}</span> -->
              <div></div>

              <!-- Me: HP · damage · icon → right-aligned -->
              <div class="flex items-center justify-end gap-2 tabular-nums">
                <span class="font-bold text-primary">{{
                  log.players.get(playerStore.myPlayerId)?.stats?.hp ?? "?"
                }}</span>
                <span
                  v-if="
                    totalDamage([
                      ...(log.players.get(playerStore.myPlayerId)?.damageReceive ?? []),
                    ]) > 0
                  "
                  class="text-error font-semibold w-10 text-center"
                >
                  -{{
                    totalDamage([
                      ...(log.players.get(playerStore.myPlayerId)?.damageReceive ?? []),
                    ])
                  }}❤️
                </span>
                <span v-else class="opacity-25 w-10 text-center">❤️</span>
                <span>{{
                  getSkillIcon(
                    playerStore.myPlayerId,
                    log.players.get(playerStore.myPlayerId)?.action ?? -1
                  )
                }}</span>
              </div>

              <!-- Counter: fixed width, centered -->
              <div class="flex justify-center w-full">
                <span
                  v-if="log.counter"
                  class="badge badge-xs font-bold w-fit py-2 justify-center"
                  :class="log.counter.color"
                  >{{ log.counter.icon }} {{ log.counter.label }}</span
                >
                <span v-else class="opacity-20">⚔️</span>
              </div>

              <!-- Opponent: icon · damage · HP → left-aligned -->
              <div class="flex items-center gap-2 tabular-nums">
                <span>{{
                  getSkillIcon(opponentId ?? "", log.players.get(opponentId ?? "")?.action ?? -1)
                }}</span>
                <span
                  v-if="
                    totalDamage([...(log.players.get(opponentId ?? '')?.damageReceive ?? [])]) > 0
                  "
                  class="text-error font-semibold w-10 text-center"
                >
                  -{{
                    totalDamage([...(log.players.get(opponentId ?? "")?.damageReceive ?? [])])
                  }}❤️
                </span>
                <span v-else class="opacity-25 w-10 text-center">❤️</span>
                <span class="font-bold text-error">{{
                  log.players.get(opponentId ?? "")?.stats?.hp ?? "?"
                }}</span>
              </div>
            </div>
          </TransitionGroup>
        </div>
      </TransitionGroup>
    </div>
  </div>
</template>

<style scoped>
  .log-entry-enter-active {
    transition: all 0.45s ease;
  }
  .log-entry-enter-from {
    opacity: 0;
    transform: translateY(-12px);
  }
  .log-entry-move {
    transition: transform 0.4s ease;
  }

  .wave-group-enter-active {
    transition: all 0.3s ease;
  }
  .wave-group-enter-from {
    opacity: 0;
    transform: translateY(-8px);
  }
</style>
