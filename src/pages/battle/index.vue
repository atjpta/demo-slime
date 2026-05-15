<script setup lang="ts">
  import { ref, computed, watch, onMounted, onUnmounted, nextTick } from "vue";
  import { useRouter } from "vue-router";
  import { toast } from "vue-sonner";
  import { usePlayerStore, useBattleStore } from "@/stores";
  import { battleRoom, playerService } from "@/client";
  import type { BattleHandlers } from "@/client";
  import { Phase, TURNS_PER_WAVE } from "@/constants";
  import PlayerCard from "./components/PlayerCard.vue";
  import ActionPicker from "./components/ActionPicker.vue";
  import ExecutingPanel from "./components/ExecutingPanel.vue";
  import TurnLogList from "./components/TurnLogList.vue";
  import BattleResultModal from "./components/BattleResultModal.vue";

  const router = useRouter();
  const playerStore = usePlayerStore();
  const battleStore = useBattleStore();

  const selectedActions = ref<number[]>(Array(TURNS_PER_WAVE).fill(0));
  const actionsSubmitted = ref(false);
  const result = ref<"win" | "lose" | "draw" | null>(null);

  const mySkills = computed(() => battleStore.initPlayers[playerStore.myPlayerId]?.skills ?? []);

  const opponentId = computed(
    () => battleStore.playerIds.find((id) => id !== playerStore.myPlayerId) ?? null
  );

  const getStats = (playerId: string) => {
    // 2. Sau reconnect: shownLogs rỗng nhưng logs có dữ liệu wave cũ
    const latestLog = battleStore.logs.at(-1);
    if (latestLog) {
      return latestLog.players.get(playerId)?.stats ?? null;
    }
    // 3. Đầu trận hoặc chưa có log: dùng stats từ battle_init
    return battleStore.initPlayers[playerId]?.stats ?? null;
  };

  const submitActions = () => {
    battleStore.rooms.battle?.send("submit_actions_battle", selectedActions.value);
    actionsSubmitted.value = true;
  };

  const confirmResult = () => {
    result.value = null;
    battleStore.reset();
    router.push("/lobby");
  };

  // ─── Log reveal ───────────────────────────────────────────────────────────
  const logQueue = ref<any[]>([]);
  let revealTimer: ReturnType<typeof setInterval> | null = null;

  const startRevealTimer = () => {
    if (revealTimer) return;
    revealTimer = setInterval(() => {
      if (logQueue.value.length > 0) {
        battleStore.shownLogs.unshift(logQueue.value.shift());
      } else {
        clearInterval(revealTimer!);
        revealTimer = null;
      }
    }, 1000);
  };

  const waveLogs = computed(() => battleStore.logs.filter((l: any) => l.wave === battleStore.wave));

  watch(
    () => waveLogs.value.length,
    (newLen) => {
      const currentWaveShown = battleStore.shownLogs.filter(
        (l: any) => l.wave === battleStore.wave
      ).length;
      const alreadyHandled = currentWaveShown + logQueue.value.length;
      const incoming = waveLogs.value.slice(alreadyHandled, newLen);
      if (incoming.length > 0) {
        logQueue.value.push(...incoming);
        startRevealTimer();
      }
    }
  );

  watch(
    () => battleStore.wave,
    () => {
      if (revealTimer) {
        clearInterval(revealTimer);
        revealTimer = null;
      }
      logQueue.value = [];
    }
  );

  watch(
    () => battleStore.phase,
    (phase) => {
      if (phase === Phase.SELECTING) {
        actionsSubmitted.value = false;
        selectedActions.value = Array(TURNS_PER_WAVE).fill(0);
      }
      if (phase === Phase.ENDED) {
        if (battleStore.winner === "draw") result.value = "draw";
        else if (battleStore.winner === playerStore.myPlayerId) result.value = "win";
        else result.value = "lose";
      }
    }
  );

  // ─── Room setup & Reconnect ───────────────────────────────────────────────
  const MAX_RECONNECT_ATTEMPTS = 5;

  const handlers: BattleHandlers = {
    onPhaseChange: (phase) => {
      battleStore.phase = phase;
    },
    onWaveChange: (wave) => {
      battleStore.wave = wave;
    },
    onTimeLeftChange: (timeLeft) => {
      battleStore.timeLeft = timeLeft;
    },
    onWinnerChange: (winner) => {
      battleStore.winner = winner;
    },
    onPlayersChange: (ids) => {
      battleStore.playerIds = ids;
    },
    onActionsChange: (id, actions) => {
      battleStore.playerActions[id] = actions;
    },
    onPlayerReadyChange: (id, ready) => {
      battleStore.playerReady[id] = ready;
    },
    onInitPlayersChange: (pid, data) => {
      battleStore.initPlayers[pid] = data;
    },
    onLogAdd: (log) => {
      battleStore.logs.push(log);
    },
    onLogAddReconnect: async (logRaws) => {
      const [first, ...logs] = logRaws;
      battleStore.logs = logs;
    },
    onLeave: (code) => handleLeave(code),
    onError: (_code, msg) => toast.error(`Battle: ${msg}`),
  };

  function resetLocalState() {
    logQueue.value = [];
    actionsSubmitted.value = false;
    selectedActions.value = Array(TURNS_PER_WAVE).fill(0);
    if (revealTimer) {
      clearInterval(revealTimer);
      revealTimer = null;
    }
  }

  function setupRoom(room: any) {
    battleStore.saveReconnectToken(room.reconnectionToken);
    battleRoom.setup(room, handlers);
  }

  async function handleLeave(code: number) {
    // 1000 = đóng bình thường; nếu trận đã kết thúc thì không reconnect
    const isIntentional = code === 1000 || battleStore.phase === Phase.ENDED;
    battleStore.rooms.battle = null;

    if (isIntentional || battleStore.isReconnecting) return;

    battleStore.isReconnecting = true;
    battleStore.reconnectAttempts = 0;

    const token = battleStore.loadReconnectToken();
    if (!token) {
      battleStore.isReconnecting = false;
      toast.error("Không thể kết nối lại: thiếu token");
      router.push("/lobby");
      return;
    }

    for (let attempt = 0; attempt < MAX_RECONNECT_ATTEMPTS; attempt++) {
      battleStore.reconnectAttempts = attempt + 1;

      if (attempt > 0) {
        const delay = Math.min(1000 * 2 ** (attempt - 1), 16000);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }

      try {
        const newRoom = await battleRoom.reconnect(token);
        battleStore.rooms.battle = newRoom;
        battleStore.isReconnecting = false;
        battleStore.reconnectAttempts = 0;
        resetLocalState();
        battleStore.resetGameData();
        setupRoom(newRoom);
        toast.success("Kết nối lại thành công!");
        return;
      } catch (e) {
        console.warn(`[battle] reconnect attempt ${attempt + 1} failed`, e);
      }
    }

    battleStore.isReconnecting = false;
    battleStore.clearReconnectToken();
    toast.error("Mất kết nối, không thể kết nối lại");
    battleStore.reset();
    router.push("/lobby");
  }

  onMounted(async () => {
    // Restore player data nếu bị mất (ví dụ sau khi reload trang)
    if (!playerStore.myPlayer && playerStore.playerToken) {
      try {
        playerService.setToken(playerStore.playerToken);
        playerStore.myPlayer = await playerService.me();
        playerStore.myPlayerId = playerStore.myPlayer._id;
      } catch {
        router.push("/lobby");
        return;
      }
    }

    if (battleStore.rooms.battle) {
      setupRoom(battleStore.rooms.battle);
      return;
    }

    // Trang bị refresh — thử reconnect từ localStorage
    const token = battleStore.loadReconnectToken();
    if (!token) {
      router.push("/lobby");
      return;
    }

    battleStore.isReconnecting = true;
    try {
      const newRoom = await battleRoom.reconnect(token);
      battleStore.rooms.battle = newRoom;
      battleStore.isReconnecting = false;
      setupRoom(newRoom);
    } catch {
      battleStore.isReconnecting = false;
      battleStore.clearReconnectToken();
      toast.error("Không thể kết nối lại trận đấu");
      router.push("/lobby");
    }
  });

  onUnmounted(() => {
    if (revealTimer) clearInterval(revealTimer);
    if (!battleStore.isReconnecting) battleStore.reset();
  });
</script>

<template>
  <!-- Reconnecting overlay -->
  <div
    v-if="battleStore.isReconnecting"
    class="fixed inset-0 z-50 flex flex-col items-center justify-center bg-base-100/80 backdrop-blur-sm gap-4"
  >
    <span class="loading loading-spinner loading-lg text-warning"></span>
    <p class="text-lg font-semibold">Đang kết nối lại...</p>
    <p class="text-sm opacity-50">Lần thử {{ battleStore.reconnectAttempts }} / 5</p>
  </div>

  <div
    v-if="battleStore.phase === Phase.WAITING"
    class="flex flex-col justify-center items-center h-80 gap-3"
  >
    <span class="loading loading-spinner loading-lg"></span>
    <span class="text-sm opacity-50">Đang chờ người chơi...</span>
  </div>

  <div v-else-if="battleStore.phase" class="container mx-auto max-w-3xl p-4 flex flex-col gap-4">
    <div class="grid grid-cols-2 gap-4">
      <PlayerCard
        label="Bạn"
        variant="primary"
        :name="playerStore.myPlayer?.name"
        :stats="getStats(playerStore.myPlayerId)"
        :init-hp="battleStore.initPlayers[playerStore.myPlayerId]?.stats?.hp"
        :ready="battleStore.phase === Phase.SELECTING && battleStore.playerReady[playerStore.myPlayerId]"
      />
      <PlayerCard
        label="Đối thủ"
        variant="error"
        :name="opponentId ? battleStore.initPlayers[opponentId]?.name : undefined"
        :stats="opponentId ? getStats(opponentId) : null"
        :init-hp="opponentId ? battleStore.initPlayers[opponentId]?.stats?.hp : null"
        :ready="battleStore.phase === Phase.SELECTING && !!opponentId && battleStore.playerReady[opponentId]"
      />
    </div>

    <div v-if="battleStore.phase === Phase.SELECTING" class="flex flex-col gap-3">
      <div class="grid grid-cols-3 items-center">
        <span class="text-sm font-semibold opacity-60">Chọn hành động</span>
        <span class="text-sm font-bold text-center opacity-50">Wave {{ battleStore.wave }}</span>
        <div class="flex items-baseline gap-1 justify-end">
          <span
            class="font-mono font-extrabold text-xl tabular-nums"
            :class="battleStore.timeLeft <= 5 ? 'text-error' : 'text-primary'"
            >{{ battleStore.timeLeft }}</span
          >
          <span class="text-xs opacity-40">s</span>
        </div>
      </div>
      <ActionPicker
        v-model="selectedActions"
        :skills="mySkills"
        :submitted="actionsSubmitted"
        @submit="submitActions"
      />
    </div>

    <ExecutingPanel v-if="battleStore.phase === Phase.EXECUTING" :opponent-id="opponentId" />

    <TurnLogList :opponent-id="opponentId" />
  </div>

  <div v-else class="flex justify-center items-center h-80">
    <span class="loading loading-spinner loading-lg"></span>
  </div>

  <BattleResultModal v-if="result" :result="result" @confirm="confirmResult" />
</template>
