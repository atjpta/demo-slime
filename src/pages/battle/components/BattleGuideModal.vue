<script setup lang="ts">
  import { ref, onMounted } from "vue";
  import { battleItemService } from "@/client";
  import type { BattleItemData } from "@/client";
  import { ITEM_META, ITEM_TYPE_META } from "@/constants";

  const emit = defineEmits<{ close: [] }>();

  const items = ref<BattleItemData[]>([]);
  const itemsLoading = ref(true);

  const getItemMeta = (code: string) =>
    ITEM_META[code.replace(/-/g, "_")] ?? { icon: "❓", label: code, description: "" };
  const getTypeMeta = (type: string) =>
    ITEM_TYPE_META[type] ?? { label: type, badgeClass: "badge-ghost" };

  onMounted(async () => {
    try {
      const all = await battleItemService.getAll();
      items.value = all.filter((i) => i.status === "active");
    } finally {
      itemsLoading.value = false;
    }
  });
</script>

<template>
  <div class="modal modal-open items-center" @click.self="emit('close')">
    <div
      class="modal-box rounded-none sm:rounded-none w-full max-w-lg overflow-y-auto flex flex-col px-0"
    >
      <div class="flex items-center justify-between px-6">
        <h3 class="font-bold text-xl">Hướng dẫn chiến đấu</h3>
        <button class="btn btn-ghost btn-sm btn-circle" @click="emit('close')">✕</button>
      </div>

      <div
        class="sm:max-h-[90vh] max-h-[60dvh] modal-box rounded-none sm:rounded-none w-full max-w-lg overflow-y-auto flex flex-col gap-5"
      >
        <!-- Overview -->
        <section class="flex flex-col gap-1.5">
          <h4 class="font-semibold text-sm opacity-60 uppercase tracking-wide">Tổng quan</h4>
          <p class="text-sm leading-relaxed">
            Mỗi <strong>wave</strong>, bạn chọn <strong>5 hành động</strong> theo thứ tự. Hai bên
            thực hiện đồng thời — hành động nào counter được đối thủ sẽ gây sát thương. Người cạn HP
            trước thì thua.
          </p>
        </section>

        <!-- Skills -->
        <section class="flex flex-col gap-2">
          <h4 class="font-semibold text-sm opacity-60 uppercase tracking-wide">3 kỹ năng</h4>
          <div class="grid grid-cols-3 gap-2">
            <div class="flex flex-col items-center gap-1 p-3 bg-error/10 border border-error/20">
              <span class="text-2xl">⚔️</span>
              <span class="font-bold sm:text-sm text-xs">Tấn Công</span>
            </div>
            <div class="flex flex-col items-center gap-1 p-3 bg-info/10 border border-info/20">
              <span class="text-2xl">✨</span>
              <span class="font-bold sm:text-sm text-xs">Phép Thuật</span>
            </div>
            <div
              class="flex flex-col items-center gap-1 p-3 bg-success/10 border border-success/20"
            >
              <span class="text-2xl">🛡️</span>
              <span class="font-bold sm:text-sm text-xs">Phòng Thủ</span>
            </div>
          </div>
        </section>

        <!-- Counter chart -->
        <section class="flex flex-col gap-2">
          <h4 class="font-semibold text-sm opacity-60 uppercase tracking-wide">Bảng counter</h4>
          <div class="flex flex-col gap-1.5 text-sm">
            <div
              class="flex items-center gap-2 p-2 bg-success/10 border-l-2 border-success justify-between"
            >
              <span class="w-1/3">🛡️ Phòng Thủ</span>
              <div class="w-1/3 text-center">
                <span class="badge badge-success badge-sm">🔄Parry</span>
              </div>
              <span class="w-1/3">⚔️ Tấn Công</span>
            </div>
            <div class="flex items-center gap-2 p-2 bg-success/10 border-l-2 border-success">
              <span class="w-1/3">⚔️ Tấn Công</span>
              <div class="w-1/3 text-center">
                <span class="badge badge-success badge-sm">⚡Interrupt</span>
              </div>
              <span class="w-1/3">✨ Phép Thuật</span>
            </div>
            <div class="flex items-center gap-2 p-2 bg-success/10 border-l-2 border-success">
              <span class="w-1/3">✨ Phép Thuật</span>
              <div class="w-1/3 text-center">
                <span class="badge badge-success badge-sm">💥Break</span>
              </div>
              <span class="w-1/3">🛡️ Phòng Thủ</span>
            </div>
            <p class="text-xs opacity-50 mt-1">
              Nếu hai bên dùng cùng kỹ năng hoặc không counter nhau → cả hai gây sát thương bình
              thường.
            </p>
          </div>
        </section>

        <!-- How to pick -->
        <section class="flex flex-col gap-1.5">
          <h4 class="font-semibold text-sm opacity-60 uppercase tracking-wide">
            Cách chọn hành động
          </h4>
          <ul class="text-sm flex flex-col gap-1 list-none">
            <li class="flex gap-2">
              <span class="opacity-40">1.</span> Bấm vào kỹ năng để thêm vào hàng đợi.
            </li>
            <li class="flex gap-2">
              <span class="opacity-40">2.</span> Kéo thả để hoán đổi vị trí trong hàng đợi.
            </li>
            <li class="flex gap-2">
              <span class="opacity-40">3.</span> Bấm vào ô trong hàng đợi để xóa hành động đó.
            </li>
            <li class="flex gap-2">
              <span class="opacity-40">4.</span> Điền đủ 5 ô rồi bấm <strong>Xác nhận</strong>.
            </li>
          </ul>
        </section>

        <!-- Items -->
        <section class="flex flex-col gap-2">
          <h4 class="font-semibold text-sm opacity-60 uppercase tracking-wide">Vật phẩm</h4>
          <p class="text-sm leading-relaxed">
            Trước mỗi wave chẵn (2, 4, 6,...) bạn được chọn <strong>1 trong 3</strong> vật phẩm ngẫu
            nhiên. Túi đồ chứa tối đa <strong>3 vật phẩm</strong>. Vật phẩm được dùng tự động hoặc
            theo lượt tùy loại.
          </p>

          <!-- Loading -->
          <div v-if="itemsLoading" class="flex justify-center py-4">
            <span class="loading loading-spinner loading-sm"></span>
          </div>

          <!-- Item list -->
          <div v-else class="flex flex-col gap-2">
            <div
              v-for="item in items"
              :key="item.code"
              class="flex items-start gap-3 p-3 bg-base-200 border border-base-300"
            >
              <span class="text-2xl leading-none shrink-0">{{ getItemMeta(item.code).icon }}</span>
              <div class="flex flex-col gap-0.5 min-w-0">
                <div class="flex items-center gap-1.5 flex-wrap">
                  <span class="font-bold text-sm">{{ getItemMeta(item.code).label }}</span>
                  <span :class="['badge badge-xs', getTypeMeta(item.type).badgeClass]">
                    {{ getTypeMeta(item.type).label }}
                  </span>
                </div>
                <span class="text-xs opacity-60 leading-snug">
                  {{ getItemMeta(item.code).description || item.note }}
                </span>
              </div>
            </div>
          </div>
        </section>

        <button class="btn btn-primary rounded-none w-full mt-1" @click="emit('close')">
          Đã hiểu!
        </button>
      </div>
    </div>
  </div>
</template>
