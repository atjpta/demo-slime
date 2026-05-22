<script setup lang="ts">
  import { computed } from "vue";
  import { TIER_META, type TierCode } from "@/constants";

  const props = defineProps<{ code: TierCode; isShowLabel?: boolean }>();

  const meta = computed(() => TIER_META[props.code]);
</script>

<template>
  <div v-if="code">
    <span class="inline-flex items-center gap-1 font-semibold" :class="meta.color">
      <span class="size-16 overflow-hidden inline-flex items-center justify-center">
        <img
          :src="meta.img"
          :alt="meta.label"
          class="size-16 object-contain scale-125 animate-pulse mt-2.5"
        />
      </span>
      <span
        :class="isShowLabel !== undefined ? (isShowLabel ? '' : 'hidden') : 'hidden sm:inline'"
        >{{ meta.label }}</span
      >
    </span>
  </div>
</template>
