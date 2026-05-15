<script setup lang="ts">
  import { ref, onMounted } from "vue";
  import { useRouter } from "vue-router";
  import { toast } from "vue-sonner";
  import { useAuthStore, usePlayerStore } from "@/stores";
  import { playerService } from "@/client";
  import CreatePlayerForm from "./components/CreatePlayerForm.vue";
  import PlayerItem from "./components/PlayerItem.vue";

  const router = useRouter();
  const authStore = useAuthStore();
  const playerStore = usePlayerStore();
  const players = ref<any[]>([]);

  const loadPlayers = async () => {
    playerService.setToken(authStore.userToken);
    players.value = await playerService.list();
  };

  const createPlayer = async (name: string) => {
    authStore.loading = true;
    try {
      await playerService.create(name);
      await loadPlayers();
      toast.success(`Tạo nhân vật "${name}" thành công`);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      authStore.loading = false;
    }
  };

  const selectPlayer = async (id: string) => {
    authStore.loading = true;
    try {
      const data = await playerService.select(id);
      playerStore.playerToken = data.token;
      playerService.setToken(data.token);
      playerStore.myPlayer = await playerService.me();
      playerStore.myPlayerId = playerStore.myPlayer._id;
      router.push("/lobby");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      authStore.loading = false;
    }
  };

  onMounted(loadPlayers);
</script>

<template>
  <div class="container mx-auto max-w-lg p-6">
    <h2 class="text-2xl font-bold mb-4">Chọn nhân vật</h2>
    <CreatePlayerForm :loading="authStore.loading" :on-submit="createPlayer" />
    <div v-if="players.length === 0" class="text-center opacity-50 py-8">
      Chưa có nhân vật nào, vui lòng tạo mới
    </div>
    <div class="flex flex-col gap-3">
      <PlayerItem
        v-for="p in players"
        :key="p._id"
        :player="p"
        :loading="authStore.loading"
        @select="selectPlayer"
      />
    </div>
  </div>
</template>
