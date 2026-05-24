<script setup lang="ts">
  import { ref, computed, watch, onMounted, onUnmounted } from "vue";
  import { useRouter } from "vue-router";
  import { toast } from "vue-sonner";
  import { usePlayerStore, useBattleStore } from "@/stores";
  import { battleRoom, playerService, battleItemService } from "@/client";
  import type { BattleHandlers, RankUpdateData } from "@/client";
  import { Phase, TURNS_PER_WAVE, ITEM_META, ITEM_TYPE_META } from "@/constants";
  import PlayerCard from "./components/PlayerCard.vue";
  import SlimeArena from "./components/SlimeArena.vue";
  import ActionPicker from "./components/ActionPicker.vue";
  import ExecutingPanel from "./components/ExecutingPanel.vue";
  import TurnLogList from "./components/TurnLogList.vue";
  import BattleResultModal from "./components/BattleResultModal.vue";
  import BattleGuideModal from "./components/BattleGuideModal.vue";
  import SelectItemModal from "./components/SelectItemModal.vue";
  import ItemsBar from "./components/ItemsBar.vue";

  const router = useRouter();
  const playerStore = usePlayerStore();
  const battleStore = useBattleStore();

  const selectedActions = ref<number[]>(Array(TURNS_PER_WAVE).fill(0));
  const selectedItemSlot = ref<number | null>(null);
  const selectedItemApplyTurn = ref<number | null>(null);
  const detailItem = ref<{ code: string; type: string } | null>(null);
  const result = ref<"win" | "lose" | "draw" | null>(null);
  const rankUpdate = ref<RankUpdateData | null>(null);
  const showGuide = ref(false);

  const getItemMeta = (code: string) =>
    ITEM_META[code.replace(/-/g, "_")] ?? { icon: "❓", label: code, description: "" };
  const getItemTypeMeta = (type: string) =>
    ITEM_TYPE_META[type] ?? { label: type, badgeClass: "badge-ghost" };

  const mySkills = computed(() => battleStore.initPlayers[playerStore.myPlayerId]?.skills ?? []);

  const opponentId = computed(
    () => battleStore.playerIds.find((id) => id !== playerStore.myPlayerId) ?? null
  );

  const getStats = (playerId: string) => {
    const latestShown = battleStore.shownLogs.find((l: any) => l.wave === battleStore.wave);
    if (latestShown) return latestShown.players.get(playerId)?.stats ?? null;
    // Only use logs from previous waves — avoids showing unrevealed current-wave stats
    const prevLog = [...battleStore.logs].reverse().find((l: any) => l.wave < battleStore.wave);
    if (prevLog) return prevLog.players.get(playerId)?.stats ?? null;
    return battleStore.initPlayers[playerId]?.stats ?? null;
  };

  const submitActions = () => {
    const payload: Record<string, unknown> = { actions: selectedActions.value };
    if (selectedItemSlot.value !== null) {
      payload.itemIndex = selectedItemSlot.value;
      if (selectedItemApplyTurn.value !== null)
        payload.itemApplyIndex = selectedItemApplyTurn.value;
    }
    battleStore.rooms.battle?.send("submit_actions_battle", payload);
  };

  const submitSelectItem = (itemIndex: number, swapIndex?: number) => {
    battleStore.rooms.battle?.send("submit_select_item", { itemIndex, swapIndex });
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
        const revealed = logQueue.value.shift();
        battleStore.shownLogs.unshift(revealed);
        if (revealed.turn === 0) {
          for (const [pid, pLog] of revealed.players as Map<string, any>) {
            if (pLog?.actionsAffected?.after) {
              battleStore.playerActions[pid] = [...pLog.actionsAffected.after];
            }
          }
        }
      }
      const shown = battleStore.shownLogs.filter((l: any) => l.wave === battleStore.wave).length;
      const total = waveLogs.value.length;
      const allRevealed = shown > 0 && logQueue.value.length === 0 && shown >= total;
      if (allRevealed) {
        clearInterval(revealTimer!);
        revealTimer = null;
        setTimeout(() => {
          battleStore.rooms.battle?.send("submit_executing_done");
        }, 1000);
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
        // Fallback: khởi động timer nếu chưa chạy (ví dụ reconnect)
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
    () => [battleStore.phase, battleStore.winner] as const,
    ([phase, winner]) => {
      if (phase === Phase.SELECTING) {
        selectedActions.value = Array(TURNS_PER_WAVE).fill(0);
        selectedItemSlot.value = null;
        selectedItemApplyTurn.value = null;
      }
      if (phase === Phase.EXECUTING) {
        startRevealTimer();
      }
      if (phase === Phase.ENDED) {
        battleStore.isReconnecting = false;
        if (winner === playerStore.myPlayerId) result.value = "win";
        else if (winner) result.value = "lose";
        else result.value = "draw";
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
    onLogAdd: (logs) => {
      battleStore.logs.push(...logs);
    },
    onLogAddReconnect: async (logRaws) => {
      const [, ...logs] = logRaws;
      battleStore.logs = logs;
      // Hiện ngay log các wave cũ, không cần animate
      battleStore.shownLogs = logs.filter((l: any) => l.wave < battleStore.wave);
    },
    onRankUpdate: (data) => {
      rankUpdate.value = data;
      if (playerStore.myRankProfile) {
        playerStore.myRankProfile.point = data.newPoint;
      }
    },
    onOfferedItemsChange: (pid, items) => {
      if (pid === playerStore.myPlayerId) {
        battleStore.offeredItems = items;
      }
    },
    onPlayerItemsChange: (pid, items) => {
      battleStore.playerItems[pid] = items;
    },
    onLeave: (code) => handleLeave(code),
    onError: (_code, msg) => toast.error(`Battle: ${msg}`),
  };

  function resetLocalState() {
    logQueue.value = [];
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
    const isIntentional =
      code === 1000 || battleStore.phase === Phase.ENDED || result.value !== null;
    battleStore.rooms.battle = null;

    if (isIntentional || battleStore.isReconnecting) return;

    battleStore.isReconnecting = true;
    battleStore.reconnectAttempts = 0;

    const token = battleStore.loadReconnectToken();
    if (!token) {
      battleStore.isReconnecting = false;
      // toast.error("Không thể kết nối lại: thiếu token");
      router.push("/lobby");
      return;
    }

    for (let attempt = 0; attempt < MAX_RECONNECT_ATTEMPTS; attempt++) {
      if (result.value !== null || battleStore.phase === Phase.ENDED || code === 4000) {
        battleStore.isReconnecting = false;
        return;
      }

      battleStore.reconnectAttempts = attempt + 1;

      if (attempt > 0) {
        const delay = Math.min(1000 * 2 ** (attempt - 1), 16000);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }

      if (result.value !== null || battleStore.phase === Phase.ENDED) {
        battleStore.isReconnecting = false;
        return;
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
    if (battleStore?.battleItemsData?.length === 0 && playerStore.playerToken) {
      battleItemService.setToken(playerStore.playerToken);
      battleItemService
        .getAll()
        .then((items) => {
          battleStore.battleItemsData = items;
        })
        .catch(() => {});
    }

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
        :ready="
          battleStore.phase === Phase.SELECTING && battleStore.playerReady[playerStore.myPlayerId]
        "
        :tier-code="battleStore.initPlayers[playerStore.myPlayerId]?.tierCode"
      />
      <PlayerCard
        label="Đối thủ"
        variant="error"
        :name="opponentId ? battleStore.initPlayers[opponentId]?.name : undefined"
        :stats="opponentId ? getStats(opponentId) : null"
        :init-hp="opponentId ? battleStore.initPlayers[opponentId]?.stats?.hp : null"
        :ready="
          battleStore.phase === Phase.SELECTING &&
          !!opponentId &&
          battleStore.playerReady[opponentId]
        "
        :tier-code="opponentId ? battleStore.initPlayers[opponentId]?.tierCode : null"
      />
    </div>

    <!-- Slimes hiển thị ở cả SELECTING và EXECUTING -->
    <SlimeArena :opponent-id="opponentId" />

    <!-- Túi đồ hai bên, luôn hiển thị khi có item -->
    <ItemsBar
      :opponent-id="opponentId"
      :interactive="
        battleStore.phase === Phase.SELECTING && !battleStore.playerReady[playerStore.myPlayerId]
      "
      :selected-slot="selectedItemSlot"
      :selected-apply-turn="selectedItemApplyTurn"
      @select="selectedItemSlot = $event"
      @select-apply-turn="selectedItemApplyTurn = $event"
      @detail="detailItem = $event"
    />

    <!-- Nội dung theo phase, chuyển đổi mượt mà -->
    <Transition name="phase-fade" mode="out-in">
      <div v-if="battleStore.phase === Phase.SELECTING" key="selecting" class="flex flex-col gap-3">
        <div class="grid grid-cols-3 items-center">
          <div class="flex items-center gap-2">
            <span class="text-sm font-semibold opacity-60">Chọn hành động</span>
            <button
              class="btn btn-xs btn-circle btn-info animate-pulse shadow-md shadow-info/50 font-bold text-info-content"
              title="Hướng dẫn chiến đấu"
              @click="showGuide = true"
            >
              ?
            </button>
          </div>
          <span class="badge badge-neutral font-bold mx-auto">Wave {{ battleStore.wave }}</span>
          <div class="flex items-baseline gap-1 justify-end">
            <span
              class="countdown font-mono font-extrabold text-xl"
              :class="battleStore.timeLeft <= 5 ? 'text-error' : 'text-primary'"
            >
              <span :style="`--value:${battleStore.timeLeft};`"></span>
            </span>
            <span class="text-xs opacity-40">s</span>
          </div>
        </div>
        <ActionPicker
          v-model="selectedActions"
          :skills="mySkills"
          :submitted="!!battleStore.playerReady[playerStore.myPlayerId]"
          @submit="submitActions"
        />
      </div>

      <div
        v-else-if="
          battleStore.phase === Phase.EXECUTING && !!battleStore.playerReady[playerStore.myPlayerId]
        "
        key="waiting-next"
        class="flex items-center justify-center gap-2 py-3 opacity-50"
      >
        <span class="loading loading-dots loading-sm"></span>
        <span class="text-sm">Đang chờ người chơi...</span>
      </div>

      <ExecutingPanel
        v-else-if="battleStore.phase === Phase.EXECUTING"
        key="executing"
        :opponent-id="opponentId"
      />
    </Transition>

    <TurnLogList :opponent-id="opponentId" />
  </div>

  <div v-else class="flex justify-center items-center h-80">
    <span class="loading loading-spinner loading-lg"></span>
  </div>

  <SelectItemModal
    v-if="battleStore.phase === Phase.SELECTING_ITEM"
    :submitted="!!battleStore.playerReady[playerStore.myPlayerId]"
    @submit="submitSelectItem"
    @skip="battleStore.rooms.battle?.send('submit_select_item', {})"
  />

  <!-- Item detail modal -->
  <div
    v-if="detailItem"
    class="modal modal-open items-end sm:items-center"
    @click.self="detailItem = null"
  >
    <div class="modal-box rounded-none sm:rounded-none w-full max-w-xs flex flex-col gap-3 pb-6">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="text-2xl">{{ getItemMeta(detailItem.code).icon }}</span>
          <span class="font-bold text-base">{{ getItemMeta(detailItem.code).label }}</span>
        </div>
        <span :class="['badge badge-sm', getItemTypeMeta(detailItem.type).badgeClass]">
          {{ getItemTypeMeta(detailItem.type).label }}
        </span>
      </div>
      <p class="text-sm opacity-70 leading-relaxed">
        {{ getItemMeta(detailItem.code).description }}
      </p>
      <button class="btn btn-sm btn-ghost self-end" @click="detailItem = null">Đóng</button>
    </div>
  </div>

  <BattleResultModal
    v-if="result"
    :result="result"
    :rank-update="rankUpdate"
    @confirm="confirmResult"
  />
  <BattleGuideModal v-if="showGuide" @close="showGuide = false" />
</template>

<style scoped>
  .phase-fade-enter-active {
    transition:
      opacity 0.2s ease,
      transform 0.2s ease;
  }
  .phase-fade-leave-active {
    transition:
      opacity 0.15s ease,
      transform 0.15s ease;
  }
  .phase-fade-enter-from {
    opacity: 0;
    transform: translateY(6px);
  }
  .phase-fade-leave-to {
    opacity: 0;
    transform: translateY(-6px);
  }
</style>
