<script setup lang="ts">
  import { ref, onMounted, onUnmounted } from "vue";
  import { useRouter } from "vue-router";
  import { useBattleStore } from "@/stores";

  const router = useRouter();
  const battleStore = useBattleStore();

  const elapsed = ref(0);
  let timer: ReturnType<typeof setInterval> | null = null;

  const leaveQueue = () => {
    battleStore.rooms.queue?.leave();
    battleStore.rooms.queue = null;
  };

  const cancel = () => {
    leaveQueue();
    router.push("/lobby");
  };

  onMounted(() => {
    timer = setInterval(() => elapsed.value++, 1000);
  });

  onUnmounted(() => {
    if (timer) clearInterval(timer);
    leaveQueue();
  });
</script>

<template>
  <div
    v-motion
    :initial="{ opacity: 0, y: 20 }"
    :enter="{ opacity: 1, y: 0, transition: { duration: 400 } }"
    class="flex flex-col justify-center items-center h-80 gap-4"
  >
    <span class="loading loading-spinner loading-lg text-primary"></span>
    <p class="text-xl font-semibold">Đang tìm đối thủ...</p>
    <div class="flex items-center font-mono font-bold text-2xl tabular-nums opacity-60">
      <span>{{ String(Math.floor(elapsed / 60)).padStart(2, "0") }}</span>
      <span>:</span>
      <span class="countdown"><span :style="`--value:${elapsed % 60};`"></span></span>
    </div>
    <button class="btn btn-ghost btn-sm mt-2" @click="cancel">Hủy</button>
  </div>
</template>
