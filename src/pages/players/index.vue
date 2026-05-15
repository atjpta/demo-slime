<script setup lang="ts">
  import { ref, onMounted } from "vue";
  import { toast } from "vue-sonner";
  import { useBattleStore } from "@/store";
  import { http } from "@/api";
  import { Phase } from "@/constants";
  import type { BattleState } from "@/schemas";
  import CreatePlayerForm from "./components/CreatePlayerForm.vue";
  import PlayerItem from "./components/PlayerItem.vue";

  const store = useBattleStore();
  const players = ref<any[]>([]);

  const loadPlayers = async () => {
    players.value = await http("GET", "/players", undefined, store.userToken);
  };

  const createPlayer = async (name: string) => {
    store.loading = true;
    try {
      await http("POST", "/players", { name }, store.userToken);
      await loadPlayers();
      toast.success(`Tạo nhân vật "${name}" thành công`);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      store.loading = false;
    }
  };

  const selectPlayer = async (id: string) => {
    store.loading = true;
    try {
      const data = await http("POST", `/players/select-player/${id}`, undefined, store.userToken);
      store.playerToken = data.token;
      store.myPlayer = await http("GET", "/players/me", undefined, store.playerToken);
      store.myPlayerId = store.myPlayer._id;
      await joinQueue();
    } catch (e: any) {
      console.log(e);
      toast.error(e.message);
    } finally {
      store.loading = false;
    }
  };

  const joinQueue = async () => {
    store.step = "queue";
    store.client.auth.token = store.playerToken;
    store.rooms.queue = await store.client.joinOrCreate("queue", {
      token: store.playerToken,
    });
    const queue = store.rooms.queue;
    queue.onMessage("clients", (count) => {
      console.log("Players in your group:", count);
    });

    queue.onMessage("seat", async (reservation) => {
      // Optionally confirm the reservation to the queue
      queue.send("confirm");

      // Join the match room with the reservation
      store.rooms.battle = await store.client.consumeSeatReservation(reservation);
      console.log("Joined match", store.rooms.battle.roomId);
      setupBattle();
      store.step = "battle";
    });

    store.rooms.queue.onLeave((code: number) => {
      console.log("[queue] onLeave code:", code);
    });

    store.rooms.queue.onError((_code: number, msg: string) => {
      console.error("[queue] onError:", _code, msg);
      toast.error(`Queue: ${msg}`);
      store.step = "players";
    });
  };

  const setupBattle = () => {
    if (!store.rooms.battle) return;
    store.rooms.battle.onStateChange((state: BattleState) => {
      store.battleState = state;
    });
    store.rooms.battle.onLeave(() => {
      store.step = "players";
    });
    store.rooms.battle.onError((_: number, msg: string) => toast.error(`Battle: ${msg}`));
  };

  onMounted(loadPlayers);
</script>

<template>
  <div class="container mx-auto max-w-lg p-6">
    <h2 class="text-2xl font-bold mb-4">Chọn nhân vật</h2>
    <CreatePlayerForm :loading="store.loading" :on-submit="createPlayer" />
    <div v-if="players.items?.length === 0" class="text-center opacity-50 py-8">
      Chưa có nhân vật nào, vui lòng tạo mới
    </div>
    <div class="flex flex-col gap-3">
      <PlayerItem
        v-for="p in players.items"
        :key="p._id"
        :player="p"
        :loading="store.loading"
        @select="selectPlayer"
      />
    </div>
  </div>
</template>
