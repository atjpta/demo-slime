<script setup lang="ts">
  import { useBattleStore } from "@/store";

  const store = useBattleStore();

  const cancel = () => {
    store.rooms.queue?.leave();
    store.rooms.queue = null;
    store.step = "players";
  };
</script>

<template>
  <div class="flex flex-col justify-center items-center h-80 gap-6">
    <span class="loading loading-spinner loading-lg text-primary"></span>
    <p class="text-xl font-semibold">Đang tìm đối thủ...</p>
    <button class="btn btn-ghost btn-sm" @click="cancel">Hủy</button>
  </div>
</template>
