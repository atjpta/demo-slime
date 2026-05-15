<script setup lang="ts">
  import { Toaster } from "vue-sonner";
  import { useRoute, useRouter } from "vue-router";
  import { useAuthStore, usePlayerStore, useBattleStore } from "@/stores";

  const route = useRoute();
  const router = useRouter();
  const authStore = useAuthStore();
  const playerStore = usePlayerStore();
  const battleStore = useBattleStore();

  const leaveGame = () => {
    battleStore.rooms.battle?.leave();
    battleStore.rooms.queue?.leave();
    battleStore.rooms.battle = null;
    battleStore.rooms.queue = null;
    battleStore.reset();
    router.push("/lobby");
  };

  const logout = () => {
    battleStore.rooms.battle?.leave();
    battleStore.rooms.queue?.leave();
    battleStore.rooms.battle = null;
    battleStore.rooms.queue = null;
    battleStore.reset();
    playerStore.myPlayer = null;
    playerStore.myPlayerId = "";
    playerStore.playerToken = "";
    authStore.userToken = "";
    localStorage.removeItem("slime_player_token");
    router.push("/login");
  };
</script>

<template>
  <div class="min-h-screen bg-base-200">
    <div class="navbar bg-base-300 shadow px-4">
      <span class="text-xl font-bold text-primary mr-3">⚔️ Slime Battle</span>
      <div class="badge badge-outline capitalize">{{ route.name }}</div>
      <div class="ml-auto flex items-center gap-2">
        <span v-if="playerStore.myPlayer" class="text-sm opacity-60">{{ playerStore.myPlayer.name }}</span>
        <button v-if="route.name === 'battle'" class="btn btn-xs btn-ghost" @click="leaveGame">
          Thoát
        </button>
        <button v-if="route.name !== 'login'" class="btn btn-xs btn-ghost" @click="logout">
          Đăng xuất
        </button>
      </div>
    </div>

    <Toaster position="top-center" rich-colors close-button />
    <RouterView />
  </div>
</template>
