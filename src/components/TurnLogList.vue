<script setup lang="ts">
  export interface LogRow {
    wave: number;
    turn: number;
    myHp: number | string;
    myDamage: number;
    mySkillIcon: string;
    oppHp: number | string;
    oppDamage: number;
    oppSkillIcon: string;
    counter: { icon: string; label: string; color: string } | null;
    isActive?: boolean;
  }

  export interface LogGroup {
    wave: number;
    logs: LogRow[];
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

          <TransitionGroup name="log-entry" tag="div" class="flex flex-col gap-1.5">
            <div
              v-for="log in group.logs"
              :key="`${log.wave}-${log.turn}`"
              class="flex items-center px-3 py-2 text-xs transition-colors"
              :class="log.isActive ? 'bg-primary/15 ring-1 ring-primary/30' : 'bg-base-200'"
              style="grid-template-columns: 1fr 9rem 1fr"
            >
              <!-- Me: HP · damage · icon → right-aligned -->
              <div class="flex items-center justify-end gap-2 tabular-nums w-2/5">
                <span class="font-bold text-primary w-10 text-left">{{ log.myHp }}</span>
                <span v-if="log.myDamage > 0" class="text-error font-semibold w-12 text-center"
                  >-{{ log.myDamage }}❤️</span
                >
                <span v-else class="opacity-25 w-12 text-center">❤️</span>
                <span>{{ log.mySkillIcon }}</span>
              </div>

              <!-- Counter: fixed width, centered -->
              <div class="flex justify-center w-full">
                <span
                  v-if="log.counter"
                  class="badge badge-xs font-bold w-fit py-2 justify-center text-[8px]"
                  :class="log.counter.color"
                  >{{ log.counter.icon }}{{ log.counter.label }}</span
                >
                <span v-else class="opacity-20">⚔️</span>
              </div>

              <!-- Opponent: icon · damage · HP → left-aligned -->
              <div class="flex items-center gap-2 tabular-nums w-2/5">
                <span>{{ log.oppSkillIcon }}</span>
                <span v-if="log.oppDamage > 0" class="text-error font-semibold w-12 text-center"
                  >-{{ log.oppDamage }}❤️</span
                >
                <span v-else class="opacity-25 w-12 text-center">❤️</span>
                <span class="font-bold text-error w-10 text-right">{{ log.oppHp }}</span>
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
