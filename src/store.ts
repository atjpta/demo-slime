import { ref, reactive, watch } from "vue";
import { defineStore } from "pinia";
import { Client } from "@colyseus/sdk";
import { WS_URL } from "./constants";
import type { BattleState } from "./schemas";

export type Step = "login" | "players" | "queue" | "battle";

const LS_USER_TOKEN = "slime_user_token";
const LS_PLAYER_TOKEN = "slime_player_token";

export const useBattleStore = defineStore("battle", () => {
  const step = ref<Step>(localStorage.getItem(LS_USER_TOKEN) ? "players" : "login");
  const loading = ref(false);

  const userToken = ref(localStorage.getItem(LS_USER_TOKEN) ?? "");
  const playerToken = ref(localStorage.getItem(LS_PLAYER_TOKEN) ?? "");
  const myPlayer = ref<any>(null);
  const myPlayerId = ref("");

  const battleState = ref<BattleState | null>(null);

  const client = new Client(WS_URL);
  const rooms = reactive<{ queue: any; battle: any }>({ queue: null, battle: null });

  watch(userToken, (val) => {
    if (val) localStorage.setItem(LS_USER_TOKEN, val);
    else localStorage.removeItem(LS_USER_TOKEN);
  });

  watch(playerToken, (val) => {
    if (val) localStorage.setItem(LS_PLAYER_TOKEN, val);
    else localStorage.removeItem(LS_PLAYER_TOKEN);
  });

  return {
    step,
    loading,
    userToken,
    playerToken,
    myPlayer,
    myPlayerId,
    battleState,
    client,
    rooms,
  };
});
