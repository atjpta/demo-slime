import { ref, reactive, computed } from "vue";
import { defineStore } from "pinia";
import type { BattleTurnLogState } from "../schemas";

export type InitPlayerData = {
  name: string;
  stats: { hp: number; attack: number; magic: number; defense: number } | null;
  skills: { code: string; type: string }[];
};

const RECONNECT_TOKEN_KEY = "battle_reconnect_token";

export const useBattleStore = defineStore("battle", () => {
  const phase = ref("");
  const wave = ref(0);
  const timeLeft = ref(0);
  const winner = ref("");
  const playerIds = ref<string[]>([]);
  const playerActions = ref<Record<string, number[]>>({});
  const playerReady = ref<Record<string, boolean>>({});
  const initPlayers = ref<Record<string, InitPlayerData>>({});
  const logs = ref<BattleTurnLogState[]>([]);
  const shownLogs = ref<any[]>([]);
  const rooms = reactive<{ queue: any; battle: any }>({ queue: null, battle: null });
  const isReconnecting = ref(false);
  const reconnectAttempts = ref(0);

  const lastLog = computed(() => logs.value.at(-1) ?? null);

  function saveReconnectToken(token: string) {
    localStorage.setItem(RECONNECT_TOKEN_KEY, token);
  }

  function loadReconnectToken(): string | null {
    return localStorage.getItem(RECONNECT_TOKEN_KEY);
  }

  function clearReconnectToken() {
    localStorage.removeItem(RECONNECT_TOKEN_KEY);
  }

  function resetGameData() {
    phase.value = "";
    wave.value = 0;
    timeLeft.value = 0;
    winner.value = "";
    playerIds.value = [];
    playerActions.value = {};
    playerReady.value = {};
    initPlayers.value = {};
    logs.value = [];
    shownLogs.value = [];
  }

  function reset() {
    resetGameData();
    isReconnecting.value = false;
    reconnectAttempts.value = 0;
    clearReconnectToken();
  }

  return {
    phase, wave, timeLeft, winner, playerIds, playerActions, playerReady, initPlayers,
    logs, shownLogs, lastLog, rooms,
    isReconnecting, reconnectAttempts,
    saveReconnectToken, loadReconnectToken, clearReconnectToken,
    resetGameData, reset,
  };
});
