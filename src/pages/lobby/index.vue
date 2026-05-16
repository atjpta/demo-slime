<script setup lang="ts">
  import { ref, onMounted } from "vue";
  import { useRouter } from "vue-router";
  import { toast } from "vue-sonner";
  import { useAuthStore, usePlayerStore, useBattleStore } from "@/stores";
  import { playerService, queueRoom, battleRoom } from "@/client";

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
    if (playerStore.myPlayer || !playerStore.playerToken) return;
    try {
      playerService.setToken(playerStore.playerToken);
      playerStore.myPlayer = await playerService.me();
      playerStore.myPlayerId = playerStore.myPlayer._id;
    } catch {
      playerStore.playerToken = "";
      router.push("/players");
    }
  };

  const findQuickMatch = async () => {
    authStore.loading = true;
    try {
      router.push("/queue");
      battleStore.rooms.queue = await queueRoom.join(playerStore.playerToken, {
        onBattleReady: (room) => {
          battleStore.rooms.battle = room;
          router.push("/battle");
        },
        onLeave: (code) => console.log("[queue] onLeave code:", code),
        onError: (_code, msg) => {
          toast.error(`Queue: ${msg}`);
          router.push("/lobby");
        },
      });
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
  <div class="container mx-auto max-w-sm p-6 flex flex-col items-center gap-6 mt-8">
    <!-- Player info -->
    <div class="card bg-base-100 shadow-md w-full">
      <div class="card-body items-center text-center gap-2 py-5">
        <div class="text-4xl">🟢</div>
        <div class="text-xl font-bold">{{ playerStore.myPlayer?.name ?? "..." }}</div>
        <div class="text-sm opacity-50">Cấp {{ playerStore.myPlayer?.level ?? "?" }}</div>
        <button class="btn btn-xs btn-ghost mt-1" @click="changePlayer">Đổi nhân vật</button>
      </div>
    </div>

    <!-- Match buttons -->
    <div class="flex flex-col gap-3 w-full">
      <button
        class="btn btn-primary btn-lg w-full"
        :disabled="authStore.loading"
        @click="findQuickMatch"
      >
        ⚔️ Tìm trận nhanh
      </button>
      <button
        class="btn btn-outline w-full"
        :class="{ loading: createLoading }"
        :disabled="createLoading"
        @click="createMatch"
      >
        🏟️ Tạo trận
      </button>
      <button class="btn btn-outline w-full" @click="showJoinModal = true">
        🔍 Tìm trận theo mã
      </button>
      <button class="btn btn-ghost btn-sm w-full opacity-60" @click="router.push('/history')">
        📜 Lịch sử trận đấu
      </button>
    </div>
  </div>

  <!-- Create match modal -->
  <div v-if="showCreateModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
    <div class="card bg-base-100 shadow-xl w-80">
      <div class="card-body gap-4">
        <h3 class="card-title text-lg">Phòng đã tạo</h3>
        <p class="text-sm opacity-60">Chia sẻ mã này cho đối thủ để vào cùng phòng</p>
        <div class="flex items-center gap-2">
          <span class="font-mono font-bold text-xl tracking-widest flex-1 text-center bg-base-200 py-2 px-3 rounded">
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
          <button class="btn btn-ghost flex-1" @click="showJoinModal = false; joinCode = ''">Hủy</button>
          <button
            class="btn btn-primary flex-1"
            :class="{ loading: joinLoading }"
            :disabled="joinLoading || !joinCode.trim()"
            @click="joinByCode"
          >
            Vào phòng
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
