<script setup lang="ts">
  defineProps<{ player: any; loading: boolean }>();
  defineEmits<{ (e: "select", id: string): void }>();
</script>

<template>
  <div
    class="card bg-base-100 shadow cursor-pointer hover:bg-base-300 transition"
    @click="$emit('select', player._id)"
  >
    <div class="card-body flex-row items-center justify-between py-3 px-4">
      <div>
        <p class="font-semibold">{{ player.name }}</p>
        <p class="text-xs opacity-50 capitalize">{{ player.role }} · {{ player.status }}</p>
      </div>
      <button class="btn btn-primary btn-sm" :class="{ loading }">Chọn →</button>
    </div>
  </div>
</template>
