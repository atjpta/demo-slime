<script setup lang="ts">
  import { onMounted } from "vue";
  import { useRouter } from "vue-router";
  import { toast } from "vue-sonner";
  import { useAuthStore, usePlayerStore, useBattleStore } from "@/stores";
  import { playerService, queueRoom } from "@/client";

  const router = useRouter();
  const authStore = useAuthStore();
  const playerStore = usePlayerStore();
  const battleStore = useBattleStore();

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
        @click="toast.info('Tính năng đang được phát triển')"
      >
        🏟️ Tạo trận
      </button>
      <button
        class="btn btn-outline w-full"
        @click="toast.info('Tính năng đang được phát triển')"
      >
        🔍 Tìm trận theo mã
      </button>
    </div>
  </div>
</template>
