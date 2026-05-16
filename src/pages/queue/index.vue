<script setup lang="ts">
  import { ref, onMounted, onUnmounted } from "vue";
  import { useRouter } from "vue-router";
  import { useBattleStore } from "@/stores";

  const router = useRouter();
  const battleStore = useBattleStore();

  const elapsed = ref(0);
  let timer: ReturnType<typeof setInterval> | null = null;

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  const cancel = () => {
    battleStore.rooms.queue?.leave();
    battleStore.rooms.queue = null;
    router.push("/lobby");
  };

  onMounted(() => {
    timer = setInterval(() => elapsed.value++, 1000);
  });

  onUnmounted(() => {
    if (timer) clearInterval(timer);
  });
</script>

<template>
  <div class="flex flex-col justify-center items-center h-80 gap-4">
    <span class="loading loading-spinner loading-lg text-primary"></span>
    <p class="text-xl font-semibold">Đang tìm đối thủ...</p>
    <span class="font-mono text-2xl font-bold tabular-nums opacity-60">{{ formatTime(elapsed) }}</span>
    <button class="btn btn-ghost btn-sm mt-2" @click="cancel">Hủy</button>
  </div>
</template>
