<script setup lang="ts">
  import { ref, computed, onMounted, onUnmounted } from "vue";
  import { toast } from "vue-sonner";
  import { useBattleStore } from "@/store";
  import { Phase, TURNS_PER_WAVE } from "@/constants";
  import type { BattleState } from "@/schemas";
  import StatusBar from "./components/StatusBar.vue";
  import PlayerCard from "./components/PlayerCard.vue";
  import ActionPicker from "./components/ActionPicker.vue";
  import TurnLogPanel from "./components/TurnLogPanel.vue";

  const store = useBattleStore();

  const selectedActions = ref<number[]>(Array(TURNS_PER_WAVE).fill(0));
  const actionsSubmitted = ref(false);

  const mySkills = computed(() =>
    [...(store.myPlayer?.skills ?? [])].sort((a: any, b: any) => a.orderIndex - b.orderIndex)
  );

  // Plain refs extracted từ Colyseus Schema để Vue reactive track được
  const playerIds = ref<string[]>([]);
  const lastLog = ref<any>(null);

  const opponentId = computed(() => playerIds.value.find((id) => id !== store.myPlayerId) ?? null);

  const getStats = (playerId: string) => {
    if (lastLog.value) return lastLog.value.players.get(playerId)?.stats ?? null;
    if (playerId === store.myPlayerId) return store.myPlayer?.stats ?? null;
    return null;
  };

  const submitActions = () => {
    store.rooms.battle?.send("submit_actions_battle", selectedActions.value);
    actionsSubmitted.value = true;
    toast.success("Đã gửi hành động!");
  };

  onMounted(() => {
    if (!store.rooms.battle) return;
    store.rooms.battle.onStateChange((state: BattleState) => {
      store.battleState = state;
      // Extract ra plain data để Vue track được thay đổi bên trong Colyseus Schema
      playerIds.value = [...state.players.keys()];
      const logs = state.logs;
      lastLog.value = logs.length ? logs[logs.length - 1] : null;

      if (state.phase === Phase.SELECTING) {
        actionsSubmitted.value = false;
        selectedActions.value = Array(TURNS_PER_WAVE).fill(0);
      }
      if (state.phase === Phase.ENDED) {
        const won = state.winner === store.myPlayerId;
        if (state.winner === "draw") toast.info("🤝 Hòa!");
        else if (won) toast.success("🏆 Bạn thắng!");
        else toast.error("💀 Bạn thua!");
      }
    });
  });

  onUnmounted(() => {
    store.battleState = null;
    playerIds.value = [];
    lastLog.value = null;
  });
</script>

<template>
  <div v-if="store.battleState" class="container mx-auto max-w-3xl p-4 flex flex-col gap-4">
    <StatusBar />

    <div class="grid grid-cols-2 gap-4">
      <PlayerCard
        label="Bạn"
        variant="primary"
        :name="store.myPlayer?.name"
        :stats="getStats(store.myPlayerId)"
      />
      <PlayerCard
        label="Đối thủ"
        variant="error"
        :stats="opponentId ? getStats(opponentId) : null"
      />
    </div>

    <ActionPicker
      v-if="store.battleState.phase === Phase.SELECTING"
      v-model="selectedActions"
      :skills="mySkills"
      :submitted="actionsSubmitted"
      @submit="submitActions"
    />

    <TurnLogPanel />
  </div>

  <div v-else class="flex justify-center items-center h-80">
    <span class="loading loading-spinner loading-lg"></span>
  </div>
</template>
