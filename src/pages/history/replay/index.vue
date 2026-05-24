<script setup lang="ts">
  import { ref, computed, onMounted, onUnmounted } from "vue";
  import { useRoute, useRouter } from "vue-router";
  import { toast } from "vue-sonner";
  import { usePlayerStore } from "@/stores";
  import { battleLogService } from "@/client";
  import type { BattleLogDetail, BattleLogTurn, PlayerItemWaveLogDetail } from "@/client";
  import { SKILL_META, SKILL_COUNTER, ITEM_META, MAX_ITEM_SLOTS } from "@/constants";
  import slimeGif from "@/assets/slime/idle_right.gif";
  import TurnLogList from "@/components/TurnLogList.vue";
  import type { LogGroup } from "@/components/TurnLogList.vue";

  const route = useRoute();
  const router = useRouter();
  const playerStore = usePlayerStore();

  const detail = ref<BattleLogDetail | null>(null);
  const loading = ref(true);
  const turnIdx = ref(0);
  let autoTimer: ReturnType<typeof setInterval> | null = null;

  // Sorted flat list of all turns
  const sortedLogs = computed<BattleLogTurn[]>(() => {
    if (!detail.value) return [];
    return [...detail.value.logs].sort((a, b) => a.wave - b.wave || a.turn - b.turn);
  });

  // p0 = tôi nếu có trong trận, fallback players[0]
  const p0 = computed(
    () =>
      detail.value?.players.find((p) => p.player._id === playerStore.myPlayerId) ??
      detail.value?.players[0] ??
      null
  );
  // p1 = player khác với p0 (không dùng myPlayerId để tránh sai khi xem trận người khác)
  const p1 = computed(
    () => detail.value?.players.find((p) => p.player._id !== p0.value?.player._id) ?? null
  );

  const p0Id = computed(() => p0.value?.player._id ?? "");
  const p1Id = computed(() => p1.value?.player._id ?? "");

  const p0InitHp = computed(() => p0.value?.stats.hp ?? 1);
  const p1InitHp = computed(() => p1.value?.stats.hp ?? 1);

  const snapToEntry = (snap?: { code: string }) => {
    if (!snap) return undefined;
    const norm = snap.code.replace(/-/g, "_");
    const meta = ITEM_META[norm];
    return { code: snap.code, icon: meta?.icon ?? "❓", label: meta?.label ?? norm };
  };

  // Map wave -> { p0Log, p1Log } từ itemWaveLogs
  const itemWaveMap = computed(() => {
    const map = new Map<
      number,
      { p0Log?: PlayerItemWaveLogDetail; p1Log?: PlayerItemWaveLogDetail }
    >();
    if (!detail.value?.itemWaveLogs) return map;
    for (const playerWave of detail.value?.itemWaveLogs) {
      const isP0 = playerWave.player === p0Id.value;
      for (const waveLog of playerWave.logs) {
        if (!map.has(waveLog.wave)) map.set(waveLog.wave, {});
        const entry = map.get(waveLog.wave)!;
        if (isP0) entry.p0Log = waveLog;
        else entry.p1Log = waveLog;
      }
    }
    return map;
  });

  const currentWaveInventory = (pid0: boolean) =>
    computed(() => {
      const wave = activeLog.value?.wave ?? 0;
      // Tìm wave log gần nhất ≤ wave hiện tại
      let result: ReturnType<typeof snapToEntry>[] = [];
      for (const [w, entry] of itemWaveMap.value) {
        if (w <= wave) {
          const log = pid0 ? entry.p0Log : entry.p1Log;
          if (log) result = log.inventoryAfter.map((s) => snapToEntry(s)!);
        }
      }
      return result;
    });

  const p0Inventory = currentWaveInventory(true);
  const p1Inventory = currentWaveInventory(false);

  // Khi không replay: dùng turn cuối; khi replay: dùng turnIdx hiện tại
  const activeTurnIdx = computed(() =>
    isReplayMode.value ? turnIdx.value : sortedLogs.value.length - 1
  );
  const activeLog = computed(() => sortedLogs.value[activeTurnIdx.value] ?? null);

  // Khi không replay: show tất cả log; khi replay: chỉ show đến turnIdx
  const visibleLogs = computed(() =>
    isReplayMode.value ? sortedLogs.value.slice(0, turnIdx.value + 1) : sortedLogs.value
  );

  const turnData = (pid: string) => activeLog.value?.players[pid] ?? null;

  const hpPercent = (pid: string, initHpVal: number) => {
    const hp = turnData(pid)?.stats.hp ?? initHpVal;
    return Math.max(0, Math.min(100, (hp / initHpVal) * 100));
  };

  const hpBarClass = (pct: number) => {
    if (pct > 55) return "bg-success";
    if (pct > 25) return "bg-warning";
    return "bg-error animate-pulse";
  };

  const getSkill = (player: typeof p0.value, actionIdx: number) => {
    if (!player || actionIdx < 0) return null;
    return player.skills[actionIdx] ?? null;
  };

  const skillIcon = (player: typeof p0.value, actionIdx: number) => {
    const s = getSkill(player, actionIdx);
    return s ? (SKILL_META[s.code]?.icon ?? "❓") : "…";
  };

  const getItemIcon = (code: string | undefined) =>
    code ? (ITEM_META[code.replace(/-/g, "_")]?.icon ?? "❓") : undefined;

  const normalizedGroups = computed<LogGroup[]>(() => {
    if (!p0.value || !p1.value) return [];
    const map = new Map<number, any[]>();
    for (let i = 0; i < visibleLogs.value.length; i++) {
      const log = visibleLogs.value[i];
      if (!map.has(log.wave)) map.set(log.wave, []);
      const myD = log.players[p0Id.value];
      const oppD = log.players[p1Id.value];
      const myEffects: any[] = myD?.damageReceive ?? [];
      const oppEffects: any[] = oppD?.damageReceive ?? [];

      if (log.turn === 0) {
        const myHeal = myEffects
          .filter((e) => e.typeEffect === "heal")
          .reduce((s, e) => s + e.value, 0);
        const oppHeal = oppEffects
          .filter((e) => e.typeEffect === "heal")
          .reduce((s, e) => s + e.value, 0);
        const myItemCode = myD?.itemUsed?.code as string | undefined;
        const oppItemCode = oppD?.itemUsed?.code as string | undefined;
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

        const toIcons = (player: typeof p0.value, actions?: number[]) =>
          actions?.map((idx) => skillIcon(player, idx)) ?? [];
        const myAff = myD?.actionsAffected;
        const oppAff = oppD?.actionsAffected;

        map.get(log.wave)!.push({
          wave: log.wave,
          turn: 0,
          myHp: myD?.stats.hp ?? "?",
          myDamage: 0,
          myHeal,
          mySkillIcon: myItemCode ? (getItemIcon(myItemCode) ?? "—") : "—",
          oppHp: oppD?.stats.hp ?? "?",
          oppDamage: 0,
          oppHeal,
          oppSkillIcon: oppItemCode ? (getItemIcon(oppItemCode) ?? "—") : "—",
          counter: null,
          effectNote,
          myActionsAffected: myAff
            ? { before: toIcons(p0.value, myAff.before), after: toIcons(p0.value, myAff.after) }
            : undefined,
          oppActionsAffected: oppAff
            ? { before: toIcons(p1.value, oppAff.before), after: toIcons(p1.value, oppAff.after) }
            : undefined,
          isActive: isReplayMode.value && i === turnIdx.value,
        });
      } else {
        const mySkill = getSkill(p0.value, myD?.action ?? -1);
        const oppSkill = getSkill(p1.value, oppD?.action ?? -1);
        map.get(log.wave)!.push({
          wave: log.wave,
          turn: log.turn,
          myHp: myD?.stats.hp ?? "?",
          myDamage: myEffects
            .filter((e) => e.typeEffect !== "heal")
            .reduce((s, e) => s + e.value, 0),
          myHeal: 0,
          mySkillIcon: skillIcon(p0.value, myD?.action ?? -1),
          myItemIcon: getItemIcon(myD?.itemUsed?.code),
          oppHp: oppD?.stats.hp ?? "?",
          oppDamage: oppEffects
            .filter((e) => e.typeEffect !== "heal")
            .reduce((s, e) => s + e.value, 0),
          oppHeal: 0,
          oppSkillIcon: skillIcon(p1.value, oppD?.action ?? -1),
          oppItemIcon: getItemIcon(oppD?.itemUsed?.code),
          counter:
            mySkill && oppSkill
              ? (SKILL_COUNTER[`${mySkill.type}_vs_${oppSkill.type}`] ?? null)
              : null,
          isActive: isReplayMode.value && i === turnIdx.value,
        });
      }
    }
    return [...map.entries()]
      .sort(([a], [b]) => b - a)
      .map(([wave, logs]) => {
        const waveEntry = itemWaveMap.value.get(wave);
        const buildItemWaveLog = (
          p0Log?: PlayerItemWaveLogDetail,
          p1Log?: PlayerItemWaveLogDetail
        ) => {
          if (!p0Log && !p1Log) return undefined;
          return {
            myPicked: snapToEntry(p0Log?.pickedItem),
            myInventory: (p0Log?.inventoryAfter ?? []).map((s) => snapToEntry(s)!),
            oppPicked: snapToEntry(p1Log?.pickedItem),
            oppInventory: (p1Log?.inventoryAfter ?? []).map((s) => snapToEntry(s)!),
          };
        };
        return {
          wave,
          logs: [...logs].sort((a, b) => b.turn - a.turn),
          itemWaveLog: buildItemWaveLog(waveEntry?.p0Log, waveEntry?.p1Log),
        };
      });
  });

  // ─── Arena computeds ─────────────────────────────────────────────────────
  const totalDmg = (effects: any[]) =>
    (effects ?? [])
      .filter((e) => e.typeEffect !== "heal")
      .reduce((s: number, e: any) => s + (e.value ?? 0), 0);

  const totalHeal = (effects: any[]) =>
    (effects ?? [])
      .filter((e) => e.typeEffect === "heal")
      .reduce((s: number, e: any) => s + (e.value ?? 0), 0);

  const isItemTurn = computed(() => activeLog.value?.turn === 0);

  const p0Dmg = computed(() => totalDmg(activeLog.value?.players[p0Id.value]?.damageReceive ?? []));
  const p1Dmg = computed(() => totalDmg(activeLog.value?.players[p1Id.value]?.damageReceive ?? []));
  const p0Heal = computed(() =>
    totalHeal(activeLog.value?.players[p0Id.value]?.damageReceive ?? [])
  );
  const p1Heal = computed(() =>
    totalHeal(activeLog.value?.players[p1Id.value]?.damageReceive ?? [])
  );

  const p0ItemUsed = computed(() => {
    if (activeLog.value?.turn !== 0) return null;
    const code = activeLog.value?.players[p0Id.value]?.itemUsed?.code as string | undefined;
    if (!code) return null;
    const norm = code.replace(/-/g, "_");
    const meta = ITEM_META[norm];
    return meta ? { icon: meta.icon, label: meta.label } : { icon: "❓", label: norm };
  });

  const p1ItemUsed = computed(() => {
    if (activeLog.value?.turn !== 0) return null;
    const code = activeLog.value?.players[p1Id.value]?.itemUsed?.code as string | undefined;
    if (!code) return null;
    const norm = code.replace(/-/g, "_");
    const meta = ITEM_META[norm];
    return meta ? { icon: meta.icon, label: meta.label } : { icon: "❓", label: norm };
  });

  const p0ClashIcon = computed(() => {
    const action = activeLog.value?.players[p0Id.value]?.action ?? -1;
    const s = getSkill(p0.value, action);
    return s ? (SKILL_META[s.code]?.icon ?? "❓") : null;
  });

  const p1ClashIcon = computed(() => {
    const action = activeLog.value?.players[p1Id.value]?.action ?? -1;
    const s = getSkill(p1.value, action);
    return s ? (SKILL_META[s.code]?.icon ?? "❓") : null;
  });

  const p0Counter = computed(() => {
    if (!activeLog.value) return null;
    const a0 = activeLog.value.players[p0Id.value]?.action ?? -1;
    const a1 = activeLog.value.players[p1Id.value]?.action ?? -1;
    const s0 = getSkill(p0.value, a0);
    const s1 = getSkill(p1.value, a1);
    if (!s0 || !s1) return null;
    return SKILL_COUNTER[`${s0.type}_vs_${s1.type}`] ?? null;
  });

  const p1Counter = computed(() => {
    if (!activeLog.value) return null;
    const a0 = activeLog.value.players[p0Id.value]?.action ?? -1;
    const a1 = activeLog.value.players[p1Id.value]?.action ?? -1;
    const s0 = getSkill(p0.value, a0);
    const s1 = getSkill(p1.value, a1);
    if (!s0 || !s1) return null;
    return SKILL_COUNTER[`${s1.type}_vs_${s0.type}`] ?? null;
  });

  const winnerName = computed(
    () =>
      detail.value?.players.find((p) => p.player._id === detail.value?.winner)?.player.name ?? null
  );

  const endReasonLabel: Record<string, string> = {
    hp_depleted: "Hết HP",
    max_waves: "Hết wave",
    draw: "Hòa",
  };

  const isReplayMode = ref(false);
  const isAutoPlaying = ref(false);
  const autoFinished = ref(false);

  const stopAuto = (finished = false) => {
    isAutoPlaying.value = false;
    autoFinished.value = finished;
    if (autoTimer) {
      clearInterval(autoTimer);
      autoTimer = null;
    }
  };

  const startAuto = () => {
    if (isAutoPlaying.value) return;
    isAutoPlaying.value = true;
    autoFinished.value = false;
    autoTimer = setInterval(() => {
      if (turnIdx.value < sortedLogs.value.length - 1) {
        turnIdx.value++;
      } else {
        stopAuto(true);
      }
    }, 1200);
  };

  const toggleAuto = () => (isAutoPlaying.value ? stopAuto() : startAuto());

  const replayFromStart = () => {
    turnIdx.value = 0;
    startAuto();
  };

  const prev = () => {
    stopAuto();
    if (turnIdx.value > 0) turnIdx.value--;
  };

  const next = () => {
    stopAuto();
    if (turnIdx.value < sortedLogs.value.length - 1) turnIdx.value++;
  };

  const enterReplay = () => {
    turnIdx.value = 0;
    isReplayMode.value = true;
  };

  const exitReplay = () => {
    stopAuto();
    isReplayMode.value = false;
  };

  onMounted(async () => {
    try {
      battleLogService.setToken(playerStore.playerToken);
      detail.value = await battleLogService.getById(route.params.id as string);
    } catch {
      toast.error("Không tìm thấy trận đấu");
      router.push("/history");
    } finally {
      loading.value = false;
    }
  });

  onUnmounted(stopAuto);
</script>

<template>
  <div class="container mx-auto max-w-3xl p-4 flex flex-col gap-4">
    <!-- Back -->
    <button class="btn btn-ghost btn-sm self-start" @click="router.push('/history')">
      ← Quay lại
    </button>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-20">
      <span class="loading loading-spinner loading-md"></span>
    </div>

    <template v-else-if="detail">
      <!-- Result header -->
      <div class="text-center text-xs opacity-40 font-semibold uppercase tracking-widest">
        {{ endReasonLabel[detail.endReason] ?? detail.endReason }} ·
        <span v-if="winnerName">{{ winnerName }} thắng</span>
        <span v-else>Hòa</span>
      </div>

      <!-- PlayerCards -->
      <div class="grid grid-cols-2 gap-4">
        <!-- P0 card -->
        <div class="rounded-none bg-base-100 shadow-lg overflow-hidden ring-2 ring-primary/50">
          <div class="flex items-center justify-between px-3 py-2 bg-primary/10">
            <span class="font-bold text-sm truncate leading-tight">{{
              p0?.player.name ?? "..."
            }}</span>
            <span v-if="detail.winner === p0Id" class="badge badge-xs badge-success shrink-0"
              >Thắng</span
            >
          </div>
          <div class="px-3 pt-2.5 pb-3 flex flex-col gap-2.5">
            <div class="flex items-center gap-2">
              <span class="text-xs shrink-0 leading-none">❤️</span>
              <div class="relative flex-1 h-6">
                <div class="absolute inset-0 bg-base-300 overflow-hidden">
                  <div
                    class="h-full transition-all duration-700 ease-out"
                    :class="hpBarClass(hpPercent(p0Id, p0InitHp))"
                    :style="{ width: `${hpPercent(p0Id, p0InitHp)}%` }"
                  />
                </div>
                <div class="absolute inset-0 flex items-center justify-center text-white">
                  <span class="font-mono font-extrabold text-sm leading-none">
                    {{ turnData(p0Id)?.stats.hp ?? p0InitHp
                    }}<span class="font-normal text-xs"> / {{ p0InitHp }}</span>
                  </span>
                </div>
              </div>
            </div>
            <div class="flex items-center gap-3 tabular-nums text-xs font-mono font-semibold">
              <span>⚔️ {{ p0?.stats.attack }}</span>
              <span>✨ {{ p0?.stats.magic }}</span>
              <span>🛡️ {{ p0?.stats.defense }}</span>
            </div>
          </div>
        </div>

        <!-- P1 card -->
        <div class="rounded-none bg-base-100 shadow-lg overflow-hidden ring-2 ring-error/50">
          <div class="flex items-center justify-between px-3 py-2 bg-error/10">
            <span class="font-bold text-sm truncate leading-tight">{{
              p1?.player.name ?? "..."
            }}</span>
            <span v-if="detail.winner === p1Id" class="badge badge-xs badge-success shrink-0"
              >Thắng</span
            >
          </div>
          <div class="px-3 pt-2.5 pb-3 flex flex-col gap-2.5">
            <div class="flex items-center gap-2">
              <span class="text-xs shrink-0 leading-none">❤️</span>
              <div class="relative flex-1 h-6">
                <div class="absolute inset-0 bg-base-300 overflow-hidden">
                  <div
                    class="h-full transition-all duration-700 ease-out"
                    :class="hpBarClass(hpPercent(p1Id, p1InitHp))"
                    :style="{ width: `${hpPercent(p1Id, p1InitHp)}%` }"
                  />
                </div>
                <div class="absolute inset-0 flex items-center justify-center text-white">
                  <span class="font-mono font-extrabold text-sm leading-none">
                    {{ turnData(p1Id)?.stats.hp ?? p1InitHp
                    }}<span class="font-normal text-xs"> / {{ p1InitHp }}</span>
                  </span>
                </div>
              </div>
            </div>
            <div class="flex items-center gap-3 tabular-nums text-xs font-mono font-semibold">
              <span>⚔️ {{ p1?.stats.attack }}</span>
              <span>✨ {{ p1?.stats.magic }}</span>
              <span>🛡️ {{ p1?.stats.defense }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Slime Arena -->
      <div
        class="relative bg-base-100 shadow-md grid grid-cols-[1fr_auto_1fr] items-end px-3 pb-3 gap-1"
      >
        <!-- P0 slime -->
        <div class="flex flex-col items-center gap-1 relative">
          <div
            class="absolute bottom-full left-0 right-0 flex justify-center pb-1 pointer-events-none"
            style="height: 40px; align-items: flex-end"
          >
            <Transition name="bubble" mode="out-in">
              <div
                v-if="p0ItemUsed"
                :key="`item-${activeTurnIdx}`"
                class="flex flex-col items-center"
              >
                <div
                  class="px-4 py-1.5 whitespace-nowrap"
                  :class="
                    p0Heal > 0
                      ? 'bg-success text-success-content'
                      : 'bg-warning text-warning-content'
                  "
                  :style="`transform: skewX(-14deg); box-shadow: 0 3px 12px -2px oklch(var(--${p0Heal > 0 ? 'su' : 'wa'}) / 0.6);`"
                >
                  <span
                    class="block text-[11px] font-black uppercase tracking-widest leading-none"
                    style="transform: skewX(14deg); text-shadow: 1px 1px 0 rgba(0, 0, 0, 0.25)"
                    >{{ p0ItemUsed.icon }} {{ p0ItemUsed.label }}!</span
                  >
                </div>
                <div
                  class="w-2.5 h-2.5 rotate-45 -mt-1.5"
                  :class="p0Heal > 0 ? 'bg-success' : 'bg-warning'"
                ></div>
              </div>
              <div
                v-else-if="p0Counter?.win"
                :key="activeTurnIdx"
                class="flex flex-col items-center"
              >
                <div
                  class="px-4 py-1.5 bg-success text-success-content whitespace-nowrap"
                  style="
                    transform: skewX(-14deg);
                    box-shadow: 0 3px 12px -2px oklch(var(--su) / 0.6);
                  "
                >
                  <span
                    class="block text-[11px] font-black uppercase tracking-widest leading-none"
                    style="transform: skewX(14deg); text-shadow: 1px 1px 0 rgba(0, 0, 0, 0.25)"
                    >{{ p0Counter.icon }} {{ p0Counter.label }}!</span
                  >
                </div>
                <div class="w-2.5 h-2.5 bg-success rotate-45 -mt-1.5"></div>
              </div>
            </Transition>
          </div>
          <div class="relative">
            <span
              v-if="p0Dmg > 0"
              :key="`dmg-${activeTurnIdx}`"
              class="dmg-float absolute top-1/2 left-1/2 text-error font-extrabold text-base whitespace-nowrap pointer-events-none z-10"
              >-{{ p0Dmg }}</span
            >
            <span
              v-if="p0Heal > 0"
              :key="`heal-${activeTurnIdx}`"
              class="heal-float absolute top-1/2 left-1/2 text-success font-extrabold text-base whitespace-nowrap pointer-events-none z-10"
              >+{{ p0Heal }}</span
            >
            <img :src="slimeGif" class="h-24 w-auto object-contain" />
          </div>
          <span class="text-[11px] font-bold text-primary truncate max-w-[72px]">{{
            p0?.player.name ?? "P1"
          }}</span>
        </div>

        <!-- Center clash zone -->
        <div class="flex flex-col items-center justify-center h-full w-full">
          <div :key="activeTurnIdx" class="flex items-center gap-1.5">
            <span v-if="!isItemTurn && p0ClashIcon" class="text-2xl w-8 text-center">{{
              p0ClashIcon
            }}</span>
            <span v-else class="text-2xl w-8 opacity-0 select-none">·</span>
            <div class="flex items-center justify-center w-12 shrink-0 mx-0.5">
              <div class="relative w-12 h-10 flex items-center justify-center pointer-events-none">
                <div class="absolute w-6 h-6 rotate-45 bg-base-content opacity-10 rounded-sm"></div>
                <span class="relative z-10 text-base opacity-20">⚔️</span>
              </div>
            </div>
            <span v-if="!isItemTurn && p1ClashIcon" class="text-2xl w-8 text-center">{{
              p1ClashIcon
            }}</span>
            <span v-else class="text-2xl w-8 opacity-0 select-none">·</span>
          </div>
        </div>

        <!-- P1 slime -->
        <div class="flex flex-col items-center gap-1 relative">
          <div
            class="absolute bottom-full left-0 right-0 flex justify-center pb-1 pointer-events-none"
            style="height: 40px; align-items: flex-end"
          >
            <Transition name="bubble" mode="out-in">
              <div
                v-if="p1ItemUsed"
                :key="`p1-item-${activeTurnIdx}`"
                class="flex flex-col items-center"
              >
                <div
                  class="px-4 py-1.5 whitespace-nowrap"
                  :class="
                    p1Heal > 0
                      ? 'bg-success text-success-content'
                      : 'bg-warning text-warning-content'
                  "
                  :style="`transform: skewX(14deg); box-shadow: 0 3px 12px -2px oklch(var(--${p1Heal > 0 ? 'su' : 'wa'}) / 0.6);`"
                >
                  <span
                    class="block text-[11px] font-black uppercase tracking-widest leading-none"
                    style="transform: skewX(-14deg); text-shadow: 1px 1px 0 rgba(0, 0, 0, 0.25)"
                    >{{ p1ItemUsed.icon }} {{ p1ItemUsed.label }}!</span
                  >
                </div>
                <div
                  class="w-2.5 h-2.5 rotate-45 -mt-1.5"
                  :class="p1Heal > 0 ? 'bg-success' : 'bg-warning'"
                ></div>
              </div>
              <div
                v-else-if="p1Counter?.win"
                :key="activeTurnIdx"
                class="flex flex-col items-center"
              >
                <div
                  class="px-4 py-1.5 bg-error text-error-content whitespace-nowrap"
                  style="
                    transform: skewX(14deg);
                    box-shadow: 0 3px 12px -2px oklch(var(--er) / 0.6);
                  "
                >
                  <span
                    class="block text-[11px] font-black uppercase tracking-widest leading-none"
                    style="transform: skewX(-14deg); text-shadow: 1px 1px 0 rgba(0, 0, 0, 0.25)"
                    >{{ p1Counter.icon }} {{ p1Counter.label }}!</span
                  >
                </div>
                <div class="w-2.5 h-2.5 bg-error rotate-45 -mt-1.5"></div>
              </div>
            </Transition>
          </div>
          <div class="relative">
            <span
              v-if="p1Dmg > 0"
              :key="`p1-dmg-${activeTurnIdx}`"
              class="dmg-float absolute top-1/2 left-1/2 text-error font-extrabold text-base whitespace-nowrap pointer-events-none z-10"
              >-{{ p1Dmg }}</span
            >
            <span
              v-if="p1Heal > 0"
              :key="`p1-heal-${activeTurnIdx}`"
              class="heal-float absolute top-1/2 left-1/2 text-success font-extrabold text-base whitespace-nowrap pointer-events-none z-10"
              >+{{ p1Heal }}</span
            >
            <img :src="slimeGif" class="h-24 w-auto object-contain -scale-x-100" />
          </div>
          <span class="text-[11px] font-bold text-error truncate max-w-[72px]">{{
            p1?.player.name ?? "P2"
          }}</span>
        </div>
      </div>

      <!-- Inventory -->
      <div class="grid grid-cols-2 gap-4 bg-base-100 shadow-md px-3 py-2.5">
        <div class="flex flex-col gap-1">
          <span class="text-[10px] font-semibold text-primary opacity-60 uppercase tracking-wide"
            >Vật phẩm</span
          >
          <div class="flex gap-1.5">
            <div
              v-for="i in MAX_ITEM_SLOTS"
              :key="i"
              class="flex items-center justify-center border text-sm w-9 h-9"
              :class="
                p0Inventory[i - 1]
                  ? 'bg-base-200 border-base-300'
                  : 'bg-base-300/20 border-dashed border-base-300 opacity-30'
              "
            >
              <span
                v-if="p0Inventory[i - 1]"
                class="text-lg leading-none"
                :title="p0Inventory[i - 1]!.label"
                >{{ p0Inventory[i - 1]!.icon }}</span
              >
              <span v-else class="text-base-content/20 text-xs">—</span>
            </div>
          </div>
        </div>
        <div class="flex flex-col gap-1 items-end">
          <span class="text-[10px] font-semibold text-error opacity-60 uppercase tracking-wide"
            >Vật phẩm</span
          >
          <div class="flex gap-1.5">
            <div
              v-for="i in MAX_ITEM_SLOTS"
              :key="i"
              class="flex items-center justify-center border text-sm w-9 h-9"
              :class="
                p1Inventory[i - 1]
                  ? 'bg-base-200 border-base-300'
                  : 'bg-base-300/20 border-dashed border-base-300 opacity-30'
              "
            >
              <span
                v-if="p1Inventory[i - 1]"
                class="text-lg leading-none"
                :title="p1Inventory[i - 1]!.label"
                >{{ p1Inventory[i - 1]!.icon }}</span
              >
              <span v-else class="text-base-content/20 text-xs">—</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Progress + controls -->
      <div class="flex flex-col gap-2">
        <template v-if="isReplayMode">
          <div class="flex items-center justify-between text-xs opacity-40 px-1">
            <span>Lượt {{ turnIdx + 1 }} / {{ sortedLogs.length }}</span>
            <span v-if="activeLog">Wave {{ activeLog.wave }} · Turn {{ activeLog.turn }}</span>
          </div>
          <progress
            class="progress progress-primary w-full"
            :value="turnIdx"
            :max="sortedLogs.length - 1"
          />
          <div class="flex items-center justify-center gap-2">
            <button class="btn btn-sm btn-ghost" :disabled="turnIdx === 0" @click="prev">
              ◀ Prev
            </button>
            <button
              v-if="autoFinished"
              class="btn btn-sm btn-primary w-24"
              @click="replayFromStart"
            >
              ↺ Chơi lại
            </button>
            <button v-else class="btn btn-sm btn-primary w-24" @click="toggleAuto">
              {{ isAutoPlaying ? "⏸ Dừng" : "▶ Auto" }}
            </button>
            <button
              class="btn btn-sm btn-ghost"
              :disabled="turnIdx === sortedLogs.length - 1"
              @click="next"
            >
              Next ▶
            </button>
          </div>
          <div class="flex justify-center">
            <button class="btn btn-xs btn-ghost opacity-50" @click="exitReplay">
              Thoát replay
            </button>
          </div>
        </template>
        <div v-else class="flex justify-center">
          <button class="btn btn-sm btn-primary w-28" @click="enterReplay">▶ Replay</button>
        </div>
      </div>

      <!-- Turn log list (grouped by wave) -->
      <TurnLogList :groups="normalizedGroups" />
    </template>
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
