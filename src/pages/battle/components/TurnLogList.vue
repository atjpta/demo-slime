<script setup lang="ts">
  import { computed } from "vue";
  import { useBattleStore, usePlayerStore } from "@/stores";
  import { SKILL_META, SKILL_COUNTER } from "@/constants";
  import TurnLogList from "@/components/TurnLogList.vue";
  import type { LogGroup } from "@/components/TurnLogList.vue";

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

  const totalDamage = (effects: any[]) =>
    (effects ?? []).reduce((sum: number, e: any) => sum + (e.value ?? 0), 0);

  const groups = computed<LogGroup[]>(() => {
    const map = new Map<number, any[]>();
    for (const log of battleStore.shownLogs) {
      if (!map.has(log.wave)) map.set(log.wave, []);
      const myAction = log.players.get(playerStore.myPlayerId)?.action ?? -1;
      const oppAction = log.players.get(props.opponentId ?? "")?.action ?? -1;
      const mySkill = getSkill(playerStore.myPlayerId, myAction);
      const oppSkill = getSkill(props.opponentId ?? "", oppAction);
      map.get(log.wave)!.push({
        wave: log.wave,
        turn: log.turn,
        myHp: log.players.get(playerStore.myPlayerId)?.stats?.hp ?? "?",
        myDamage: totalDamage([...(log.players.get(playerStore.myPlayerId)?.damageReceive ?? [])]),
        mySkillIcon: getSkillIcon(playerStore.myPlayerId, myAction),
        oppHp: log.players.get(props.opponentId ?? "")?.stats?.hp ?? "?",
        oppDamage: totalDamage([...(log.players.get(props.opponentId ?? "")?.damageReceive ?? [])]),
        oppSkillIcon: getSkillIcon(props.opponentId ?? "", oppAction),
        counter:
          mySkill && oppSkill
            ? (SKILL_COUNTER[`${mySkill.type}_vs_${oppSkill.type}`] ?? null)
            : null,
      });
    }
    return [...map.entries()]
      .sort(([a], [b]) => b - a)
      .map(([wave, logs]) => ({ wave, logs: [...logs].sort((a, b) => b.turn - a.turn) }));
  });
</script>

<template>
  <TurnLogList :groups="groups" />
</template>
