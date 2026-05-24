<script setup lang="ts">
  import { ref, computed } from "vue";
  import { usePlayerStore, useBattleStore } from "@/stores";
  import { ITEM_META, ITEM_TYPE_META, MAX_ITEM_SLOTS } from "@/constants";

  const props = defineProps<{
    submitted: boolean;
  }>();

  const emit = defineEmits<{
    submit: [itemIndex: number, swapIndex?: number];
    skip: [];
  }>();

  const playerStore = usePlayerStore();
  const battleStore = useBattleStore();

  const myItems = computed(() => battleStore.playerItems[playerStore.myPlayerId] ?? []);
  const isFull = computed(() => myItems.value.length >= MAX_ITEM_SLOTS);

  // Slot được chọn để xóa/thay thế khi túi đầy
  const pendingSwapIndex = ref<number | null>(null);

  const getItemMeta = (code: string) =>
    ITEM_META[code.replace(/-/g, "_")] ?? { icon: "❓", label: code, description: "" };
  const getTypeMeta = (type: string) =>
    ITEM_TYPE_META[type] ?? { label: type, badgeClass: "badge-ghost" };

  const toggleSwapSlot = (slotIndex: number) => {
    pendingSwapIndex.value = pendingSwapIndex.value === slotIndex ? null : slotIndex;
  };

  const pickItem = (itemIndex: number) => {
    if (props.submitted) return;
    if (isFull.value) {
      if (pendingSwapIndex.value === null) return;
      emit("submit", itemIndex, pendingSwapIndex.value);
    } else {
      emit("submit", itemIndex);
    }
    pendingSwapIndex.value = null;
  };

  const canPick = computed(() => !isFull.value || pendingSwapIndex.value !== null);
</script>

<template>
  <div class="modal modal-open items-end sm:items-center">
    <div class="modal-box rounded-none sm:rounded-none w-full max-w-lg flex flex-col gap-4 pb-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <h3 class="font-bold text-lg">Nhận Vật Phẩm</h3>
          <span class="badge badge-neutral font-bold">Wave {{ battleStore.wave }}</span>
        </div>
        <div class="flex items-baseline gap-1">
          <span
            class="countdown font-mono font-extrabold text-xl"
            :class="battleStore.timeLeft <= 5 ? 'text-error animate-pulse' : 'text-warning'"
          >
            <span :style="`--value:${battleStore.timeLeft};`"></span>
          </span>
          <span class="text-xs opacity-40">s</span>
        </div>
      </div>

      <!-- Submitted state -->
      <div v-if="submitted" class="flex items-center justify-center gap-2 py-8 opacity-50">
        <span class="loading loading-dots loading-sm"></span>
        <span class="text-sm">Đang chờ đối thủ...</span>
      </div>

      <template v-else>
        <!-- Hint + skip khi túi đầy -->
        <div v-if="isFull && pendingSwapIndex === null" class="flex items-center justify-between gap-2">
          <p class="text-xs text-warning">
            Túi đầy — bấm <strong>Xóa</strong> một vật phẩm để đổi
          </p>
          <button class="btn btn-xs btn-ghost shrink-0" @click="emit('skip')">Bỏ qua</button>
        </div>
        <p v-else-if="isFull && pendingSwapIndex !== null" class="text-xs text-primary text-center">
          Chọn vật phẩm muốn nhận
        </p>

        <!-- Offered items -->
        <div class="flex flex-col gap-2">
          <span class="text-xs font-semibold opacity-60 uppercase tracking-wide"
            >Vật phẩm có sẵn</span
          >
          <div class="grid grid-cols-3 gap-2">
            <div
              v-for="(item, i) in battleStore.offeredItems"
              :key="i"
              class="flex flex-col items-center gap-1.5 p-3 border-2 border-base-300 bg-base-200"
            >
              <span class="text-2xl">{{ getItemMeta(item.code).icon }}</span>
              <span class="font-bold text-xs text-center leading-tight">
                {{ getItemMeta(item.code).label }}
              </span>
              <span :class="['badge badge-xs', getTypeMeta(item.type).badgeClass]">
                {{ getTypeMeta(item.type).label }}
              </span>
              <span class="text-xs opacity-50 text-center leading-tight hidden sm:block">
                {{ getItemMeta(item.code).description }}
              </span>
              <button
                class="btn btn-xs w-full mt-1"
                :class="canPick ? 'btn-primary' : 'btn-disabled'"
                :disabled="!canPick"
                @click="pickItem(i)"
              >
                Chọn
              </button>
            </div>
          </div>
        </div>

        <div class="divider my-0"></div>

        <!-- My inventory -->
        <div class="flex flex-col gap-2">
          <span class="text-xs font-semibold opacity-60 uppercase tracking-wide">
            Túi đồ của bạn ({{ myItems.length }}/{{ MAX_ITEM_SLOTS }})
          </span>
          <div class="grid grid-cols-3 gap-2">
            <div
              v-for="i in MAX_ITEM_SLOTS"
              :key="i"
              class="flex flex-col items-center gap-1 p-2 border-2 min-h-[5rem] justify-center transition-all"
              :class="[
                myItems[i - 1]
                  ? pendingSwapIndex === i - 1
                    ? 'border-error bg-error/15'
                    : 'border-base-300 bg-base-200'
                  : 'border-base-300/40 bg-base-300/10 border-dashed',
              ]"
            >
              <template v-if="myItems[i - 1]">
                <span class="text-xl leading-none">{{
                  getItemMeta(myItems[i - 1].code).icon
                }}</span>
                <span class="text-xs leading-tight text-center opacity-80">
                  {{ getItemMeta(myItems[i - 1].code).label }}
                </span>
                <button
                  v-if="isFull"
                  class="btn btn-xs mt-1"
                  :class="
                    pendingSwapIndex === i - 1
                      ? 'btn-error'
                      : 'btn-ghost border border-error/50 text-error'
                  "
                  @click="toggleSwapSlot(i - 1)"
                >
                  {{ pendingSwapIndex === i - 1 ? "Hủy" : "Xóa" }}
                </button>
              </template>
              <span v-else class="text-base-content/20 text-sm"></span>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>
