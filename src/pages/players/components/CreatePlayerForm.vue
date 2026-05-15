<script setup lang="ts">
  import { ref } from "vue";

  const emit = defineEmits<{ (e: "created"): void }>();

  const props = defineProps<{ loading: boolean; onSubmit: (name: string) => Promise<void> }>();

  const name = ref("");

  const submit = async () => {
    if (!name.value.trim()) return;
    await props.onSubmit(name.value.trim());
    name.value = "";
  };
</script>

<template>
  <div class="flex gap-2 mb-6">
    <input
      v-model="name"
      placeholder="Tên nhân vật mới"
      class="input input-bordered flex-1"
      @keyup.enter="submit"
    />
    <button class="btn btn-secondary" :class="{ loading }" @click="submit">Tạo</button>
  </div>
</template>
