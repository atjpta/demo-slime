<script setup lang="ts">
  defineProps<{
    label: string;
    name?: string;
    stats?: { hp: number; attack: number; magic: number; defense: number } | null;
    variant: "primary" | "error";
  }>();
</script>

<template>
  <div class="card bg-base-100 shadow-md" :class="`border-2 border-${variant}`">
    <div class="card-body p-4 gap-2">
      <div class="flex items-center gap-2">
        <span class="badge" :class="`badge-${variant}`">{{ label }}</span>
        <span v-if="name" class="font-bold">{{ name }}</span>
      </div>
      <div v-if="stats" class="flex flex-col gap-1 text-sm">
        <div class="flex justify-between">
          <span>❤️ HP</span>
          <span class="font-mono font-bold">{{ stats.hp }}</span>
        </div>
        <div class="flex justify-between opacity-70">
          <span>⚔️ ATK</span><span class="font-mono">{{ stats.attack }}</span>
        </div>
        <div class="flex justify-between opacity-70">
          <span>✨ MAG</span><span class="font-mono">{{ stats.magic }}</span>
        </div>
        <div class="flex justify-between opacity-70">
          <span>🛡️ DEF</span><span class="font-mono">{{ stats.defense }}</span>
        </div>
      </div>
      <div v-else class="text-sm opacity-40">Chờ...</div>
    </div>
  </div>
</template>
