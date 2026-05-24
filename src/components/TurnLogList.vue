<script setup lang="ts">
  export interface LogRow {
    wave: number;
    turn: number;
    myHp: number | string;
    myDamage: number;
    myHeal: number;
    mySkillIcon: string;
    myItemIcon?: string;
    oppHp: number | string;
    oppDamage: number;
    oppHeal: number;
    oppSkillIcon: string;
    oppItemIcon?: string;
    counter: { icon: string; label: string; color: string } | null;
    effectNote?: string;
    myActionsAffected?: { before: string[]; after: string[] };
    oppActionsAffected?: { before: string[]; after: string[] };
    isActive?: boolean;
  }

  export interface ItemEntry {
    code: string;
    icon: string;
    label: string;
  }

  export interface LogGroupItemWave {
    myPicked?: ItemEntry;
    myInventory: ItemEntry[];
    oppPicked?: ItemEntry;
    oppInventory: ItemEntry[];
  }

  export interface LogGroup {
    wave: number;
    logs: LogRow[];
    itemWaveLog?: LogGroupItemWave;
  }

  defineProps<{ groups: LogGroup[] }>();
</script>

<template>
  <div v-if="groups.length" class="bg-base-100 shadow-md rounded-none">
    <div class="p-3 gap-2 flex flex-col">
      <TransitionGroup name="wave-group" tag="div" class="flex flex-col gap-3">
        <div v-for="group in groups" :key="group.wave">
          <div class="flex items-center gap-2 mb-1.5">
            <div class="flex-1 h-px bg-base-300"></div>
            <span class="text-[10px] font-bold opacity-40 uppercase tracking-widest"
              >Wave {{ group.wave }}</span
            >
            <div class="flex-1 h-px bg-base-300"></div>
          </div>

          <!-- Item pick per wave -->
          <div
            v-if="group.itemWaveLog"
            class="flex items-center gap-2 text-[11px] mb-1.5 px-1"
          >
            <div class="flex-1 text-right">
              <span v-if="group.itemWaveLog.myPicked" class="font-semibold text-warning">
                {{ group.itemWaveLog.myPicked.icon }} {{ group.itemWaveLog.myPicked.label }}
              </span>
              <span v-else class="opacity-25 italic">bỏ qua</span>
            </div>
            <span class="opacity-30 shrink-0">🎁</span>
            <div class="flex-1 text-left">
              <span v-if="group.itemWaveLog.oppPicked" class="font-semibold text-warning">
                {{ group.itemWaveLog.oppPicked.icon }} {{ group.itemWaveLog.oppPicked.label }}
              </span>
              <span v-else class="opacity-25 italic">bỏ qua</span>
            </div>
          </div>

          <TransitionGroup name="log-entry" tag="div" class="flex flex-col gap-1.5">
            <div
              v-for="log in group.logs"
              :key="`${log.wave}-${log.turn}`"
              class="flex flex-col px-3 py-2 text-xs transition-colors gap-1"
              :class="log.isActive ? 'bg-primary/15 ring-1 ring-primary/30' : 'bg-base-200'"
            >
              <!-- Main row -->
              <div class="flex items-start">
                <!-- Me: HP · effect · icon · actionsAffected → right-aligned -->
                <div class="flex flex-col items-end gap-1 w-2/5">
                  <div class="flex items-center justify-end gap-2 tabular-nums w-full">
                    <span class="font-bold text-primary w-10 text-left">{{ log.myHp }}</span>
                    <span v-if="log.myHeal > 0" class="text-success font-semibold w-12 text-center">
                      +{{ log.myHeal }}❤️
                    </span>
                    <span v-else-if="log.myDamage > 0" class="text-error font-semibold w-12 text-center">
                      -{{ log.myDamage }}❤️
                    </span>
                    <span v-else class="opacity-25 w-12 text-center">❤️</span>
                    <div class="flex flex-col">
                      <span>{{ log.mySkillIcon }}</span>
                      <span>{{ log.myItemIcon }}</span>
                    </div>
                  </div>
                  <div v-if="log.myActionsAffected" class="flex flex-col items-end gap-0.5">
                    <div class="flex gap-0.5 opacity-30 text-[11px] leading-none">
                      <span v-for="(icon, i) in log.myActionsAffected.before" :key="i">{{ icon }}</span>
                    </div>
                    <div class="flex gap-0.5 text-[11px] leading-none">
                      <span v-for="(icon, i) in log.myActionsAffected.after" :key="i">{{ icon }}</span>
                    </div>
                  </div>
                </div>

                <!-- Center: counter -->
                <div class="flex justify-center w-full pt-0.5">
                  <span
                    v-if="log.counter"
                    class="badge badge-xs font-bold w-fit py-2 justify-center text-[8px]"
                    :class="log.counter.color"
                    >{{ log.counter.icon }}{{ log.counter.label }}</span
                  >
                  <span v-else class="opacity-20">⚔️</span>
                </div>

                <!-- Opponent: icon · effect · HP · actionsAffected → left-aligned -->
                <div class="flex flex-col items-start gap-1 w-2/5">
                  <div class="flex items-center gap-2 tabular-nums w-full">
                    <div class="flex flex-col">
                      <span>{{ log.oppSkillIcon }}</span>
                      <span>{{ log.oppItemIcon }}</span>
                    </div>
                    <span v-if="log.oppHeal > 0" class="text-success font-semibold w-12 text-center">
                      +{{ log.oppHeal }}❤️
                    </span>
                    <span v-else-if="log.oppDamage > 0" class="text-error font-semibold w-12 text-center">
                      -{{ log.oppDamage }}❤️
                    </span>
                    <span v-else class="opacity-25 w-12 text-center">❤️</span>
                    <span class="font-bold text-error w-10 text-right">{{ log.oppHp }}</span>
                  </div>
                  <div v-if="log.oppActionsAffected" class="flex flex-col items-start gap-0.5">
                    <div class="flex gap-0.5 opacity-30 text-[11px] leading-none">
                      <span v-for="(icon, i) in log.oppActionsAffected.before" :key="i">{{ icon }}</span>
                    </div>
                    <div class="flex gap-0.5 text-[11px] leading-none">
                      <span v-for="(icon, i) in log.oppActionsAffected.after" :key="i">{{ icon }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TransitionGroup>
        </div>
      </TransitionGroup>
    </div>
  </div>
</template>

<style scoped>
  .log-entry-enter-active {
    transition:
      opacity 0.3s ease 0.2s,
      transform 0.3s cubic-bezier(0.22, 1, 0.36, 1) 0.2s;
  }
  .log-entry-enter-from {
    opacity: 0;
    transform: translateY(-8px);
  }
  .log-entry-move {
    transition: transform 0.3s ease;
  }

  .wave-group-enter-active {
    transition: all 0.3s ease;
  }
  .wave-group-enter-from {
    opacity: 0;
    transform: translateY(-6px);
  }
</style>
