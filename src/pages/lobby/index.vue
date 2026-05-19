<script setup lang="ts">
  import { ref, onMounted } from "vue";
  import { useRouter } from "vue-router";
  import { toast } from "vue-sonner";
  import { useAuthStore, usePlayerStore, useBattleStore } from "@/stores";
  import { playerService, rankingService, queueRoom, battleRoom } from "@/client";
  import TierBadge from "@/components/TierBadge.vue";
  import RankConfigModal from "./components/RankConfigModal.vue";
  import LeaderboardModal from "./components/LeaderboardModal.vue";
  import BattleGuideModal from "@/pages/battle/components/BattleGuideModal.vue";
  import type { TierCode } from "@/constants";

  const showRankConfig = ref(false);
  const showLeaderboard = ref(false);
  const showGuide = ref(false);
  const rankLoading = ref(false);

  const router = useRouter();
  const authStore = useAuthStore();
  const playerStore = usePlayerStore();
  const battleStore = useBattleStore();

  // ─── Create match ────────────────────────────────────────────────────────────
  const showCreateModal = ref(false);
  const createdRoomCode = ref("");
  const createLoading = ref(false);

  const createMatch = async () => {
    createLoading.value = true;
    try {
      const room = await battleRoom.create(playerStore.playerToken);
      createdRoomCode.value = room.roomId;
      battleStore.rooms.battle = room;
      showCreateModal.value = true;
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      createLoading.value = false;
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(createdRoomCode.value);
    toast.success("Đã sao chép mã phòng");
  };

  const enterCreatedRoom = () => {
    showCreateModal.value = false;
    router.push("/battle");
  };

  const cancelCreate = async () => {
    showCreateModal.value = false;
    await battleRoom.leave(battleStore.rooms.battle);
    battleStore.rooms.battle = null;
    createdRoomCode.value = "";
  };

  // ─── Join by code ─────────────────────────────────────────────────────────────
  const showJoinModal = ref(false);
  const joinCode = ref("");
  const joinLoading = ref(false);

  const joinByCode = async () => {
    if (!joinCode.value.trim()) return;
    joinLoading.value = true;
    try {
      const room = await battleRoom.joinById(joinCode.value.trim(), playerStore.playerToken);
      battleStore.rooms.battle = room;
      showJoinModal.value = false;
      router.push("/battle");
    } catch (e: any) {
      toast.error("Không tìm thấy phòng hoặc phòng đã đầy");
    } finally {
      joinLoading.value = false;
    }
  };

  // ─── Quick match ─────────────────────────────────────────────────────────────
  const restorePlayer = async () => {
    if (!playerStore.playerToken) return;
    rankLoading.value = true;
    try {
      playerService.setToken(playerStore.playerToken);
      rankingService.setToken(playerStore.playerToken);
      const [player, rankProfile] = await Promise.all([
        playerService.me(),
        rankingService.getMyRankProfile("normal"),
      ]);
      playerStore.myPlayer = player;
      playerStore.myPlayerId = player._id;
      playerStore.myRankProfile = rankProfile;
    } catch {
      playerStore.playerToken = "";
      router.push("/players");
    } finally {
      rankLoading.value = false;
    }
  };

  const joinQueue = async (rankMode?: "normal" | "balance") => {
    authStore.loading = true;
    try {
      router.push("/queue");
      battleStore.rooms.queue = await queueRoom.join(
        playerStore.playerToken,
        {
          onBattleReady: (room) => {
            battleStore.rooms.battle = room;
            router.push("/battle");
          },
          onLeave: (code) => console.log("[queue] onLeave code:", code),
          onError: (_code, msg) => {
            toast.error(`Queue: ${msg}`);
            router.push("/lobby");
          },
        },
        rankMode,
      );
    } catch (e: any) {
      toast.error(e.message);
      router.push("/lobby");
    } finally {
      authStore.loading = false;
    }
  };

  const changePlayer = () => {
    playerStore.playerToken = "";
    playerStore.myPlayer = null;
    playerStore.myPlayerId = "";
    router.push("/players");
  };

  onMounted(restorePlayer);
</script>

<template>
  <div class="container mx-auto max-w-lg p-6 flex flex-col items-center gap-6 mt-8">
    <!-- Player info -->
    <div class="card bg-base-100 shadow-md w-full">
      <div class="card-body items-center text-center gap-2 py-5">
        <div class="text-4xl">🟢</div>
        <div class="text-xl font-bold">{{ playerStore.myPlayer?.name ?? "..." }}</div>
        <div class="text-sm opacity-50">Cấp {{ playerStore.myPlayer?.level ?? "?" }}</div>
        <button class="btn btn-xs btn-ghost mt-1" @click="changePlayer">Đổi nhân vật</button>
      </div>
    </div>

    <!-- Mode sections -->
    <div class="grid grid-cols-2 gap-4 w-full">
      <!-- Rank -->
      <div class="card bg-base-100 shadow-md">
        <div class="card-body items-center text-center gap-3 py-5 px-4">
          <div class="flex items-center gap-1 w-full justify-center">
            <div class="text-sm font-bold uppercase tracking-widest opacity-60">Xếp hạng</div>
            <button
              class="btn btn-xs btn-circle btn-ghost opacity-50 hover:opacity-100"
              title="Bảng xếp hạng"
              @click="showLeaderboard = true"
            >🏆</button>
            <button
              class="btn btn-xs btn-circle btn-ghost opacity-50 hover:opacity-100"
              title="Xem cấu hình rank"
              @click="showRankConfig = true"
            >ℹ️</button>
          </div>
          <span v-if="rankLoading" class="loading loading-spinner loading-sm opacity-50"></span>
          <template v-else>
            <TierBadge
              v-if="playerStore.myRankProfile?.tier?.code"
              :code="playerStore.myRankProfile.tier.code as TierCode"
            />
            <div v-else class="text-xs opacity-40">Chưa có rank</div>
            <div v-if="playerStore.myRankProfile" class="text-xs opacity-50">
              {{ playerStore.myRankProfile.point }} điểm
            </div>
          </template>
          <button
            class="btn btn-primary btn-sm w-full mt-1"
            :disabled="authStore.loading"
            @click="joinQueue('normal')"
          >
            ⚔️ Ghép trận
          </button>
        </div>
      </div>

      <!-- Casual -->
      <div class="card bg-base-100 shadow-md">
        <div class="card-body items-center text-center gap-3 py-5 px-4">
          <div class="text-sm font-bold uppercase tracking-widest opacity-60">Thường</div>
          <div class="text-3xl">🎮</div>
          <div class="flex flex-col gap-2 w-full mt-1">
            <button
              class="btn btn-outline btn-sm w-full"
              :disabled="authStore.loading"
              @click="joinQueue()"
            >
              🔀 Ghép nhanh
            </button>
            <button class="btn btn-outline btn-sm w-full" :disabled="createLoading" @click="createMatch">
              <span v-if="createLoading" class="loading loading-spinner loading-xs"></span>
              🏟️ Tạo phòng
            </button>
            <button class="btn btn-outline btn-sm w-full" @click="showJoinModal = true">
              🔍 Nhập mã
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="flex gap-2">
      <button class="btn btn-ghost btn-sm opacity-60" @click="router.push('/history')">
        📜 Lịch sử
      </button>
      <button class="btn btn-ghost btn-sm opacity-60" @click="showGuide = true">
        📖 Hướng dẫn
      </button>
    </div>
  </div>

  <!-- Create match modal -->
  <div
    v-if="showCreateModal"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
  >
    <div class="card bg-base-100 shadow-xl w-80">
      <div class="card-body gap-4">
        <h3 class="card-title text-lg">Phòng đã tạo</h3>
        <p class="text-sm opacity-60">Chia sẻ mã này cho đối thủ để vào cùng phòng</p>
        <div class="flex items-center gap-2">
          <span
            class="font-mono font-bold text-xl tracking-widest flex-1 text-center bg-base-200 py-2 px-3 rounded"
          >
            {{ createdRoomCode }}
          </span>
          <button class="btn btn-sm btn-ghost" @click="copyCode">📋</button>
        </div>
        <div class="flex gap-2 mt-1">
          <button class="btn btn-ghost flex-1" @click="cancelCreate">Hủy</button>
          <button class="btn btn-primary flex-1" @click="enterCreatedRoom">Vào phòng</button>
        </div>
      </div>
    </div>
  </div>

  <!-- Join by code modal -->
  <div v-if="showJoinModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
    <div class="card bg-base-100 shadow-xl w-80">
      <div class="card-body gap-4">
        <h3 class="card-title text-lg">Tìm trận theo mã</h3>
        <input
          v-model="joinCode"
          type="text"
          placeholder="Nhập mã phòng..."
          class="input input-bordered w-full font-mono tracking-widest"
          @keyup.enter="joinByCode"
        />
        <div class="flex gap-2">
          <button
            class="btn btn-ghost flex-1"
            @click="
              showJoinModal = false;
              joinCode = '';
            "
          >
            Hủy
          </button>
          <button
            class="btn btn-primary flex-1"
            :disabled="joinLoading || !joinCode.trim()"
            @click="joinByCode"
          >
            <span v-if="joinLoading" class="loading loading-spinner loading-sm"></span>
            Vào phòng
          </button>
        </div>
      </div>
    </div>
  </div>

  <LeaderboardModal v-if="showLeaderboard" @close="showLeaderboard = false" />
  <RankConfigModal v-if="showRankConfig" @close="showRankConfig = false" />
  <BattleGuideModal v-if="showGuide" @close="showGuide = false" />
</template>
