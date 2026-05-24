<script setup lang="ts">
  import { ref, computed } from "vue";
  import { usePlayerStore, useBattleStore } from "@/stores";
  import { ITEM_META, ITEM_TYPE_META, MAX_ITEM_SLOTS, TURNS_PER_WAVE } from "@/constants";

  const props = defineProps<{
    opponentId: string | null;
    interactive?: boolean;
    selectedSlot?: number | null;
    selectedApplyTurn?: number | null;
  }>();

  const emit = defineEmits<{
    select: [slot: number | null];
    selectApplyTurn: [turn: number | null];
    detail: [item: { code: string; type: string }];
  }>();

  const playerStore = usePlayerStore();
  const battleStore = useBattleStore();

  const showGuide = ref(false);

  const myItems = computed(() => battleStore.playerItems[playerStore.myPlayerId] ?? []);
  const opponentItems = computed(
    () => (props.opponentId ? battleStore.playerItems[props.opponentId] : null) ?? []
  );

  const normalizeCode = (code: string) => code.replace(/-/g, "_");

  const getItemMeta = (code: string) =>
    ITEM_META[normalizeCode(code)] ?? { icon: "❓", label: code, description: "" };

  const hasAnyItem = computed(() => myItems.value.length > 0 || opponentItems.value.length > 0);

  const allItemEntries = computed(() =>
    battleStore.battleItemsData.map((item) => {
      const code = normalizeCode(item.code);
      const meta = ITEM_META[code] ?? { icon: "❓", label: item.code, description: "" };
      return { code, icon: meta.icon, label: meta.label, note: item.note, typeMeta: ITEM_TYPE_META[item.type.toUpperCase()] ?? null };
    })
  );

  const selectedItem = computed(() =>
    props.selectedSlot !== null && props.selectedSlot !== undefined
      ? (myItems.value[props.selectedSlot] ?? null)
      : null
  );

  const needsTurnPick = computed(
    () =>
      selectedItem.value !== null && (ITEM_META[normalizeCode(selectedItem.value.code)]?.needsTurnPick ?? false)
  );

  const handleMyItemClick = (slotIdx: number) => {
    const item = myItems.value[slotIdx];
    if (!item) return;
    if (props.interactive) {
      if (props.selectedSlot === slotIdx) {
        emit("select", null);
        emit("selectApplyTurn", null);
      } else {
        emit("select", slotIdx);
        const defaultTurn = ITEM_META[normalizeCode(item.code)]?.needsTurnPick ? 0 : null;
        emit("selectApplyTurn", defaultTurn);
      }
    } else {
      emit("detail", item);
    }
  };

  const toggleApplyTurn = (turnIdx: number) => {
    emit("selectApplyTurn", props.selectedApplyTurn === turnIdx ? null : turnIdx);
  };
</script>

<template>
  <div v-if="hasAnyItem" class="flex flex-col gap-2">
    <div class="grid grid-cols-2 gap-2">
      <!-- My items -->
      <div class="flex flex-col gap-1">
        <div class="flex items-center gap-1">
          <span class="text-xs font-semibold text-primary opacity-70 uppercase tracking-wide">
            Vật phẩm
          </span>
          <button
            class="btn btn-ghost btn-xs px-1 min-h-0 h-4 opacity-50 hover:opacity-100"
            @click="showGuide = true"
          >
            <span class="text-[10px]">ℹ️</span>
          </button>
          <span
            v-if="interactive && selectedSlot !== null"
            class="text-[10px] text-primary font-semibold ml-auto"
          >
            Sẽ dùng lượt này
          </span>
        </div>
        <div class="flex gap-1.5">
          <div
            v-for="i in MAX_ITEM_SLOTS"
            :key="i"
            class="relative flex items-center justify-center border text-sm w-10 h-10 transition-all duration-150"
            :class="[
              myItems[i - 1]
                ? [
                    interactive ? 'cursor-pointer' : 'cursor-default',
                    interactive && selectedSlot === i - 1
                      ? 'bg-primary/15 border-primary ring-1 ring-primary/40'
                      : interactive
                        ? 'bg-base-200 border-base-300 hover:border-primary/50 hover:bg-primary/5'
                        : 'bg-base-200 border-base-300',
                  ]
                : 'bg-base-300/20 border-dashed border-base-300 opacity-30',
            ]"
            @click="handleMyItemClick(i - 1)"
          >
            <template v-if="myItems[i - 1]">
              <span class="text-lg leading-none">{{ getItemMeta(myItems[i - 1].code).icon }}</span>
              <div
                v-if="interactive && selectedSlot === i - 1"
                class="absolute -top-1.5 -right-1.5 w-4 h-4 bg-primary rounded-full flex items-center justify-center"
              >
                <span class="text-primary-content text-[8px] font-black leading-none">✓</span>
              </div>
            </template>
            <span v-else class="text-base-content/20 text-xs">—</span>
          </div>
        </div>
      </div>

      <!-- Opponent items -->
      <div class="flex flex-col gap-1">
        <span class="text-xs font-semibold text-error opacity-70 uppercase tracking-wide">
          Vật phẩm đối thủ
        </span>
        <div class="flex gap-1.5">
          <div
            v-for="i in MAX_ITEM_SLOTS"
            :key="i"
            class="flex items-center justify-center border border-base-300 text-sm w-10 h-10 transition-all duration-150"
            :class="
              opponentItems[i - 1]
                ? 'bg-base-200 cursor-pointer hover:bg-base-300/50'
                : 'bg-base-300/20 border-dashed opacity-30'
            "
            @click="opponentItems[i - 1] ? emit('detail', opponentItems[i - 1]) : undefined"
          >
            <template v-if="opponentItems[i - 1]">
              <span class="text-lg leading-none">{{
                getItemMeta(opponentItems[i - 1].code).icon
              }}</span>
            </template>
            <span v-else class="text-base-content/20 text-xs">—</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Turn picker for needsTurnPick items -->
    <Transition name="turn-pick">
      <div v-if="interactive && needsTurnPick" class="flex flex-col gap-1">
        <div class="flex items-center gap-2">
          <span class="text-[10px] font-semibold opacity-60 uppercase tracking-wide">
            💢 Chọn lượt buff sát thương
          </span>
          <span v-if="selectedApplyTurn !== null" class="text-[10px] text-primary font-semibold">
            → Lượt {{ (selectedApplyTurn ?? 0) + 1 }}
          </span>
        </div>
        <div class="flex gap-1.5">
          <button
            v-for="t in TURNS_PER_WAVE"
            :key="t"
            class="flex-1 h-8 btn btn-xs font-bold transition-all"
            :class="
              selectedApplyTurn === t - 1
                ? 'btn-primary'
                : 'btn-ghost border border-base-300 hover:border-primary/60'
            "
            @click="toggleApplyTurn(t - 1)"
          >
            {{ t }}
          </button>
        </div>
      </div>
    </Transition>
  </div>

  <!-- Item guide modal -->
  <div
    v-if="showGuide"
    class="modal modal-open items-end sm:items-center"
    @click.self="showGuide = false"
  >
    <div class="modal-box rounded-none sm:rounded-lg w-full max-w-sm flex flex-col gap-3 pb-5">
      <div class="flex items-center justify-between">
        <h3 class="font-bold text-base">Danh sách vật phẩm</h3>
        <button class="btn btn-ghost btn-xs" @click="showGuide = false">✕</button>
      </div>
      <div class="flex flex-col gap-2 overflow-y-auto max-h-[60vh]">
        <div
          v-for="item in allItemEntries"
          :key="item.code"
          class="flex items-center gap-2.5 p-2 bg-base-200 rounded"
        >
          <span class="text-xl leading-none mt-0.5 shrink-0">{{ item.icon }}</span>
          <div class="flex flex-col gap-0.5 min-w-0">
            <div class="flex items-center gap-1.5 flex-wrap">
              <span class="text-xs font-bold leading-tight">{{ item.label }}</span>
              <span v-if="item.typeMeta" :class="['badge badge-xs', item.typeMeta.badgeClass]">
                {{ item.typeMeta.label }}
              </span>
            </div>
            <span class="text-[11px] opacity-60 leading-snug">{{ item.note }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
  .turn-pick-enter-active {
    transition: all 0.2s cubic-bezier(0.22, 1, 0.36, 1);
  }
  .turn-pick-leave-active {
    transition: all 0.15s ease-in;
  }
  .turn-pick-enter-from,
  .turn-pick-leave-to {
    opacity: 0;
    transform: translateY(-6px);
  }
</style>
