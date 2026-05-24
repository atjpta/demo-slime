<script setup lang="ts">
  import { ref, onMounted } from "vue";
  import { rankingService } from "@/client";
  import type { LeaderboardItem, MyRankPosition } from "@/client";
  import TierBadge from "@/components/TierBadge.vue";
  import type { TierCode } from "@/constants";
  import { usePlayerStore } from "@/stores";

  const emit = defineEmits<{ close: [] }>();

  const playerStore = usePlayerStore();
  const items = ref<LeaderboardItem[]>([]);
  const myPosition = ref<MyRankPosition | null>(null);
  const loading = ref(true);

  onMounted(async () => {
    try {
      rankingService.setToken(playerStore.playerToken);
      const [leaderboard, position] = await Promise.all([
        rankingService.getLeaderboard("unlimit", 1, 100),
        rankingService.getMyPosition("unlimit"),
      ]);
      items.value = leaderboard.items;
      myPosition.value = position;
    } finally {
      loading.value = false;
    }
  });

  const rankColor = (idx: number) => {
    if (idx === 0) return "text-yellow-400";
    if (idx === 1) return "text-slate-400";
    if (idx === 2) return "text-amber-600";
    return "opacity-40";
  };
</script>

<template>
  <div class="modal modal-open" @click.self="emit('close')">
    <div class="modal-box max-w-sm p-0 overflow-hidden flex flex-col max-h-[80vh]">
      <div class="flex items-center justify-between px-5 py-4 border-b border-base-200 shrink-0">
        <h3 class="font-bold text-lg">🏆 Bảng xếp hạng</h3>
        <button class="btn btn-sm btn-circle btn-ghost" @click="emit('close')">✕</button>
      </div>

      <div v-if="loading" class="flex justify-center py-10">
        <span class="loading loading-spinner loading-md"></span>
      </div>

      <template v-else>
        <div class="overflow-y-auto flex-1 divide-y divide-base-200">
          <div
            v-for="(item, idx) in items"
            :key="item._id"
            class="flex items-center gap-3 px-5 py-3"
          >
            <span class="w-6 text-center font-bold shrink-0 tabular-nums" :class="rankColor(idx)">
              {{ idx + 1 }}
            </span>
            <div class="flex-1 min-w-0 flex items-center gap-1.5">
              <TierBadge
                class="text-xs"
                :is-show-label="false"
                :code="item.tier?.code as TierCode"
              />
              <span class="font-semibold text-sm truncate">{{ item.player.name }}</span>
            </div>
            <span class="text-sm font-mono font-bold tabular-nums shrink-0">{{ item.point }}</span>
          </div>
        </div>

        <!-- My position row -->
        <div
          class="border-t-2 border-primary/40 bg-primary/5 px-5 py-3 shrink-0 flex items-center gap-3"
        >
          <span class="w-6 text-center font-bold tabular-nums text-primary shrink-0">
            {{ myPosition ? (myPosition.rank > 100 ? "100+" : myPosition.rank) : "?" }}
          </span>
          <div class="flex-1 min-w-0 flex items-center gap-1.5">
            <TierBadge
              :is-show-label="false"
              :code="myPosition?.profile.tier?.code as TierCode"
              class="text-xs"
            />
            <span class="font-semibold text-sm truncate text-primary">
              {{ playerStore.myPlayer?.name }}
            </span>
          </div>
          <span class="text-sm font-mono font-bold tabular-nums shrink-0 text-primary">
            {{ myPosition?.profile.point ?? "?" }}
          </span>
        </div>
      </template>
    </div>
  </div>
</template>
