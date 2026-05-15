<script setup lang="ts">
  defineProps<{
    result: "win" | "lose" | "draw";
  }>();

  const emit = defineEmits<{ confirm: [] }>();

  const META = {
    win: {
      icon: "🏆",
      title: "Chiến thắng!",
      desc: "Bạn đã giành chiến thắng!",
      cls: "text-success",
    },
    lose: { icon: "💀", title: "Thất bại!", desc: "Hãy cố gắng hơn lần sau.", cls: "text-error" },
    draw: { icon: "🤝", title: "Hòa!", desc: "Hai bên ngang tài ngang sức.", cls: "text-warning" },
  };
</script>

<template>
  <div class="modal modal-open">
    <div class="modal-box rounded-none text-center">
      <div class="text-6xl mb-3">{{ META[result].icon }}</div>
      <h3 class="font-bold text-2xl mb-1" :class="META[result].cls">{{ META[result].title }}</h3>
      <p class="text-base-content/60 mb-6">{{ META[result].desc }}</p>
      <button class="btn btn-primary rounded-none w-full" @click="emit('confirm')">OK</button>
    </div>
  </div>
</template>
