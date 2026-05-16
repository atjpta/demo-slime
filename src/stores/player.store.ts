import { ref, watch } from "vue";
import { defineStore } from "pinia";

const LS_PLAYER_TOKEN = "slime_player_token";
const LS_PLAYER_ID = "slime_player_id";

export const usePlayerStore = defineStore("player", () => {
  const playerToken = ref(localStorage.getItem(LS_PLAYER_TOKEN) ?? "");
  const myPlayer = ref<any>(null);
  const myPlayerId = ref(localStorage.getItem(LS_PLAYER_ID) ?? "");

  watch(playerToken, (val) => {
    if (val) localStorage.setItem(LS_PLAYER_TOKEN, val);
    else localStorage.removeItem(LS_PLAYER_TOKEN);
  });

  watch(myPlayerId, (val) => {
    if (val) localStorage.setItem(LS_PLAYER_ID, val);
    else localStorage.removeItem(LS_PLAYER_ID);
  });

  return { playerToken, myPlayer, myPlayerId };
});
