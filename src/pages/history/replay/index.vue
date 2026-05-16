<script setup lang="ts">
  import { ref, computed, onMounted, onUnmounted } from "vue";
  import { useRoute, useRouter } from "vue-router";
  import { toast } from "vue-sonner";
  import { useAuthStore } from "@/stores";
  import { battleLogService } from "@/client";
  import type { BattleLogDetail, BattleLogTurn } from "@/client";
  import { SKILL_META, SKILL_COUNTER } from "@/constants";

  const route = useRoute();
  const router = useRouter();
  const authStore = useAuthStore();

  const detail = ref<BattleLogDetail | null>(null);
  const loading = ref(true);
  const turnIdx = ref(0);
  let autoTimer: ReturnType<typeof setInterval> | null = null;
  const isPlaying = ref(false);

  // Sorted flat list of all turns
  const sortedLogs = computed<BattleLogTurn[]>(() => {
    if (!detail.value) return [];
    return [...detail.value.logs].sort((a, b) => a.wave - b.wave || a.turn - b.turn);
  });

  // Two players — p0 = index 0, p1 = index 1
  const p0 = computed(() => detail.value?.players[0] ?? null);
  const p1 = computed(() => detail.value?.players[1] ?? null);

  const p0Id = computed(() => p0.value?.player._id ?? "");
  const p1Id = computed(() => p1.value?.player._id ?? "");

  const initHp = (idx: 0 | 1) => detail.value?.players[idx]?.stats.hp ?? 1;

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

  const waveGroups = computed(() => {
    const map = new Map<number, any[]>();
    for (let i = 0; i < visibleLogs.value.length; i++) {
      const log = visibleLogs.value[i];
      if (!map.has(log.wave)) map.set(log.wave, []);
      const p0d = log.players[p0Id.value];
      const p1d = log.players[p1Id.value];
      const p0Skill = getSkill(p0.value, p0d?.action ?? -1);
      const p1Skill = getSkill(p1.value, p1d?.action ?? -1);
      const ctr = p0Skill && p1Skill
        ? (SKILL_COUNTER[`${p0Skill.type}_vs_${p1Skill.type}`] ?? null)
        : null;
      map.get(log.wave)!.push({
        wave: log.wave,
        turn: log.turn,
        p0: p0d,
        p1: p1d,
        p0Damage: (p0d?.damageReceive ?? []).reduce((s: number, e: any) => s + e.value, 0),
        p1Damage: (p1d?.damageReceive ?? []).reduce((s: number, e: any) => s + e.value, 0),
        counter: ctr,
        isActive: isReplayMode.value && i === turnIdx.value,
      });
    }
    return [...map.entries()]
      .sort(([a], [b]) => b - a)
      .map(([wave, logs]) => ({ wave, logs: [...logs].sort((a, b) => b.turn - a.turn) }));
  });

  const endReasonLabel: Record<string, string> = {
    hp_depleted: "Hết HP",
    max_waves: "Hết wave",
    draw: "Hòa",
  };

  const isReplayMode = ref(false);
  const isAutoPlaying = ref(false);

  const stopAuto = () => {
    isAutoPlaying.value = false;
    if (autoTimer) { clearInterval(autoTimer); autoTimer = null; }
  };

  const startAuto = () => {
    if (isAutoPlaying.value) return;
    isAutoPlaying.value = true;
    autoTimer = setInterval(() => {
      if (turnIdx.value < sortedLogs.value.length - 1) {
        turnIdx.value++;
      } else {
        stopAuto();
      }
    }, 1200);
  };

  const toggleAuto = () => (isAutoPlaying.value ? stopAuto() : startAuto());

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
      battleLogService.setToken(authStore.userToken);
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
    <button class="btn btn-ghost btn-sm self-start" @click="router.push('/history')">← Quay lại</button>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-20">
      <span class="loading loading-spinner loading-md"></span>
    </div>

    <template v-else-if="detail">
      <!-- Result header -->
      <div class="text-center text-xs opacity-40 font-semibold uppercase tracking-widest">
        {{ endReasonLabel[detail.endReason] ?? detail.endReason }} ·
        <span v-if="detail.winner">{{ detail.winner.name }} thắng</span>
        <span v-else>Hòa</span>
      </div>

      <!-- PlayerCards -->
      <div class="grid grid-cols-2 gap-4">
        <!-- P0 card -->
        <div class="rounded-none bg-base-100 shadow-lg overflow-hidden ring-2 ring-primary/50">
          <div class="flex items-center justify-between px-3 py-2 bg-primary/10">
            <span class="font-bold text-sm truncate leading-tight">{{ p0?.player.name ?? "..." }}</span>
            <span v-if="detail.winner?._id === p0Id" class="badge badge-xs badge-success shrink-0">Thắng</span>
          </div>
          <div class="px-3 pt-2.5 pb-3 flex flex-col gap-2.5">
            <div class="flex items-center gap-2">
              <span class="text-xs shrink-0 leading-none">❤️</span>
              <div class="relative flex-1 h-6">
                <div class="absolute inset-0 bg-base-300 overflow-hidden">
                  <div
                    class="h-full transition-all duration-700 ease-out"
                    :class="hpBarClass(hpPercent(p0Id, initHp(0)))"
                    :style="{ width: `${hpPercent(p0Id, initHp(0))}%` }"
                  />
                </div>
                <div class="absolute inset-0 flex items-center justify-center text-white">
                  <span class="font-mono font-extrabold text-sm leading-none">
                    {{ turnData(p0Id)?.stats.hp ?? initHp(0) }}<span class="font-normal text-xs"> / {{ initHp(0) }}</span>
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
            <span class="font-bold text-sm truncate leading-tight">{{ p1?.player.name ?? "..." }}</span>
            <span v-if="detail.winner?._id === p1Id" class="badge badge-xs badge-success shrink-0">Thắng</span>
          </div>
          <div class="px-3 pt-2.5 pb-3 flex flex-col gap-2.5">
            <div class="flex items-center gap-2">
              <span class="text-xs shrink-0 leading-none">❤️</span>
              <div class="relative flex-1 h-6">
                <div class="absolute inset-0 bg-base-300 overflow-hidden">
                  <div
                    class="h-full transition-all duration-700 ease-out"
                    :class="hpBarClass(hpPercent(p1Id, initHp(1)))"
                    :style="{ width: `${hpPercent(p1Id, initHp(1))}%` }"
                  />
                </div>
                <div class="absolute inset-0 flex items-center justify-center text-white">
                  <span class="font-mono font-extrabold text-sm leading-none">
                    {{ turnData(p1Id)?.stats.hp ?? initHp(1) }}<span class="font-normal text-xs"> / {{ initHp(1) }}</span>
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

      <!-- Progress + controls -->
      <div class="flex flex-col gap-2">
        <template v-if="isReplayMode">
          <div class="flex items-center justify-between text-xs opacity-40 px-1">
            <span>Lượt {{ turnIdx + 1 }} / {{ sortedLogs.length }}</span>
            <span v-if="activeLog">Wave {{ activeLog.wave }} · Turn {{ activeLog.turn }}</span>
          </div>
          <progress class="progress progress-primary w-full" :value="turnIdx" :max="sortedLogs.length - 1" />
          <div class="flex items-center justify-center gap-2">
            <button class="btn btn-sm btn-ghost" :disabled="turnIdx === 0" @click="prev">◀ Prev</button>
            <button class="btn btn-sm btn-primary w-24" @click="toggleAuto">
              {{ isAutoPlaying ? "⏸ Dừng" : "▶ Auto" }}
            </button>
            <button class="btn btn-sm btn-ghost" :disabled="turnIdx === sortedLogs.length - 1" @click="next">Next ▶</button>
          </div>
          <div class="flex justify-center">
            <button class="btn btn-xs btn-ghost opacity-50" @click="exitReplay">Thoát replay</button>
          </div>
        </template>
        <div v-else class="flex justify-center">
          <button class="btn btn-sm btn-primary w-28" @click="enterReplay">▶ Replay</button>
        </div>
      </div>

      <!-- Turn log list (grouped by wave) -->
      <div v-if="waveGroups.length" class="bg-base-100 shadow-md rounded-none">
        <div class="p-3 gap-2 flex flex-col">
          <div v-for="group in waveGroups" :key="group.wave">
            <div class="flex items-center gap-2 mb-1.5">
              <div class="flex-1 h-px bg-base-300"></div>
              <span class="text-[10px] font-bold opacity-40 uppercase tracking-widest">Wave {{ group.wave }}</span>
              <div class="flex-1 h-px bg-base-300"></div>
            </div>
            <div class="flex flex-col gap-1.5">
              <div
                v-for="log in group.logs"
                :key="`${log.wave}-${log.turn}`"
                class="grid items-center px-3 py-2 text-xs transition-colors"
                :class="log.isActive ? 'bg-primary/15 ring-1 ring-primary/30' : 'bg-base-200'"
                style="grid-template-columns: auto 1fr 9rem 1fr"
              >
                <div></div>
                <!-- P0 -->
                <div class="flex items-center justify-end gap-2 tabular-nums">
                  <span class="font-bold text-primary">{{ log.p0?.stats.hp ?? "?" }}</span>
                  <span v-if="log.p0Damage > 0" class="text-error font-semibold w-10 text-center">-{{ log.p0Damage }}❤️</span>
                  <span v-else class="opacity-25 w-10 text-center">❤️</span>
                  <span>{{ skillIcon(p0, log.p0?.action ?? -1) }}</span>
                </div>
                <!-- Counter -->
                <div class="flex justify-center w-full">
                  <span v-if="log.counter" class="badge badge-xs font-bold w-fit py-2 justify-center" :class="log.counter.color">
                    {{ log.counter.icon }} {{ log.counter.label }}
                  </span>
                  <span v-else class="opacity-20">⚔️</span>
                </div>
                <!-- P1 -->
                <div class="flex items-center gap-2 tabular-nums">
                  <span>{{ skillIcon(p1, log.p1?.action ?? -1) }}</span>
                  <span v-if="log.p1Damage > 0" class="text-error font-semibold w-10 text-center">-{{ log.p1Damage }}❤️</span>
                  <span v-else class="opacity-25 w-10 text-center">❤️</span>
                  <span class="font-bold text-error">{{ log.p1?.stats.hp ?? "?" }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
