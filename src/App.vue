<script setup lang="ts">
  import { Toaster } from "vue-sonner";
  import { useBattleStore } from "@/store";
  import LoginPage from "@/pages/login/index.vue";
  import PlayersPage from "@/pages/players/index.vue";
  import QueuePage from "@/pages/queue/index.vue";
  import BattlePage from "@/pages/battle/index.vue";

  const store = useBattleStore();

  const leaveGame = () => {
    store.rooms.battle?.leave();
    store.rooms.queue?.leave();
    store.rooms.battle = null;
    store.rooms.queue = null;
    store.battleState = null;
    store.step = "players";
  };

  const logout = () => {
    store.rooms.battle?.leave();
    store.rooms.queue?.leave();
    store.rooms.battle = null;
    store.rooms.queue = null;
    store.battleState = null;
    store.myPlayer = null;
    store.myPlayerId = "";
    store.userToken = "";
    store.playerToken = "";
    store.step = "login";
  };
</script>

<template>
  <div class="min-h-screen bg-base-200">
    <div class="navbar bg-base-300 shadow px-4">
      <span class="text-xl font-bold text-primary mr-3">⚔️ Slime Battle</span>
      <div class="badge badge-outline capitalize">{{ store.step }}</div>
      <div class="ml-auto flex items-center gap-2">
        <span v-if="store.myPlayer" class="text-sm opacity-60">{{ store.myPlayer.name }}</span>
        <button v-if="store.step === 'battle'" class="btn btn-xs btn-ghost" @click="leaveGame">
          Thoát
        </button>
        <button v-if="store.step !== 'login'" class="btn btn-xs btn-ghost" @click="logout">
          Đăng xuất
        </button>
      </div>
    </div>

    <Toaster position="top-center" rich-colors close-button />

    <LoginPage v-if="store.step === 'login'" />
    <PlayersPage v-else-if="store.step === 'players'" />
    <QueuePage v-else-if="store.step === 'queue'" />
    <BattlePage v-else-if="store.step === 'battle'" />
  </div>
</template>
