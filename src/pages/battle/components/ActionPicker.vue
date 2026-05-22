<script setup lang="ts">
  import { ref, computed, watch } from "vue";
  import { VueDraggable } from "vue-draggable-plus";
  import { TURNS_PER_WAVE, SKILL_META } from "@/constants";

  const props = defineProps<{
    skills: { code: string; type: string }[];
    modelValue: number[];
    submitted: boolean;
  }>();

  const emit = defineEmits<{
    (e: "update:modelValue", v: number[]): void;
    (e: "submit"): void;
  }>();

  const slots = ref<(number | null)[]>(Array(TURNS_PER_WAVE).fill(null));

  const canSubmit = computed(() => slots.value.every((s) => s !== null));

  watch(
    () => props.submitted,
    (val) => {
      if (!val) slots.value = Array(TURNS_PER_WAVE).fill(null);
    }
  );

  const addSkill = (orderIndex: number) => {
    const emptyIdx = slots.value.indexOf(null);
    if (emptyIdx === -1) return;
    const next = [...slots.value];
    next[emptyIdx] = orderIndex;
    slots.value = next;
    emit("update:modelValue", next.map((s) => s ?? 0));
  };

  const removeSlot = (slotIdx: number) => {
    const next = [...slots.value];
    next[slotIdx] = null;
    slots.value = next;
  };

  const onSortEnd = () => {
    emit("update:modelValue", slots.value.map((s) => s ?? 0));
  };

  const handleSubmit = () => {
    if (!canSubmit.value) return;
    emit("update:modelValue", slots.value as number[]);
    emit("submit");
  };
</script>

<template>
  <!-- Submitted state -->
  <div
    v-if="submitted"
    v-motion
    :initial="{ opacity: 0 }"
    :enter="{ opacity: 0.6, transition: { duration: 300 } }"
    class="flex items-center justify-center gap-2 py-3"
  >
    <span class="loading loading-dots loading-sm"></span>
    <span class="text-sm">Đã gửi, chờ đối thủ...</span>
  </div>

  <div
    v-else
    v-motion
    :initial="{ opacity: 0, y: 16 }"
    :enter="{ opacity: 1, y: 0, transition: { duration: 350 } }"
    class="flex flex-col gap-3"
  >
    <!-- Skill palette -->
    <div class="flex gap-2 justify-center">
      <button
        v-for="(s, i) in skills"
        :key="i"
        class="btn btn-sm rounded-none flex-1 gap-1.5"
        :class="SKILL_META[s.code]?.color"
        :disabled="slots.indexOf(null) === -1"
        @click="addSkill(i)"
      >
        <span>{{ SKILL_META[s.code]?.icon }}</span>
        <span class="hidden sm:inline">{{ SKILL_META[s.code]?.label }}</span>
      </button>
    </div>

    <!-- Slot queue -->
    <VueDraggable
      v-model="slots"
      class="flex gap-1.5"
      :animation="180"
      filter=".slot-empty"
      :prevent-on-filter="false"
      :delay="150"
      :delay-on-touch-only="true"
      @end="onSortEnd"
    >
      <div
        v-for="(slot, i) in slots"
        :key="i"
        class="flex-1 h-14 border-2 border-dashed flex items-center justify-center transition-colors duration-150"
        :class="
          slot !== null ? 'border-transparent' : 'border-base-300 opacity-50 slot-empty'
        "
      >
        <!-- Filled -->
        <div
          v-if="slot !== null"
          class="w-full h-full flex flex-col items-center justify-center gap-0.5 cursor-grab active:cursor-grabbing select-none relative"
          :class="SKILL_META[skills[slot]?.code]?.color + ' text-white'"
          @click="removeSlot(i)"
        >
          <span class="text-base leading-none">{{ SKILL_META[skills[slot]?.code]?.icon }}</span>
          <span class="text-[10px] font-bold leading-none opacity-90">
            {{ SKILL_META[skills[slot]?.code]?.label }}
          </span>
          <span class="absolute top-0.5 right-1 text-[9px] opacity-50">{{ i + 1 }}</span>
        </div>

        <!-- Empty -->
        <span v-else class="text-sm font-bold opacity-20">{{ i + 1 }}</span>
      </div>
    </VueDraggable>

    <!-- Submit -->
    <button
      class="btn btn-primary btn-sm rounded-none w-full"
      :disabled="!canSubmit"
      @click="handleSubmit"
    >
      Xác nhận
    </button>
  </div>
</template>
