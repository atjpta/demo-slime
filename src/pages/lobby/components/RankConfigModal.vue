<script setup lang="ts">
  import { ref, onMounted } from "vue";
  import { rankingService } from "@/client";
  import type { RankConfig } from "@/client";
  import TierBadge from "@/components/TierBadge.vue";
  import type { TierCode } from "@/constants";

  const emit = defineEmits<{ close: [] }>();

  const config = ref<RankConfig | null>(null);
  const loading = ref(true);

  onMounted(async () => {
    try {
      config.value = await rankingService.getRankConfig();
    } finally {
      loading.value = false;
    }
  });

  const normalLadder = () => config.value?.ladders.find((l) => l.rankMode === "unlimit") ?? null;
</script>

<template>
  <div class="modal modal-open" @click.self="emit('close')">
    <div class="modal-box max-w-sm">
      <div class="flex items-center justify-between mb-4">
        <h3 class="font-bold text-lg">Bảng xếp hạng</h3>
        <button class="btn btn-sm btn-circle btn-ghost" @click="emit('close')">✕</button>
      </div>

      <div v-if="loading" class="flex justify-center py-8">
        <span class="loading loading-spinner loading-md"></span>
      </div>

      <template v-else-if="config">
        <!-- Ladder rules -->
        <div v-if="normalLadder()" class="bg-base-200 rounded-lg px-4 py-3 mb-4 text-sm">
          <div class="font-semibold mb-2 opacity-60 uppercase tracking-widest text-xs">
            {{ normalLadder()!.name }}
          </div>
          <div class="grid grid-cols-3 gap-2 text-center">
            <div>
              <div class="text-base-content/50 text-xs mb-0.5">Khởi đầu</div>
              <div class="font-bold">{{ normalLadder()!.ruleSet.initialPoint }}</div>
            </div>
            <div>
              <div class="text-base-content/50 text-xs mb-0.5">Thắng</div>
              <div class="font-bold text-success">+{{ normalLadder()!.ruleSet.winPoint }}</div>
            </div>
            <div>
              <div class="text-base-content/50 text-xs mb-0.5">Thua</div>
              <div class="font-bold text-error">-{{ normalLadder()!.ruleSet.losePoint }}</div>
            </div>
          </div>
        </div>

        <!-- Tier list -->
        <div class="flex flex-col divide-y divide-base-200">
          <div
            v-for="tier in [...config.tiers].reverse()"
            :key="tier.code"
            class="flex items-center justify-between py-2.5"
          >
            <TierBadge :is-show-label="true" :code="tier.code as TierCode" always-label />
            <span class="text-sm opacity-50">≥ {{ tier.minPoint }} điểm</span>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>
