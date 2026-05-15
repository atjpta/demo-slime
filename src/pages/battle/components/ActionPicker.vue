<script setup lang="ts">
  import { ref, computed, watch } from "vue";
  import { TURNS_PER_WAVE, SKILL_META } from "@/constants";

  const props = defineProps<{
    skills: any[];
    modelValue: number[];
    submitted: boolean;
  }>();

  const emit = defineEmits<{
    (e: "update:modelValue", v: number[]): void;
    (e: "submit"): void;
  }>();

  // null = empty slot
  const slots = ref<(number | null)[]>(Array(TURNS_PER_WAVE).fill(null));

  const canSubmit = computed(() => slots.value.every((s) => s !== null));

  // Reset slots when wave resets (submitted goes true → false)
  watch(
    () => props.submitted,
    (val) => {
      if (!val) slots.value = Array(TURNS_PER_WAVE).fill(null);
    }
  );

  const getSkill = (orderIndex: number | null) =>
    orderIndex !== null ? props.skills.find((s) => s.orderIndex === orderIndex) : null;

  // Click skill in palette → add to next empty slot
  const addSkill = (orderIndex: number) => {
    const emptyIdx = slots.value.indexOf(null);
    if (emptyIdx === -1) return;
    const next = [...slots.value];
    next[emptyIdx] = orderIndex;
    slots.value = next;
    emit("update:modelValue", next.map((s) => s ?? 0));
  };

  // Click slot → remove
  const removeSlot = (slotIdx: number) => {
    const next = [...slots.value];
    next[slotIdx] = null;
    slots.value = next;
  };

  // Drag & drop between slots
  const dragFromIdx = ref<number | null>(null);
  const dragOverIdx = ref<number | null>(null);

  const onDragStart = (idx: number, e: DragEvent) => {
    dragFromIdx.value = idx;
    e.dataTransfer!.effectAllowed = "move";
  };

  const onDragOver = (idx: number, e: DragEvent) => {
    e.preventDefault();
    dragOverIdx.value = idx;
  };

  const onDrop = (toIdx: number) => {
    if (dragFromIdx.value === null || dragFromIdx.value === toIdx) {
      dragFromIdx.value = null;
      dragOverIdx.value = null;
      return;
    }
    const next = [...slots.value];
    [next[dragFromIdx.value], next[toIdx]] = [next[toIdx], next[dragFromIdx.value]];
    slots.value = next;
    dragFromIdx.value = null;
    dragOverIdx.value = null;
    emit("update:modelValue", next.map((s) => s ?? 0));
  };

  const onDragEnd = () => {
    dragFromIdx.value = null;
    dragOverIdx.value = null;
  };

  const handleSubmit = () => {
    if (!canSubmit.value) return;
    emit("update:modelValue", slots.value as number[]);
    emit("submit");
  };
</script>

<template>
  <div v-if="!submitted" class="card bg-base-100 shadow-md">
    <div class="card-body p-4 gap-4">
      <h3 class="font-bold text-base">Chọn hành động ({{ TURNS_PER_WAVE }} lượt)</h3>

      <!-- Palette: available skills -->
      <div>
        <p class="text-xs opacity-50 mb-2">Kỹ năng</p>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="s in skills"
            :key="s.orderIndex"
            class="btn btn-sm"
            :class="SKILL_META[s.skill.type]?.color"
            :disabled="slots.indexOf(null) === -1"
            @click="addSkill(s.orderIndex)"
          >
            {{ SKILL_META[s.skill.type]?.icon }}
            {{ s.skill.name ?? SKILL_META[s.skill.type]?.label }}
          </button>
        </div>
      </div>

      <!-- Queue: selected slots -->
      <div>
        <p class="text-xs opacity-50 mb-2">Hàng chờ (kéo thả để đổi thứ tự, click để xóa)</p>
        <div class="flex gap-2">
          <div
            v-for="(slot, i) in slots"
            :key="i"
            class="flex-1 min-w-0 h-16 rounded-lg border-2 border-dashed flex items-center justify-center transition-colors"
            :class="
              dragOverIdx === i && dragFromIdx !== i
                ? 'border-primary bg-primary/10'
                : slot !== null
                  ? 'border-transparent'
                  : 'border-base-300'
            "
            @dragover="onDragOver(i, $event)"
            @drop="onDrop(i)"
          >
            <!-- Filled slot -->
            <div
              v-if="slot !== null"
              class="w-full h-full rounded-lg flex flex-col items-center justify-center gap-1 cursor-grab active:cursor-grabbing select-none relative"
              :class="SKILL_META[getSkill(slot)?.skill.type]?.color + ' text-white'"
              draggable="true"
              @dragstart="onDragStart(i, $event)"
              @dragend="onDragEnd"
              @click="removeSlot(i)"
            >
              <span class="text-lg leading-none">{{ SKILL_META[getSkill(slot)?.skill.type]?.icon }}</span>
              <span class="text-xs font-semibold leading-none">
                {{ getSkill(slot)?.skill.name ?? SKILL_META[getSkill(slot)?.skill.type]?.label }}
              </span>
              <span class="absolute top-1 right-1 text-[10px] opacity-60">{{ i + 1 }}</span>
            </div>

            <!-- Empty slot -->
            <span v-else class="text-xs opacity-30">{{ i + 1 }}</span>
          </div>
        </div>
      </div>

      <button class="btn btn-primary mt-1" :disabled="!canSubmit" @click="handleSubmit">
        ✅ Xác nhận hành động
      </button>
    </div>
  </div>

  <div v-else class="alert alert-success shadow">✅ Đã gửi hành động, chờ đối thủ...</div>
</template>
