<script setup lang="ts">
  import { computed } from "vue";
  import { useBattleStore, usePlayerStore } from "@/stores";
  import { SKILL_META, SKILL_COUNTER, ITEM_META } from "@/constants";
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

  const getItemIcon = (code: string | undefined) =>
    code ? (ITEM_META[code.replace(/-/g, "_")]?.icon ?? "❓") : undefined;

  const totalDamage = (effects: any[]) =>
    (effects ?? [])
      .filter((e: any) => e.typeEffect !== "heal")
      .reduce((sum: number, e: any) => sum + (e.value ?? 0), 0);

  const totalHeal = (effects: any[]) =>
    (effects ?? [])
      .filter((e: any) => e.typeEffect === "heal")
      .reduce((sum: number, e: any) => sum + (e.value ?? 0), 0);

  const groups = computed<LogGroup[]>(() => {
    const map = new Map<number, any[]>();
    for (const log of battleStore.shownLogs) {
      if (!map.has(log.wave)) map.set(log.wave, []);
      const myEffects = [...(log.players.get(playerStore.myPlayerId)?.damageReceive ?? [])];
      const oppEffects = [...(log.players.get(props.opponentId ?? "")?.damageReceive ?? [])];

      const myPlayer = log.players.get(playerStore.myPlayerId);
      const oppPlayer = log.players.get(props.opponentId ?? "");

      if (log.turn === 0) {
        const myHeal = totalHeal(myEffects);
        const oppHeal = totalHeal(oppEffects);
        const myItemCode = (myPlayer as any)?.itemUsed?.code as string | undefined;
        const oppItemCode = (oppPlayer as any)?.itemUsed?.code as string | undefined;
        const norm = (c?: string) => c?.replace(/-/g, "_");
        const myCode = norm(myItemCode);
        const oppCode = norm(oppItemCode);

        let effectNote: string | undefined;
        if (myCode === "paradox_001" || oppCode === "paradox_001") {
          effectNote = myCode === oppCode ? "🔄 Counter bị huỷ" : "🔄 Counter đảo ngược";
        } else if (myCode === "storm_001" || oppCode === "storm_001") {
          effectNote = "🌪️ Actions cả hai bị xáo trộn";
        } else if (myCode === "push_001") {
          effectNote = "⏩ Actions đối thủ bị dịch chuyển";
        } else if (oppCode === "push_001") {
          effectNote = "⏩ Actions bạn bị dịch chuyển";
        } else if (myCode === "shuffle_001") {
          effectNote = "🔀 Actions đối thủ bị xáo trộn";
        } else if (oppCode === "shuffle_001") {
          effectNote = "🔀 Actions bạn bị xáo trộn";
        }

        const toIcons = (pid: string, actions?: number[]) =>
          actions?.map((idx) => getSkillIcon(pid, idx)) ?? [];
        const myAff = (myPlayer as any)?.actionsAffected;
        const oppAff = (oppPlayer as any)?.actionsAffected;

        map.get(log.wave)!.push({
          wave: log.wave,
          turn: 0,
          myHp: myPlayer?.stats?.hp ?? "?",
          myDamage: 0,
          myHeal,
          mySkillIcon: myItemCode ? (getItemIcon(myItemCode) ?? "—") : "—",
          oppHp: oppPlayer?.stats?.hp ?? "?",
          oppDamage: 0,
          oppHeal,
          oppSkillIcon: oppItemCode ? (getItemIcon(oppItemCode) ?? "—") : "—",
          counter: null,
          effectNote,
          myActionsAffected: myAff ? { before: toIcons(playerStore.myPlayerId, myAff.before), after: toIcons(playerStore.myPlayerId, myAff.after) } : undefined,
          oppActionsAffected: oppAff ? { before: toIcons(props.opponentId ?? "", oppAff.before), after: toIcons(props.opponentId ?? "", oppAff.after) } : undefined,
        });
      } else {
        const myAction = myPlayer?.action ?? -1;
        const oppAction = oppPlayer?.action ?? -1;
        const mySkill = getSkill(playerStore.myPlayerId, myAction);
        const oppSkill = getSkill(props.opponentId ?? "", oppAction);
        map.get(log.wave)!.push({
          wave: log.wave,
          turn: log.turn,
          myHp: myPlayer?.stats?.hp ?? "?",
          myDamage: totalDamage(myEffects),
          myHeal: 0,
          mySkillIcon: getSkillIcon(playerStore.myPlayerId, myAction),
          myItemIcon: getItemIcon((myPlayer as any)?.itemUsed?.code),
          oppHp: oppPlayer?.stats?.hp ?? "?",
          oppDamage: totalDamage(oppEffects),
          oppHeal: 0,
          oppSkillIcon: getSkillIcon(props.opponentId ?? "", oppAction),
          oppItemIcon: getItemIcon((oppPlayer as any)?.itemUsed?.code),
          counter:
            mySkill && oppSkill
              ? (SKILL_COUNTER[`${mySkill.type}_vs_${oppSkill.type}`] ?? null)
              : null,
        });
      }
    }
    return [...map.entries()]
      .sort(([a], [b]) => b - a)
      .map(([wave, logs]) => ({ wave, logs: [...logs].sort((a, b) => b.turn - a.turn) }));
  });
</script>

<template>
  <TurnLogList :groups="groups" />
</template>
