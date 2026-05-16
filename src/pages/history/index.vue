<script setup lang="ts">
  import { ref, computed, watch, onMounted } from "vue";
  import { useRouter } from "vue-router";
  import { toast } from "vue-sonner";
  import { useAuthStore, usePlayerStore } from "@/stores";
  import { battleLogService } from "@/client";
  import type { BattleLogItem } from "@/client";

  const router = useRouter();
  const authStore = useAuthStore();
  const playerStore = usePlayerStore();

  const items = ref<BattleLogItem[]>([]);
  const total = ref(0);
  const page = ref(1);
  const limit = 10;
  const onlyMine = ref(true);
  const loading = ref(false);

  const totalPages = computed(() => Math.ceil(total.value / limit));

  const endReasonLabel: Record<string, string> = {
    hp_depleted: "Hết HP",
    max_waves: "Hết wave",
    draw: "Hòa",
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" });

  const load = async () => {
    loading.value = true;
    try {
      battleLogService.setToken(authStore.userToken);
      const res = await battleLogService.getList({
        playerId: onlyMine.value ? playerStore.myPlayerId : undefined,
        page: page.value,
        limit,
      });
      items.value = res.items;
      total.value = res.pagination.total;
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      loading.value = false;
    }
  };

  const changePage = (p: number) => {
    page.value = p;
    load();
  };

  watch(onlyMine, () => {
    page.value = 1;
    load();
  });

  onMounted(load);
</script>

<template>
  <div class="container mx-auto max-w-2xl p-4 flex flex-col gap-4">
    <button class="btn btn-ghost btn-sm self-start" @click="router.push('/lobby')">
      ← Quay lại
    </button>

    <div class="flex items-center justify-between">
      <h1 class="text-xl font-bold">Lịch sử trận đấu</h1>
      <label class="flex items-center gap-2 cursor-pointer">
        <span class="text-sm opacity-60">Của tôi</span>
        <input type="checkbox" class="toggle toggle-sm toggle-primary" v-model="onlyMine" />
      </label>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-12">
      <span class="loading loading-spinner loading-md"></span>
    </div>

    <!-- Empty -->
    <div v-else-if="!items.length" class="text-center opacity-40 py-12">Chưa có trận đấu nào</div>

    <!-- List -->
    <div v-else class="flex flex-col gap-2">
      <div
        v-for="item in items"
        :key="item._id"
        class="card bg-base-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
        @click="router.push(`/history/${item._id}`)"
      >
        <div class="card-body py-3 px-4 flex-row items-center gap-3">
          <!-- Players -->
          <div class="flex-1 min-w-0">
            <div class="font-semibold text-sm flex items-center gap-1.5 flex-wrap">
              <span
                :class="item.winner === item.players[0]?.player._id ? 'text-warning' : 'opacity-60'"
              >
                <span v-if="item.winner === item.players[0]?.player._id">🏆 </span
                >{{ item.players[0]?.player.name ?? "?" }}
              </span>
              <span class="opacity-30 text-xs">vs</span>
              <span
                :class="item.winner === item.players[1]?.player._id ? 'text-warning' : 'opacity-60'"
              >
                <span v-if="item.winner === item.players[1]?.player._id">🏆 </span
                >{{ item.players[1]?.player.name ?? "?" }}
              </span>
              <span v-if="!item.winner" class="text-xs opacity-40 italic">hòa</span>
            </div>
            <div class="text-xs opacity-40 mt-0.5">
              {{ endReasonLabel[item.endReason] ?? item.endReason }} ·
              {{ formatDate(item.createdAt) }}
            </div>
          </div>

          <!-- Replay link -->
          <span class="text-xs opacity-50">▶</span>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="flex justify-center gap-1 mt-2">
      <button
        v-for="p in totalPages"
        :key="p"
        class="btn btn-xs"
        :class="p === page ? 'btn-primary' : 'btn-ghost'"
        @click="changePage(p)"
      >
        {{ p }}
      </button>
    </div>
  </div>
</template>
