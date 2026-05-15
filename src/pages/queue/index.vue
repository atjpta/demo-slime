<script setup lang="ts">
  import { useRouter } from "vue-router";
  import { useBattleStore } from "@/stores";

  const router = useRouter();
  const battleStore = useBattleStore();

  const cancel = () => {
    battleStore.rooms.queue?.leave();
    battleStore.rooms.queue = null;
    router.push("/lobby");
  };
</script>

<template>
  <div class="flex flex-col justify-center items-center h-80 gap-6">
    <span class="loading loading-spinner loading-lg text-primary"></span>
    <p class="text-xl font-semibold">Đang tìm đối thủ...</p>
    <button class="btn btn-ghost btn-sm" @click="cancel">Hủy</button>
  </div>
</template>
