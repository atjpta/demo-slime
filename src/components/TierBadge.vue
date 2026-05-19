<script setup lang="ts">
  import { computed } from "vue";
  import { TIER_META, type TierCode } from "@/constants";

  const props = defineProps<{ code: TierCode; alwaysLabel?: boolean }>();

  const meta = computed(() => TIER_META[props.code]);
</script>

<template>
  <span class="inline-flex items-center gap-1 font-semibold" :class="meta.color">
    <img :src="meta.img" :alt="meta.label" class="size-10 mt-1 object-contain animate-pulse" />
    <span :class="alwaysLabel ? '' : 'hidden sm:inline'">{{ meta.label }}</span>
  </span>
</template>
