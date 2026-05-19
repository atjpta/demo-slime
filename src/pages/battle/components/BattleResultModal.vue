<script setup lang="ts">
  import type { RankUpdateData } from "@/client";

  defineProps<{
    result: "win" | "lose" | "draw";
    rankUpdate?: RankUpdateData | null;
  }>();

  const emit = defineEmits<{ confirm: [] }>();

  const META = {
    win:  { icon: "🏆", title: "Chiến thắng!", desc: "Bạn đã giành chiến thắng!", cls: "text-success" },
    lose: { icon: "💀", title: "Thất bại!",    desc: "Hãy cố gắng hơn lần sau.",   cls: "text-error"   },
    draw: { icon: "🤝", title: "Hòa!",         desc: "Hai bên ngang tài ngang sức.", cls: "text-warning" },
  };
</script>

<template>
  <div class="modal modal-open">
    <div class="modal-box rounded-none text-center">
      <div class="text-6xl mb-3">{{ META[result].icon }}</div>
      <h3 class="font-bold text-2xl mb-1" :class="META[result].cls">{{ META[result].title }}</h3>
      <p class="text-base-content/60 mb-4">{{ META[result].desc }}</p>

      <!-- Rank update -->
      <div v-if="rankUpdate" class="bg-base-200 rounded-lg px-4 py-3 mb-5 flex flex-col items-center gap-1">
        <div class="text-xs font-bold uppercase tracking-widest opacity-50 mb-1">Xếp hạng</div>
        <div class="flex items-center gap-2 text-lg font-bold tabular-nums">
          <span class="opacity-60">{{ rankUpdate.oldPoint }}</span>
          <span class="opacity-40 text-base">→</span>
          <span>{{ rankUpdate.newPoint }}</span>
        </div>
        <div
          class="text-sm font-semibold"
          :class="rankUpdate.point >= 0 ? 'text-success' : 'text-error'"
        >
          {{ rankUpdate.point >= 0 ? "+" : "" }}{{ rankUpdate.point }} điểm
        </div>
      </div>

      <button class="btn btn-primary rounded-none w-full" @click="emit('confirm')">OK</button>
    </div>
  </div>
</template>
